import { z } from 'zod';

export const usuarioSchema = z.object({
  usuNome: z.string().min(1, 'Nome é obrigatório'),
  usuLogin: z.string().min(3, 'Login deve ter pelo menos 3 caracteres'),
  usuSenha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').or(z.literal('')),
  usuEmail: z.string().email('E-mail inválido'),
  usuAvatar: z.string().optional(),
  usuCargo: z.string().optional(),
  usuStatus: z.boolean().optional(),
});
