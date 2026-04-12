export const up = (pgm) => {
  // Drop current FK without cascade
  pgm.dropConstraint('intervalo', 'intervalo_int_cli_id_fkey');
  
  // Create it again with ON DELETE CASCADE
  pgm.addConstraint('intervalo', 'intervalo_int_cli_id_fkey', {
    foreignKeys: {
      columns: 'int_cli_id',
      references: 'cliente(cli_id)',
      onDelete: 'CASCADE',
    },
  });
};

export const down = (pgm) => {
  pgm.dropConstraint('intervalo', 'intervalo_int_cli_id_fkey');
  
  pgm.addConstraint('intervalo', 'intervalo_int_cli_id_fkey', {
    foreignKeys: {
      columns: 'int_cli_id',
      references: 'cliente(cli_id)',
    },
  });
};
