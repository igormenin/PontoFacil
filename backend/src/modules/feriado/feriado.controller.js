import * as feriadoService from './feriado.service.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await feriadoService.listAll();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { fer_data, fer_nome, fer_tipo, fer_fixo } = req.body;
    const result = await feriadoService.create(fer_data, fer_nome, fer_tipo, fer_fixo);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await feriadoService.remove(id);
    res.status(204).send();
  } catch (err) {
    if (err.message === 'Feriado not found') {
      return res.status(404).json({ error: { message: err.message, status: 404 } });
    }
    next(err);
  }
};
