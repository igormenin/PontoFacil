export const up = (pgm) => {
  pgm.createTable('usuario', {
    usu_id: 'id',
    usu_login: { type: 'varchar(100)', notNull: true, unique: true },
    usu_senha: { type: 'text', notNull: true },
  });

  // Seed initial admin user
  pgm.sql(`
    INSERT INTO usuario (usu_login, usu_senha) 
    VALUES ('admin', '$2b$10$x6nmFSr0JWYjs/vdXXFZbels6/MyAep2IK/ODdWE/7AAkkkSECGyNy')
    ON CONFLICT (usu_login) DO NOTHING
  `);
};

export const down = (pgm) => {
  pgm.dropTable('usuario');
};
