import { useState, useCallback, useEffect } from 'react';
import { getDatabase } from '../database/db';
import { calculateDuration } from '../utils/calcHoras';

export interface Interval {
  id: number;
  int_id?: number | null;
  int_dia_id: number;
  int_cli_id: number;
  cliente_nome?: string;
  int_ordem: number;
  int_inicio: string;
  int_fim?: string | null;
  int_anotacoes?: string | null;
  int_valor_hora?: number;
  int_valor_total?: number;
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
        `SELECT i.*, c.cli_nome as cliente_nome 
         FROM intervalo i 
         LEFT JOIN cliente c ON i.int_cli_id = c.id 
         WHERE i.int_dia_id = ? 
         ORDER BY i.int_ordem`,
        [dayId]
      );
      setIntervals(result);
    } catch (error) {
      console.error('Error fetching intervals:', error);
    } finally {
      setLoading(false);
    }
  }, [dayId]);

  const addInterval = async (data: { int_dia_id: number; int_cli_id: number; int_inicio: string; int_fim: string; int_anotacoes: string }) => {
    try {
      const db = await getDatabase();
      const timestamp = Date.now();
      
      // Calculate derived fields
      const horas = data.int_fim ? calculateDuration(data.int_inicio, data.int_fim) : 0;
      
      // Get current valor_hora for client
      const dayRes = await db.getFirstAsync<any>('SELECT dia_data FROM dia WHERE id = ?', [data.int_dia_id]);
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      const dateStr = dayRes?.dia_data || todayStr;
      const anoMes = dateStr.substring(0, 7); // YYYY-MM

      const rateRes = await db.getFirstAsync<any>(
        'SELECT vhb_valor FROM valor_hora_base WHERE vhb_cli_id = ? AND vhb_data_inicio <= ? ORDER BY vhb_data_inicio DESC LIMIT 1',
        [data.int_cli_id, anoMes]
      );
      const valorHora = rateRes?.vhb_valor || 0;
      const valorTotal = horas * valorHora;

      // Determine order
      const countRes = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM intervalo WHERE int_dia_id = ?', [data.int_dia_id]);
      const ordem = (countRes?.count || 0) + 1;

      const result = await db.runAsync(
        `INSERT INTO intervalo (int_dia_id, int_cli_id, int_ordem, int_inicio, int_fim, int_anotacoes, int_valor_hora, int_valor_total, sync_status, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.int_dia_id, data.int_cli_id, ordem, data.int_inicio, data.int_fim || null, data.int_anotacoes || null, valorHora, valorTotal, 'pending_create', timestamp]
      );

      // Log to sync_queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['intervalo', result.lastInsertRowId, 'CREATE', JSON.stringify({ ...data, int_ordem: ordem, int_valor_hora: valorHora, int_valor_total: valorTotal }), timestamp]
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

      const record = await db.getFirstAsync<any>('SELECT int_id FROM intervalo WHERE id = ?', [id]);

      await db.runAsync('DELETE FROM intervalo WHERE id = ?', [id]);

      // Log to sync_queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, server_id, operation, created_at) VALUES (?, ?, ?, ?, ?)',
        ['intervalo', id, record?.int_id || null, 'DELETE', now]
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
