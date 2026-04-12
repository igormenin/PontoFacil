import * as clienteService from './cliente.service.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await clienteService.listAll();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { cli_nome, cli_ativo } = req.body;
    const data = await clienteService.create(cli_nome, cli_ativo);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await clienteService.update(id, req.body);
    if (!data) return res.status(404).json({ error: { message: 'Cliente not found', status: 404 } });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await clienteService.remove(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
