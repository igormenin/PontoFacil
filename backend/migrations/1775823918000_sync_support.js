/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  // Create trigger function for updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  const tables = ['cliente', 'valor_hora_base', 'feriado', 'mes', 'dia', 'intervalo'];

  tables.forEach(table => {
    pgm.addColumns(table, {
      usu_id: { 
        type: 'integer', 
        references: 'usuario(usu_id)', 
        onDelete: 'CASCADE',
        default: 1 // Link to admin by default
      },
      updated_at: { 
        type: 'timestamptz', 
        notNull: true, 
        default: pgm.func('current_timestamp') 
      },
      deleted_at: { 
        type: 'timestamptz' 
      },
      local_id: { 
        type: 'integer' 
      },
      device_id: { 
        type: 'varchar(255)' 
      }
    });

    // Add index for sync performance
    pgm.createIndex(table, ['usu_id', 'updated_at']);
    pgm.createIndex(table, ['device_id', 'local_id']);

    // Add trigger
    pgm.sql(`
      CREATE TRIGGER update_${table}_updated_at
      BEFORE UPDATE ON ${table}
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    `);
  });
};

export const down = (pgm) => {
  const tables = ['cliente', 'valor_hora_base', 'feriado', 'mes', 'dia', 'intervalo'];

  tables.forEach(table => {
    pgm.sql(`DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table}`);
    pgm.dropColumns(table, ['usu_id', 'updated_at', 'deleted_at', 'local_id', 'device_id']);
  });

  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column()');
};
