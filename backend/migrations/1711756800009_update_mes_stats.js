export const up = (pgm) => {
  pgm.addColumn('mes', {
    mes_dias_trabalhados: { type: 'integer', default: 0 },
    mes_valor_total: { type: 'numeric(10, 2)', default: 0 },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('mes', ['mes_dias_trabalhados', 'mes_valor_total']);
};
