export const up = (pgm) => {
  pgm.addColumn('intervalo', {
    int_anotacoes: { type: 'varchar(1000)', default: null },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('intervalo', 'int_anotacoes');
};
