import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const intervaloSchema = z.object({
  body: z.object({
    diaId: z.number().int(),
    cliId: z.number().int(),
    ordem: z.number().int().min(1).max(7),
    inicio: z.string().regex(timeRegex, { message: 'Formato inválido (HH:MM)' }),
    fim: z.string().regex(timeRegex, { message: 'Formato inválido (HH:MM)' }).optional().nullable(),
    anotacoes: z.string().max(1000).optional().nullable(),
  }),
});

export const updateIntervaloSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    cliId: z.number().int().optional(),
    ordem: z.number().int().min(1).max(7).optional(),
    inicio: z.string().regex(timeRegex).optional(),
    fim: z.string().regex(timeRegex).optional().nullable(),
    anotacoes: z.string().max(1000).optional().nullable(),
  }),
});
