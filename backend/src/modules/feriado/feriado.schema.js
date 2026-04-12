import { z } from 'zod';

export const feriadoSchema = z.object({
  body: z.object({
    ferData: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    ferNome: z.string().min(1),
    ferTipo: z.enum(['NACIONAL', 'ESTADUAL', 'MUNICIPAL', 'FACULTATIVO']).optional(),
    ferFixo: z.boolean().optional(),
  }),
});

export const updateFeriadoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    ferData: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    ferNome: z.string().min(1).optional(),
    ferTipo: z.enum(['NACIONAL', 'ESTADUAL', 'MUNICIPAL', 'FACULTATIVO']).optional(),
    ferFixo: z.boolean().optional(),
  }),
});
