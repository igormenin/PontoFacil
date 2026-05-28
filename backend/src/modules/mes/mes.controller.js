import * as mesService from './mes.service.js';

export const getAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await mesService.listAll(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getByAnoMes = async (req, res, next) => {
  try {
    const { anoMes } = req.params;
    const userId = req.user.id;
    const data = await mesService.getOrCreateMonth(anoMes, userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
