import { getClient } from './src/config/database.js';

async function run() {
  const client = await getClient();
  try {
    const anoMes = process.argv[2] || new Date().toISOString().substring(0, 7);
    console.log(`\n🔄 Iniciando recálculo para o mês: ${anoMes}\n`);
    
    await client.query('BEGIN');

    console.log(`[1/2] Recalculando todos os dias do mês ${anoMes}...`);
    const diaRes = await client.query(`
      UPDATE dia 
      SET 
        dia_horas_total = (SELECT COALESCE(SUM(int_horas), 0) FROM intervalo WHERE int_dia_id = dia.dia_id),
        dia_valor_total = (
            SELECT COALESCE(SUM(horas_por_taxa * taxa), 0)
            FROM (
                SELECT int_valor_hora as taxa, SUM(int_horas) as horas_por_taxa 
                FROM intervalo 
                WHERE int_dia_id = dia.dia_id
                GROUP BY int_valor_hora
            ) t
        )
      WHERE to_char(dia_data, 'YYYY-MM') = $1
    `, [anoMes]);
    console.log(`✅ ${diaRes.rowCount} dias atualizados.`);

    console.log(`[2/2] Recalculando os consolidados mensais de ${anoMes}...`);
    const mesRes = await client.query(`
      UPDATE mes 
      SET 
        mes_dias_uteis = (SELECT COUNT(*) FROM dia WHERE dia_mes_id = mes.mes_id AND dia_conta_util = TRUE),
        mes_dias_trabalhados = (SELECT COUNT(*) FROM dia WHERE dia_mes_id = mes.mes_id AND dia_horas_total > 0),
        mes_realizado = (SELECT COALESCE(SUM(dia_horas_total), 0) FROM dia WHERE dia_mes_id = mes.mes_id),
        mes_valor_total = (
            SELECT COALESCE(SUM(horas_por_taxa * taxa), 0)
            FROM (
                SELECT int_valor_hora as taxa, SUM(int_horas) as horas_por_taxa 
                FROM intervalo i
                JOIN dia d ON i.int_dia_id = d.dia_id
                WHERE d.dia_mes_id = mes.mes_id
                GROUP BY int_valor_hora
            ) t
        )
      WHERE mes_ano_mes = $1
    `, [anoMes]);
    console.log(`✅ ${mesRes.rowCount} meses atualizados.`);

    await client.query('COMMIT');
    console.log(`\n🎉 Recálculo concluído com sucesso!\n`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o recálculo:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
