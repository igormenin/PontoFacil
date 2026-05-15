import { useState, useCallback } from 'react';
import { getDatabase } from '../database/db';

export interface DayRecord {
  id: number;
  diaId?: number | null;
  diaData: string;
  diaTipo: string;
  diaHorasMeta: number;
  diaObservacao?: string | null;
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
        'SELECT * FROM dia WHERE diaData = ?',
        [date]
      );

      if (existing) {
        return {
          ...existing,
          diaHorasMeta: Number(existing.diaHorasMeta),
          updated_at: Number(existing.updated_at)
        };
      }

      // Create if not exists
      const now = Date.now();
      const result = await db.runAsync(
        'INSERT INTO dia (diaData, diaTipo, diaHorasMeta, sync_status, updated_at) VALUES (?, ?, ?, ?, ?)',
        [date, 'UTIL', 8, 'pending_create', now]
      );

      // Log to sync_queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['dia', result.lastInsertRowId, 'CREATE', JSON.stringify({ diaData: date, diaTipo: 'UTIL' }), now]
      );

      return {
        id: result.lastInsertRowId,
        diaData: date,
        diaTipo: 'UTIL',
        diaHorasMeta: 8,
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
