import { useState, useCallback } from 'react';
import { getDatabase } from '../database/db';

export interface DayRecord {
  id: number;
  server_id?: number | null;
  data: string;
  tipo: string;
  horas_meta: number;
  observacao?: string | null;
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
        'SELECT * FROM dias WHERE data = ?',
        [date]
      );

      if (existing) {
        return {
          ...existing,
          horas_meta: Number(existing.horas_meta),
          updated_at: Number(existing.updated_at)
        };
      }

      // Create if not exists
      const now = Date.now();
      const result = await db.runAsync(
        'INSERT INTO dias (data, tipo, horas_meta, sync_status, updated_at) VALUES (?, ?, ?, ?, ?)',
        [date, 'UTIL', 8, 'pending_create', now]
      );

      // Log to sync_queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['dias', result.lastInsertRowId, 'CREATE', JSON.stringify({ data: date, tipo: 'UTIL' }), now]
      );

      return {
        id: result.lastInsertRowId,
        data: date,
        tipo: 'UTIL',
        horas_meta: 8,
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
