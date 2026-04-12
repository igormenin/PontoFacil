export const up = (pgm) => {
  pgm.createTable('intervalo', {
    int_id: 'id',
    int_dia_id: { 
      type: 'integer', 
      notNull: true, 
      references: 'dia',
      onDelete: 'CASCADE'
    },
    int_cli_id: { 
      type: 'integer', 
      references: 'cliente'
    },
    int_ordem: { type: 'smallint', notNull: true },
    int_inicio: { type: 'time', notNull: true },
    int_fim: { type: 'time' },
    int_horas: { type: 'numeric(10, 2)', default: 0 },
    int_valor_hora: { type: 'numeric(10, 2)' },
    int_valor_total: { type: 'numeric(10, 2)', default: 0 },
  });
};

export const down = (pgm) => {
  pgm.dropTable('intervalo');
};
