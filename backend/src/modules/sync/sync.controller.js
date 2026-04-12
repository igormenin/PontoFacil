import { syncService } from './sync.service.js';

export const push = async (req, res) => {
  try {
    const { mutations } = req.body;
    const userId = req.user.usu_id;
    const deviceId = req.headers['x-device-id'] || 'unknown';

    if (!Array.isArray(mutations)) {
      return res.status(400).json({ error: 'Mutations must be an array' });
    }

    const results = await syncService.push(userId, deviceId, mutations);
    res.status(200).json({ results });
  } catch (error) {
    console.error('Push error:', error);
    res.status(500).json({ error: 'Internal server error during push' });
  }
};

export const pull = async (req, res) => {
  try {
    const userId = req.user.usu_id;
    const { lastSyncAt } = req.query;

    const data = await syncService.pull(userId, lastSyncAt);
    res.status(200).json(data);
  } catch (error) {
    console.error('Pull error:', error);
    res.status(500).json({ error: 'Internal server error during pull' });
  }
};
