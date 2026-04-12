import * as authService from './auth.service.js';
import { logger } from '../../utils/logger.js';

export const login = async (req, res, next) => {
  try {
    const { login, senha } = req.body;
    const result = await authService.login(login, senha);
    
    res.status(200).json(result);
  } catch (err) {
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({
        error: {
          message: err.message,
          status: 401,
        },
      });
    }
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.json({ success: true, message: 'E-mail de recuperação enviado.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    await authService.resetPassword(email, token, newPassword);
    res.json({ success: true, message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
