import { useState, useCallback, useEffect } from 'react';
import { getDatabase } from '../database/db';
import { calculateDuration } from '../utils/calcHoras';

export interface Interval {
  id: number;
  server_id?: number | null;
  dia_id: number;
  cliente_id: number;
  cliente_nome?: string;
  ordem: number;
  inicio: string;
  fim?: string | null;
  anotacoes?: string | null;
  valor_hora?: number;
  valor_total?: number;
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
        `SELECT i.*, c.nome as cliente_nome 
         FROM intervalos i 
         LEFT JOIN clientes c ON i.cliente_id = c.id 
         WHERE i.dia_id = ? 
         ORDER BY i.ordem`,
        [dayId]
      );
      setIntervals(result);
    } catch (error) {
      console.error('Error fetching intervals:', error);
    } finally {
      setLoading(false);
    }
  }, [dayId]);

  const addInterval = async (data: Omit<Interval, 'id' | 'sync_status' | 'ordem' | 'valor_total' | 'valor_hora'>) => {
    try {
      const db = await getDatabase();
      const timestamp = Date.now();
      
      // Calculate derived fields
      const horas = data.fim ? calculateDuration(data.inicio, data.fim) : 0;
      
      // Get current valor_hora for client
      const dayRes = await db.getFirstAsync<any>('SELECT data FROM dias WHERE id = ?', [data.dia_id]);
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      const dateStr = dayRes?.data || todayStr;
      const anoMes = dateStr.substring(0, 7); // YYYY-MM

      const rateRes = await db.getFirstAsync<any>(
        'SELECT valor FROM valor_hora_historico WHERE cliente_id = ? AND mes_inicio <= ? ORDER BY mes_inicio DESC LIMIT 1',
        [data.cliente_id, anoMes]
      );
      const valorHora = rateRes?.valor || 0;
      const valorTotal = horas * valorHora;

      // Determine order
      const countRes = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM intervalos WHERE dia_id = ?', [data.dia_id]);
      const ordem = (countRes?.count || 0) + 1;

      const result = await db.runAsync(
        `INSERT INTO intervalos (dia_id, cliente_id, ordem, inicio, fim, anotacoes, valor_hora, valor_total, sync_status, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.dia_id, data.cliente_id, ordem, data.inicio, data.fim || null, data.anotacoes || null, valorHora, valorTotal, 'pending_create', timestamp]
      );

      // Log to sync_queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['intervalos', result.lastInsertRowId, 'CREATE', JSON.stringify({ ...data, ordem, valorHora, valorTotal }), timestamp]
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

      const record = await db.getFirstAsync<any>('SELECT server_id FROM intervalos WHERE id = ?', [id]);

      await db.runAsync('DELETE FROM intervalos WHERE id = ?', [id]);

      // Log to sync_queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, server_id, operation, created_at) VALUES (?, ?, ?, ?, ?)',
        ['intervalos', id, record?.server_id || null, 'DELETE', now]
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
