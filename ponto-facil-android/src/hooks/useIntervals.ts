import { useState, useCallback, useEffect } from 'react';
import { getDatabase } from '../database/db';
import { calculateDuration } from '../utils/calcHoras';

export interface Interval {
  id: number;
  intId?: number | null;
  intDiaId: number;
  intCliId: number;
  clienteNome?: string;
  intOrdem: number;
  intInicio: string;
  intFim?: string | null;
  intAnotacoes?: string | null;
  intValorHora?: number;
  intValorTotal?: number;
  sync_status: string;
}

export function useIntervals(dayId?: number) {
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIntervals = useCallback(async () => {
    if (!dayId) return;
    setLoading(true);
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync<any>(
        `SELECT i.*, c.cliNome as clienteNome 
         FROM intervalo i 
         LEFT JOIN cliente c ON i.intCliId = c.id 
         WHERE i.intDiaId = ? 
         ORDER BY i.intOrdem`,
        [dayId]
      );
      setIntervals(result);
    } catch (error) {
      console.error('Error fetching intervals:', error);
    } finally {
      setLoading(false);
    }
  }, [dayId]);

  const addInterval = async (data: { intDiaId: number; intCliId: number; intInicio: string; intFim: string; intAnotacoes: string }) => {
    try {
      const db = await getDatabase();
      const timestamp = Date.now();
      
      // Calculate derived fields
      const horas = data.intFim ? calculateDuration(data.intInicio, data.intFim) : 0;
      
      // Get current valor_hora for client
      const dayRes = await db.getFirstAsync<any>('SELECT diaData FROM dia WHERE id = ?', [data.intDiaId]);
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      const dateStr = dayRes?.diaData || todayStr;
      const anoMes = dateStr.substring(0, 7); // YYYY-MM

      const rateRes = await db.getFirstAsync<any>(
        'SELECT vhValor FROM valor_hora WHERE vhCliId = ? AND vhMesInicio <= ? ORDER BY vhMesInicio DESC LIMIT 1',
        [data.intCliId, anoMes]
      );
      const valorHora = rateRes?.vhValor || 0;
      const valorTotal = horas * valorHora;

      // Determine order
      const countRes = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM intervalo WHERE intDiaId = ?', [data.intDiaId]);
      const ordem = (countRes?.count || 0) + 1;

      const result = await db.runAsync(
        `INSERT INTO intervalo (intDiaId, intCliId, intOrdem, intInicio, intFim, intAnotacoes, intValorHora, intValorTotal, sync_status, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.intDiaId, data.intCliId, ordem, data.intInicio, data.intFim || null, data.intAnotacoes || null, valorHora, valorTotal, 'pending_create', timestamp]
      );

      // Log to sync_queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['intervalo', result.lastInsertRowId, 'CREATE', JSON.stringify({ ...data, intOrdem: ordem, intValorHora: valorHora, intValorTotal: valorTotal }), timestamp]
      );

      await fetchIntervals();
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding interval:', error);
      throw error;
    }
  };

  const deleteInterval = async (id: number) => {
    try {
      const db = await getDatabase();
      const now = Date.now();

      const record = await db.getFirstAsync<any>('SELECT intId FROM intervalo WHERE id = ?', [id]);

      await db.runAsync('DELETE FROM intervalo WHERE id = ?', [id]);

      // Log to sync_queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, server_id, operation, created_at) VALUES (?, ?, ?, ?, ?)',
        ['intervalo', id, record?.intId || null, 'DELETE', now]
      );

      await fetchIntervals();
    } catch (error) {
      console.error('Error deleting interval:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchIntervals();
  }, [fetchIntervals]);

  return { intervals, loading, addInterval, deleteInterval, refresh: fetchIntervals };
}
