/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('configuracao_smtp', {
    smtp_id: 'id',
    smtp_host: { type: 'varchar(255)', notNull: true },
    smtp_port: { type: 'integer', notNull: true },
    smtp_user: { type: 'varchar(255)', notNull: true },
    smtp_pass: { type: 'varchar(255)', notNull: true },
    smtp_from_email: { type: 'varchar(255)', notNull: true },
    smtp_from_name: { type: 'varchar(255)', notNull: true },
    smtp_secure: { type: 'boolean', default: false },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // Seed default dummy config
  pgm.sql(`
    INSERT INTO configuracao_smtp (smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_email, smtp_from_name)
    VALUES ('smtp.example.com', 587, 'user@example.com', 'password', 'noreply@pontofacil.app', 'Ponto Fácil')
  `);
};

export const down = (pgm) => {
  pgm.dropTable('configuracao_smtp');
};
