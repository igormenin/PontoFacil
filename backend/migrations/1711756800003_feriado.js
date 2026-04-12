export const up = (pgm) => {
  pgm.createTable('feriado', {
    fer_id: 'id',
    fer_data: { type: 'date', notNull: true, unique: true },
    fer_nome: { type: 'varchar(255)', notNull: true },
    fer_tipo: { type: 'varchar(50)' },
  });
};

export const down = (pgm) => {
  pgm.dropTable('feriado');
};
