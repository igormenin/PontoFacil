import { useState, useCallback, useEffect } from 'react';
import { getDatabase } from '../database/db';

export interface ValorHora {
  id: number;
  vhb_id?: number | null;
  vhb_cli_id: number;
  vhb_valor: number;
  vhb_data_inicio: string; // YYYY-MM
  vhb_ativo: number;
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
        'SELECT * FROM valor_hora_base WHERE vhb_cli_id = ? ORDER BY vhb_data_inicio DESC',
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
        'INSERT INTO valor_hora_base (vhb_cli_id, vhb_valor, vhb_data_inicio, vhb_ativo, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [clienteId, valor, mes_inicio, 1, 'pending_create', now]
      );
      
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['valor_hora_base', result.lastInsertRowId, 'CREATE', JSON.stringify({ vhb_cli_id: clienteId, vhb_valor: valor, vhb_data_inicio: mes_inicio }), now]
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
      
      const record = await db.getFirstAsync<any>('SELECT vhb_id FROM valor_hora_base WHERE id = ?', [id]);
      
      await db.runAsync('DELETE FROM valor_hora_base WHERE id = ?', [id]);
      
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, server_id, operation, created_at) VALUES (?, ?, ?, ?, ?)',
        ['valor_hora_base', id, record?.vhb_id || null, 'DELETE', now]
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
