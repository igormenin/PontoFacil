import { useState, useCallback, useEffect } from 'react';
import { getDatabase } from '../database/db';

export interface Feriado {
  id: number;
  server_id?: number | null;
  data: string;
  nome: string;
  tipo?: string;
  fixo: number; // 0 or 1
  sync_status: string;
}

export function useFeriados() {
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFeriados = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync<Feriado>(
        'SELECT * FROM feriados ORDER BY data DESC'
      );
      setFeriados(result);
    } catch (error) {
      console.error('Error fetching feriados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addFeriado = async (data: string, nome: string, fixo: number) => {
    try {
      const db = await getDatabase();
      const now = Date.now();
      const result = await db.runAsync(
        'INSERT INTO feriados (data, nome, fixo, sync_status, updated_at) VALUES (?, ?, ?, ?, ?)',
        [data, nome, fixo, 'pending_create', now]
      );
      
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['feriados', result.lastInsertRowId, 'CREATE', JSON.stringify({ data, nome, fixo }), now]
      );

      await fetchFeriados();
    } catch (error) {
      console.error('Error adding feriado:', error);
      throw error;
    }
  };

  const deleteFeriado = async (id: number) => {
    try {
      const db = await getDatabase();
      const now = Date.now();
      
      await db.runAsync('DELETE FROM feriados WHERE id = ?', [id]);
      
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, created_at) VALUES (?, ?, ?, ?)',
        ['feriados', id, 'DELETE', now]
      );

      await fetchFeriados();
    } catch (error) {
      console.error('Error deleting feriado:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchFeriados();
  }, [fetchFeriados]);

  return { feriados, loading, addFeriado, deleteFeriado, refresh: fetchFeriados };
}
