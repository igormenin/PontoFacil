import * as diaService from './dia.service.js';

export const getByMonth = async (req, res, next) => {
  try {
    const { anoMes } = req.params;
    const data = await diaService.listByMonth(anoMes);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { data } = req.params;
    const result = await diaService.update(data, req.body);
    if (!result) return res.status(404).json({ error: { message: 'Day not found', status: 404 } });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
