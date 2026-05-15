import { useState, useCallback } from 'react';
import { getDatabase } from '../database/db';

export interface DayRecord {
  id: number;
  dia_id?: number | null;
  dia_data: string;
  dia_tipo: string;
  dia_horas_meta: number;
  dia_observacao?: string | null;
  sync_status: string;
  updated_at: number;
}

export function useDays() {
  const [loading, setLoading] = useState(false);

  const getOrCreateDay = useCallback(async (date: string): Promise<DayRecord> => {
    setLoading(true);
    try {
      const db = await getDatabase();
      
      // Try to find
      const existing = await db.getFirstAsync<any>(
        'SELECT * FROM dia WHERE dia_data = ?',
        [date]
      );

      if (existing) {
        return {
          ...existing,
          dia_horas_meta: Number(existing.dia_horas_meta),
          updated_at: Number(existing.updated_at)
        };
      }

      // Create if not exists
      const now = Date.now();
      const result = await db.runAsync(
        'INSERT INTO dia (dia_data, dia_tipo, dia_horas_meta, sync_status, updated_at) VALUES (?, ?, ?, ?, ?)',
        [date, 'UTIL', 8, 'pending_create', now]
      );

      // Log to sync_queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['dia', result.lastInsertRowId, 'CREATE', JSON.stringify({ dia_data: date, dia_tipo: 'UTIL' }), now]
      );

      return {
        id: result.lastInsertRowId,
        dia_data: date,
        dia_tipo: 'UTIL',
        dia_horas_meta: 8,
        sync_status: 'pending_create',
        updated_at: now
      };
    } catch (error) {
      console.error('Error in getOrCreateDay:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getOrCreateDay, loading };
}
