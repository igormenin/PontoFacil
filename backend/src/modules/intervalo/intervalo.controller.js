import * as intervaloService from './intervalo.service.js';

export const create = async (req, res, next) => {
  try {
    const data = await intervaloService.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await intervaloService.update(id, req.body);
        res.json(data);
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        await intervaloService.remove(id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
