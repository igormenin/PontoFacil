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
  pgm.addColumns('usuario', {
    usu_nome: { type: 'varchar(255)', default: '' },
    usu_email: { type: 'varchar(255)', unique: true },
    usu_avatar: { type: 'text' }, // Base64
    usu_cargo: { type: 'varchar(100)' },
    usu_status: { type: 'boolean', default: true },
    usu_reset_token: { type: 'varchar(255)' },
    usu_reset_expires: { type: 'timestamp' },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // Update initial admin
  pgm.sql(`
    UPDATE usuario 
    SET usu_nome = 'Administrador', 
        usu_email = 'admin@pontofacil.app',
        usu_cargo = 'Gestor'
    WHERE usu_login = 'admin'
  `);
};

export const down = (pgm) => {
  pgm.dropColumns('usuario', [
    'usu_nome', 'usu_email', 'usu_avatar', 'usu_cargo', 
    'usu_status', 'usu_reset_token', 'usu_reset_expires', 'updated_at'
  ]);
};
