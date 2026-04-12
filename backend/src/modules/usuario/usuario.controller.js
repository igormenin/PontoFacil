import * as usuarioService from './usuario.service.js';
import { usuarioSchema } from './usuario.schema.js';

export const getAll = async (req, res) => {
  try {
    const users = await usuarioService.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = usuarioSchema.parse(req.body);
    const id = await usuarioService.create(data);
    res.status(201).json({ id });
  } catch (error) {
    res.status(400).json({ error: error.message || error });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = usuarioSchema.parse(req.body);
    await usuarioService.update(id, data);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message || error });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await usuarioService.remove(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    await usuarioService.resetPassword(id);
    res.json({ success: true, message: 'Senha resetada para Ponto@123' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
