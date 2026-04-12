import { z } from 'zod';

export const clienteSchema = z.object({
  body: z.object({
    cliNome: z.string().min(1),
    cliAtivo: z.boolean().optional(),
  }),
});

export const updateClienteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    cliNome: z.string().min(1).optional(),
    cliAtivo: z.boolean().optional(),
  }),
});
