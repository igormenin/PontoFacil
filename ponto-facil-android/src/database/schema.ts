export const SQL_SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS cliente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cli_id INTEGER UNIQUE,
    cli_nome TEXT NOT NULL,
    cli_cnpj TEXT,
    cli_ativo INTEGER DEFAULT 1,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dia_id INTEGER UNIQUE,
    dia_data TEXT UNIQUE NOT NULL,
    dia_tipo TEXT NOT NULL, -- UTIL, SABADO, DOMINGO, FERIADO
    dia_horas_meta INTEGER DEFAULT 8,
    dia_observacao TEXT,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS intervalo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    int_id INTEGER UNIQUE,
    int_dia_id INTEGER NOT NULL,
    int_cli_id INTEGER NOT NULL,
    int_ordem INTEGER NOT NULL,
    int_inicio TEXT NOT NULL,
    int_fim TEXT,
    int_anotacoes TEXT,
    int_valor_hora REAL,
    int_valor_total REAL,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (int_dia_id) REFERENCES dia(id) ON DELETE CASCADE,
    FOREIGN KEY (int_cli_id) REFERENCES cliente(id)
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

  CREATE TABLE IF NOT EXISTS mes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mes_id INTEGER UNIQUE,
    mes_ano_mes TEXT UNIQUE NOT NULL, -- YYYY-MM
    mes_valor_hora REAL,
    mes_horas_meta INTEGER DEFAULT 0,
    mes_horas_dia INTEGER DEFAULT 8,
    mes_dias_uteis INTEGER DEFAULT 0,
    mes_estimativa REAL DEFAULT 0,
    mes_realizado REAL DEFAULT 0,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feriado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fer_id INTEGER UNIQUE,
    fer_data TEXT UNIQUE NOT NULL,
    fer_nome TEXT NOT NULL,
    fer_tipo TEXT,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS valor_hora_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vhb_id INTEGER UNIQUE,
    vhb_cli_id INTEGER NOT NULL,
    vhb_valor REAL NOT NULL,
    vhb_data_inicio TEXT NOT NULL, -- YYYY-MM
    vhb_ativo INTEGER DEFAULT 1,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (vhb_cli_id) REFERENCES cliente(id) ON DELETE CASCADE
  );
`;
