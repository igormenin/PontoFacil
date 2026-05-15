export const SQL_SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS cliente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliId INTEGER UNIQUE,
    cliNome TEXT NOT NULL,
    cliCnpj TEXT,
    cliAtivo INTEGER DEFAULT 1,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diaId INTEGER UNIQUE,
    diaData TEXT UNIQUE NOT NULL,
    diaTipo TEXT NOT NULL, -- UTIL, SABADO, DOMINGO, FERIADO
    diaHorasMeta REAL DEFAULT 8,
    diaObservacao TEXT,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS intervalo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intId INTEGER UNIQUE,
    intDiaId INTEGER NOT NULL,
    intCliId INTEGER NOT NULL,
    intOrdem INTEGER NOT NULL,
    intInicio TEXT NOT NULL,
    intFim TEXT,
    intAnotacoes TEXT,
    intValorHora REAL,
    intValorTotal REAL,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (intDiaId) REFERENCES dia(id) ON DELETE CASCADE,
    FOREIGN KEY (intCliId) REFERENCES cliente(id)
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
    mesId INTEGER UNIQUE,
    mesAnoMes TEXT UNIQUE NOT NULL, -- YYYY-MM
    mesValorHora REAL,
    mesHorasMeta REAL DEFAULT 0,
    mesHorasDia REAL DEFAULT 8,
    mesDiasUteis INTEGER DEFAULT 0,
    mesEstimativa REAL DEFAULT 0,
    mesRealizado REAL DEFAULT 0,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feriado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ferId INTEGER UNIQUE,
    ferData TEXT UNIQUE NOT NULL,
    ferNome TEXT NOT NULL,
    ferTipo TEXT,
    ferFixo INTEGER DEFAULT 0,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS valor_hora (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vhId INTEGER UNIQUE,
    vhCliId INTEGER NOT NULL,
    vhValor REAL NOT NULL,
    vhMesInicio TEXT NOT NULL, -- YYYY-MM
    vhAtivo INTEGER DEFAULT 1,
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (vhCliId) REFERENCES cliente(id) ON DELETE CASCADE
  );
`;
