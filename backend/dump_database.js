import dotenv from 'dotenv';
dotenv.config();
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Pool } = pg;

const rootDir = path.resolve('..');
const dumpDir = path.join(rootDir, 'dumpdatabase');

// Ensure dumpdatabase directory exists
if (!fs.existsSync(dumpDir)) {
  fs.mkdirSync(dumpDir, { recursive: true });
}

// Generate filename based on timestamp
const now = new Date();
const timestamp = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
const dumpFilename = `dump_${timestamp}.sql`;
const dumpPath = path.join(dumpDir, dumpFilename);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Erro: DATABASE_URL não encontrada no arquivo .env');
  process.exit(1);
}

// Try running pg_dump first, fallback to JS backup if it fails
async function main() {
  console.log(` Iniciando FULL DUMP do banco de dados...`);
  console.log(`Destino: ${dumpPath}`);

  try {
    await runPgDump();
  } catch (err) {
    console.warn(`\n⚠️ pg_dump não disponível ou falhou (${err.message}). Iniciando fallback em JavaScript puro...`);
    await runJsFallbackDump();
  }
}

function runPgDump() {
  return new Promise((resolve, reject) => {
    // Hide password from console log
    const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':******@');
    console.log(`Tentando executar pg_dump com a URL: ${maskedUrl}`);

    // Call pg_dump directly
    const command = `pg_dump "${databaseUrl}" -f "${dumpPath}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      console.log(`✅ pg_dump concluído com sucesso!`);
      resolve();
    });
  });
}

async function runJsFallbackDump() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const stream = fs.createWriteStream(dumpPath, { encoding: 'utf8' });
    
    stream.write(`--\n-- Ponto Fácil Database Dump (Fallback JS)\n-- Gerado em: ${now.toLocaleString('pt-BR')}\n--\n\n`);
    stream.write(`SET statement_timeout = 0;\nSET lock_timeout = 0;\nSET client_encoding = 'UTF8';\n\n`);

    // 1. Fetch all public tables
    const tablesRes = await pool.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
       AND table_name NOT IN ('spatial_ref_sys')`
    );

    // Order tables to respect typical foreign keys (usuario/cliente first, then others, then intervalo)
    const customOrder = ['usuario', 'cliente', 'configuracao_smtp', 'mes', 'dia', 'feriado', 'valor_hora_base', 'intervalo', 'logs'];
    const tables = tablesRes.rows.map(r => r.table_name).sort((a, b) => {
      let idxA = customOrder.indexOf(a);
      let idxB = customOrder.indexOf(b);
      if (idxA === -1) idxA = 99;
      if (idxB === -1) idxB = 99;
      return idxA - idxB;
    });

    for (const table of tables) {
      console.log(`Exportando tabela: ${table}...`);
      stream.write(`--\n-- Dados da tabela: ${table}\n--\n\n`);

      // Disable triggers temporarily
      stream.write(`ALTER TABLE public.${table} DISABLE TRIGGER ALL;\n`);

      // 2. Fetch columns info
      const colsRes = await pool.query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = $1 
         ORDER BY ordinal_position`,
        [table]
      );
      
      const columns = colsRes.rows.map(c => c.column_name);
      
      // 3. Fetch all rows
      const rowsRes = await pool.query(`SELECT * FROM public.${table}`);
      
      for (const row of rowsRes.rows) {
        const values = [];
        for (const col of colsRes.rows) {
          const val = row[col.column_name];
          if (val === null || val === undefined) {
            values.push('NULL');
          } else if (typeof val === 'boolean') {
            values.push(val ? 'true' : 'false');
          } else if (typeof val === 'number') {
            values.push(val.toString());
          } else if (val instanceof Date) {
            values.push(`'${val.toISOString()}'`);
          } else {
            // String escaping
            const escaped = val.toString().replace(/'/g, "''");
            values.push(`'${escaped}'`);
          }
        }

        stream.write(
          `INSERT INTO public.${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`
        );
      }

      // Re-enable triggers
      stream.write(`ALTER TABLE public.${table} ENABLE TRIGGER ALL;\n\n`);
    }

    stream.end();
    console.log(`✅ Fallback JS concluído com sucesso! Arquivo salvo em: ${dumpPath}`);

  } catch (err) {
    console.error('❌ Falha ao gerar o fallback dump:', err);
    // Delete incomplete file if error occurs
    if (fs.existsSync(dumpPath)) {
      fs.unlinkSync(dumpPath);
    }
  } finally {
    await pool.end();
  }
}

main();
