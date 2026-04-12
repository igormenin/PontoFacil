export const SQL_SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER UNIQUE,
    nome TEXT NOT NULL,
    cnpj TEXT,
    ativo INTEGER DEFAULT 1,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER UNIQUE,
    data TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL, -- UTIL, SABADO, DOMINGO, FERIADO
    horas_meta INTEGER DEFAULT 8,
    observacao TEXT,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS intervalos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER UNIQUE,
    dia_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    ordem INTEGER NOT NULL,
    inicio TEXT NOT NULL,
    fim TEXT,
    anotacoes TEXT,
    valor_hora REAL,
    valor_total REAL,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (dia_id) REFERENCES dias(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    local_id INTEGER,
    server_id INTEGER,
    operation TEXT NOT NULL, -- CREATE, UPDATE, DELETE
    payload TEXT, -- JSON string
    created_at INTEGER NOT NULL
  );
`;
