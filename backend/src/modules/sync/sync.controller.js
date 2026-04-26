import { syncService } from './sync.service.js';
import { logToDb } from '../../utils/log.service.js';

export const push = async (req, res) => {
  const userId = req.user.usu_id;
  try {
    const { mutations } = req.body;
    const deviceId = req.headers['x-device-id'] || 'unknown';

    await logToDb('SYNC_PUSH_REQ', { userId, deviceId, mutationsCount: mutations?.length || 0, mutations });

    if (!Array.isArray(mutations)) {
      return res.status(400).json({ error: 'Mutations must be an array' });
    }

    const results = await syncService.push(userId, deviceId, mutations);
    await logToDb('SYNC_PUSH_RES', { userId, results });
    res.status(200).json({ results });
  } catch (error) {
    console.error('Push error:', error);
    await logToDb('SYNC_PUSH_ERR', { userId, error: error.message });
    res.status(500).json({ error: 'Internal server error during push' });
  }
};

export const pull = async (req, res) => {
  const userId = req.user.usu_id;
  const { lastSyncAt } = req.query;
  try {
    await logToDb('SYNC_PULL_REQ', { userId, lastSyncAt });

    const data = await syncService.pull(userId, lastSyncAt);
    
    // Log simplified data to avoid hitting varchar limit if too many records
    const summary = {
      changesCount: Object.keys(data.changes || {}).reduce((acc, key) => acc + (data.changes[key]?.length || 0), 0),
      serverTime: data.serverTime
    };
    
    await logToDb('SYNC_PULL_RES', { userId, summary, data });
    res.status(200).json(data);
  } catch (error) {
    console.error('Pull error:', error);
    await logToDb('SYNC_PULL_ERR', { userId, error: error.message });
    res.status(500).json({ error: 'Internal server error during pull' });
  }
};
