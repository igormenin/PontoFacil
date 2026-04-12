export const up = (pgm) => {
  pgm.createTable('cliente', {
    cli_id: 'id',
    cli_nome: { type: 'varchar(255)', notNull: true },
    cli_ativo: { type: 'boolean', default: true },
  });

  // Seed initial client
  pgm.sql(`
    INSERT INTO cliente (cli_nome, cli_ativo) VALUES ('Exemplo S.A.', TRUE)
  `);
};

export const down = (pgm) => {
  pgm.dropTable('cliente');
};
