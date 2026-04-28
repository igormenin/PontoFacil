/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('dispositivo_sincronizacao', {
    dis_id: 'id',
    usu_id: { type: 'integer', notNull: true, references: 'usuario', onDelete: 'CASCADE' },
    dis_device_id: { type: 'varchar(255)', notNull: true },
    dis_ultima_sincronizacao: { type: 'timestamptz', default: pgm.func('current_timestamp') },
    dis_max_ids: { type: 'jsonb', notNull: true, default: '{}' }
  });
  pgm.addConstraint('dispositivo_sincronizacao', 'unique_user_device', {
    unique: ['usu_id', 'dis_device_id']
  });
};

export const down = (pgm) => {
  pgm.dropTable('dispositivo_sincronizacao');
};
