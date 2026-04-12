import * as configuracaoService from './configuracao.service.js';

export const getConfig = async (req, res) => {
  try {
    const config = await configuracaoService.getConfig();
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateConfig = async (req, res) => {
  try {
    await configuracaoService.updateConfig(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
