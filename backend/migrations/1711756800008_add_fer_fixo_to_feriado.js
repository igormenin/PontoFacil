export const up = (pgm) => {
  pgm.addColumn('feriado', {
    fer_fixo: { type: 'boolean', default: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('feriado', 'fer_fixo');
};
