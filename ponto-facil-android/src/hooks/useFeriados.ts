import { useState, useCallback, useEffect } from 'react';
import { getDatabase } from '../database/db';

export interface Feriado {
  id: number;
  server_id?: number | null;
  fer_data: string;
  fer_nome: string;
  fer_tipo?: string;
  fer_fixo: number; // 0 or 1
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
        'SELECT * FROM feriado ORDER BY fer_data ASC'
      );
      setFeriados(result);
    } catch (error) {
      console.error('Error fetching feriados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addFeriado = async (data: string, nome: string, fixo: number, tipo: string = 'NACIONAL') => {
    try {
      const db = await getDatabase();
      const now = Date.now();
      const result = await db.runAsync(
        'INSERT INTO feriado (fer_data, fer_nome, fer_tipo, fer_fixo, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [data, nome, tipo, fixo, 'pending_create', now]
      );
      
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['feriado', result.lastInsertRowId, 'CREATE', JSON.stringify({ fer_data: data, fer_nome: nome, fer_tipo: tipo, fer_fixo: fixo }), now]
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
      
      const record = await db.getFirstAsync<any>('SELECT server_id FROM feriado WHERE id = ?', [id]);
      
      await db.runAsync('DELETE FROM feriado WHERE id = ?', [id]);
      
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, server_id, operation, created_at) VALUES (?, ?, ?, ?, ?)',
        ['feriado', id, record?.server_id || null, 'DELETE', now]
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
