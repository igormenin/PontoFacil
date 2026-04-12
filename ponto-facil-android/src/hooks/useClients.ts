import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../database/db';

export interface Client {
  id: number;
  server_id?: number | null;
  nome: string;
  cnpj?: string | null;
  ativo: boolean;
  sync_status: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync<any>('SELECT * FROM clientes ORDER BY nome');
      const mapped = result.map(row => ({
        ...row,
        ativo: !!row.ativo
      }));
      setClients(mapped);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addClient = async (nome: string, cnpj?: string) => {
    try {
      const db = await getDatabase();
      const now = Date.now();
      
      const result = await db.runAsync(
        'INSERT INTO clientes (nome, cnpj, ativo, sync_status, updated_at) VALUES (?, ?, ?, ?, ?)',
        [nome, cnpj || null, 1, 'pending_create', now]
      );

      // Log to sync_queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['clientes', result.lastInsertRowId, 'CREATE', JSON.stringify({ nome, cnpj }), now]
      );

      await fetchClients();
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, loading, addClient, refresh: fetchClients };
}
