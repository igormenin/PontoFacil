-- Ponto Facil Database Schema

-- USUARIO
CREATE TABLE IF NOT EXISTS usuario (
    usu_id SERIAL PRIMARY KEY,
    usu_login VARCHAR(100) UNIQUE NOT NULL,
    usu_senha TEXT NOT NULL
);

-- CLIENTE
CREATE TABLE IF NOT EXISTS cliente (
    cli_id SERIAL PRIMARY KEY,
    cli_nome VARCHAR(255) NOT NULL,
    cli_ativo BOOLEAN DEFAULT TRUE
);

-- VALOR HORA BASE
CREATE TABLE IF NOT EXISTS valor_hora_base (
    vh_id SERIAL PRIMARY KEY,
    vh_cli_id INT REFERENCES cliente(cli_id) ON DELETE CASCADE,
    vh_valor NUMERIC(10, 2) NOT NULL,
    vh_mes_inicio DATE NOT NULL,
    vh_ativo BOOLEAN DEFAULT TRUE
);

-- UNIQUE INDEX for active value per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_vh_ativo_cli ON valor_hora_base (vh_cli_id) WHERE vh_ativo = TRUE;

-- FERIADO
CREATE TABLE IF NOT EXISTS feriado (
    fer_id SERIAL PRIMARY KEY,
    fer_data DATE UNIQUE NOT NULL,
    fer_nome VARCHAR(255) NOT NULL,
    fer_tipo VARCHAR(50) -- ex: NACIONAL, MUNICIPAL, FACULTATIVO
);

-- MES
CREATE TABLE IF NOT EXISTS mes (
    mes_id SERIAL PRIMARY KEY,
    mes_ano_mes CHAR(7) UNIQUE NOT NULL, -- Format: YYYY-MM
    mes_valor_hora NUMERIC(10, 2),
    mes_horas_meta INT DEFAULT 0,
    mes_horas_dia INT DEFAULT 8,
    mes_dias_uteis INT DEFAULT 0,
    mes_estimativa NUMERIC(10, 2) DEFAULT 0,
    mes_realizado NUMERIC(10, 2) DEFAULT 0
);

-- DIA
CREATE TABLE IF NOT EXISTS dia (
    dia_id SERIAL PRIMARY KEY,
    dia_data DATE UNIQUE NOT NULL,
    dia_mes_id INT REFERENCES mes(mes_id) ON DELETE CASCADE,
    dia_tipo VARCHAR(50) NOT NULL, -- UTIL, SABADO, DOMINGO, FERIADO
    dia_conta_util BOOLEAN DEFAULT TRUE,
    dia_pode_horas BOOLEAN DEFAULT TRUE,
    dia_horas_total NUMERIC(10, 2) DEFAULT 0,
    dia_valor_total NUMERIC(10, 2) DEFAULT 0,
    dia_observacao TEXT
);

-- INTERVALO
CREATE TABLE IF NOT EXISTS intervalo (
    int_id SERIAL PRIMARY KEY,
    int_dia_id INT REFERENCES dia(dia_id) ON DELETE CASCADE,
    int_cli_id INT REFERENCES cliente(cli_id),
    int_ordem SMALLINT NOT NULL,
    int_inicio TIME NOT NULL,
    int_fim TIME,
    int_horas NUMERIC(10, 2) DEFAULT 0,
    int_valor_hora NUMERIC(10, 2),
    int_valor_total NUMERIC(10, 2) DEFAULT 0
);

-- SEEDING
-- Initial User: admin / admin123
INSERT INTO usuario (usu_login, usu_senha) 
VALUES ('admin', '$2b$10$z/sPtK9LK97a1/bgO07zbuiZQwMLRacjORCWwlhEpmrLOYYMbhFYK')
ON CONFLICT (usu_login) DO NOTHING;

-- Initial Client: Exemplo S.A.
INSERT INTO cliente (cli_nome, cli_ativo) VALUES ('Exemplo S.A.', TRUE);

