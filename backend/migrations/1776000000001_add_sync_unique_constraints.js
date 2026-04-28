/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  const tables = ['cliente', 'valor_hora_base', 'feriado', 'mes', 'dia', 'intervalo'];

  // Add a unique constraint to ensure no duplicate sync pushes
  tables.forEach(table => {
    pgm.addConstraint(table, `unique_${table}_sync`, {
      unique: ['usu_id', 'device_id', 'local_id']
    });
  });
};

export const down = (pgm) => {
  const tables = ['cliente', 'valor_hora_base', 'feriado', 'mes', 'dia', 'intervalo'];

  tables.forEach(table => {
    pgm.dropConstraint(table, `unique_${table}_sync`);
  });
};
