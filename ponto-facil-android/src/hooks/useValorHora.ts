import { useState, useCallback, useEffect } from 'react';
import { getDatabase } from '../database/db';

export interface ValorHora {
  id: number;
  server_id?: number | null;
  cliente_id: number;
  valor: number;
  mes_inicio: string; // YYYY-MM
  ativo: number;
  sync_status: string;
}

export function useValorHora(clienteId?: number) {
  const [valores, setValores] = useState<ValorHora[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchValores = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync<ValorHora>(
        'SELECT * FROM valor_hora_historico WHERE cliente_id = ? ORDER BY mes_inicio DESC',
        [clienteId]
      );
      setValores(result);
    } catch (error) {
      console.error('Error fetching valor hora:', error);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  const addValor = async (valor: number, mes_inicio: string) => {
    if (!clienteId) return;
    try {
      const db = await getDatabase();
      const now = Date.now();
      const result = await db.runAsync(
        'INSERT INTO valor_hora_historico (cliente_id, valor, mes_inicio, ativo, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [clienteId, valor, mes_inicio, 1, 'pending_create', now]
      );
      
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['valor_hora_historico', result.lastInsertRowId, 'CREATE', JSON.stringify({ cliente_id: clienteId, valor, mes_inicio }), now]
      );

      await fetchValores();
    } catch (error) {
      console.error('Error adding valor hora:', error);
      throw error;
    }
  };

  const deleteValor = async (id: number) => {
    try {
      const db = await getDatabase();
      const now = Date.now();
      
      await db.runAsync('DELETE FROM valor_hora_historico WHERE id = ?', [id]);
      
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, created_at) VALUES (?, ?, ?, ?)',
        ['valor_hora_historico', id, 'DELETE', now]
      );

      await fetchValores();
    } catch (error) {
      console.error('Error deleting valor hora:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchValores();
  }, [fetchValores]);

  return { valores, loading, addValor, deleteValor, refresh: fetchValores };
}
