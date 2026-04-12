import * as mesService from './mes.service.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await mesService.listAll();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getByAnoMes = async (req, res, next) => {
  try {
    const { anoMes } = req.params;
    const data = await mesService.getOrCreateMonth(anoMes);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
