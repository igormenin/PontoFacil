import { useState, useCallback, useEffect } from 'react';
import { getDatabase } from '../database/db';

export interface ValorHora {
  id: number;
  vhId?: number | null;
  vhCliId: number;
  vhValor: number;
  vhMesInicio: string; // YYYY-MM
  vhAtivo: number;
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
        'SELECT * FROM valor_hora WHERE vhCliId = ? ORDER BY vhMesInicio DESC',
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
        'INSERT INTO valor_hora (vhCliId, vhValor, vhMesInicio, vhAtivo, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [clienteId, valor, mes_inicio, 1, 'pending_create', now]
      );
      
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['valor_hora', result.lastInsertRowId, 'CREATE', JSON.stringify({ vhCliId: clienteId, vhValor: valor, vhMesInicio: mes_inicio }), now]
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
      
      const record = await db.getFirstAsync<any>('SELECT vhId FROM valor_hora WHERE id = ?', [id]);
      
      await db.runAsync('DELETE FROM valor_hora WHERE id = ?', [id]);
      
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, server_id, operation, created_at) VALUES (?, ?, ?, ?, ?)',
        ['valor_hora', id, record?.vhId || null, 'DELETE', now]
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
