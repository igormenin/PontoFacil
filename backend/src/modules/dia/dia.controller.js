import * as diaService from './dia.service.js';

export const getByMonth = async (req, res, next) => {
  try {
    const { anoMes } = req.params;
    const userId = req.user.id;
    const data = await diaService.listByMonth(anoMes, userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { data } = req.params;
    const userId = req.user.id;
    const result = await diaService.update(data, req.body, userId);
    if (!result) return res.status(404).json({ error: { message: 'Day not found', status: 404 } });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
