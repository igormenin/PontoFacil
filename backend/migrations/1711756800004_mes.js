export const up = (pgm) => {
  pgm.createTable('mes', {
    mes_id: 'id',
    mes_ano_mes: { type: 'char(7)', notNull: true, unique: true },
    mes_valor_hora: { type: 'numeric(10, 2)' },
    mes_horas_meta: { type: 'integer', default: 0 },
    mes_horas_dia: { type: 'integer', default: 8 },
    mes_dias_uteis: { type: 'integer', default: 0 },
    mes_estimativa: { type: 'numeric(10, 2)', default: 0 },
    mes_realizado: { type: 'numeric(10, 2)', default: 0 },
  });
};

export const down = (pgm) => {
  pgm.dropTable('mes');
};
