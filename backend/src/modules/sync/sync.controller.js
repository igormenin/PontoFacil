import { syncService } from './sync.service.js';
import { logToDb } from '../../utils/log.service.js';

export const push = async (req, res) => {
  const userId = req.user.id;
  const isLeitor = req.user.leitor;
  
  try {
    await logToDb('SYNC_PUSH_REQ', { userId, isLeitor });
    
    if (isLeitor) {
      return res.status(403).json({ error: 'Você não tem permissão para realizar alterações (Modo Visualização).' });
    }

    const { mutations } = req.body;
    const deviceId = req.headers['x-device-id'] || 'unknown';

    const results = await syncService.push(userId, deviceId, mutations);
    res.status(200).json({ results });
  } catch (error) {
    console.error('Push error:', error);
    res.status(500).json({ error: 'Internal server error during push' });
  }
};

export const pull = async (req, res) => {
  const userId = req.user.id;
  const isLeitor = req.user.leitor;
  const deviceId = req.headers['x-device-id'] || 'unknown';

  try {
    await logToDb('SYNC_PULL_REQ', { userId, isLeitor, deviceId });

    const data = await syncService.pull(userId, deviceId);
    await logToDb('SYNC_PULL_RES', { userId, changes: Object.keys(data.changes).map(k => `${k}: ${data.changes[k].length}`) });
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Pull error:', error);
    res.status(500).json({ error: 'Internal server error during pull' });
  }
};
