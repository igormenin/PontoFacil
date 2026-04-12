import { z } from 'zod';

export const valorHoraSchema = z.object({
  body: z.object({
    vhCliId: z.number().int(),
    vhValor: z.number().positive(),
    vhMesInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  }),
});

export const getValorHoraSchema = z.object({
  query: z.object({
    cliId: z.string().regex(/^\d+$/),
  }),
});
