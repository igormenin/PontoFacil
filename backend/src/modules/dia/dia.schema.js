import { z } from 'zod';

export const updateDiaSchema = z.object({
  params: z.object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  body: z.object({
    diaObservacao: z.string().optional().nullable(),
  }),
});

export const getDiaSchema = z.object({
  params: z.object({
    anoMes: z.string().regex(/^\d{4}-\d{2}$/),
  }),
});
