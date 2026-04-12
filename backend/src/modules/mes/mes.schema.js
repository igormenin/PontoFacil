import { z } from 'zod';

export const getMesSchema = z.object({
  params: z.object({
    anoMes: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  }),
});
