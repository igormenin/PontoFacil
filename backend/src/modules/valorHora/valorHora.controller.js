import * as valorHoraService from './valorHora.service.js';

export const getByCliente = async (req, res, next) => {
  try {
    const { cli_id, cliId } = req.query;
    const clientId = cli_id || cliId;
    if (!clientId) return res.status(400).json({ error: { message: 'cli_id is required', status: 400 } });
    const data = await valorHoraService.listByCliente(clientId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { vh_cli_id, vh_valor, vh_mes_inicio } = req.body;
    const data = await valorHoraService.create(vh_cli_id, vh_valor, vh_mes_inicio);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};
