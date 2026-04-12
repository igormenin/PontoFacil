export const up = (pgm) => {
  pgm.createTable('dia', {
    dia_id: 'id',
    dia_data: { type: 'date', notNull: true, unique: true },
    dia_mes_id: { 
      type: 'integer', 
      notNull: true, 
      references: 'mes',
      onDelete: 'CASCADE'
    },
    dia_tipo: { type: 'varchar(50)', notNull: true },
    dia_conta_util: { type: 'boolean', default: true },
    dia_pode_horas: { type: 'boolean', default: true },
    dia_horas_total: { type: 'numeric(10, 2)', default: 0 },
    dia_valor_total: { type: 'numeric(10, 2)', default: 0 },
    dia_observacao: { type: 'text' },
  });
};

export const down = (pgm) => {
  pgm.dropTable('dia');
};
