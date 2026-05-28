import * as intervaloService from './intervalo.service.js';

export const create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await intervaloService.create(req.body, userId);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const data = await intervaloService.update(id, req.body, userId);
        res.json(data);
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await intervaloService.remove(id, userId);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
