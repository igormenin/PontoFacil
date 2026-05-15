import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../database/db';

export interface Client {
  id: number;
  cli_id?: number | null;
  cli_nome: string;
  cli_cnpj?: string | null;
  cli_ativo: boolean;
  sync_status: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync<any>('SELECT * FROM cliente ORDER BY cli_nome');
      const mapped = result.map(row => ({
        ...row,
        cli_ativo: !!row.cli_ativo
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
        'INSERT INTO cliente (cli_nome, cli_cnpj, cli_ativo, sync_status, updated_at) VALUES (?, ?, ?, ?, ?)',
        [nome, cnpj || null, 1, 'pending_create', now]
      );

      // Log to sync_queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        ['cliente', result.lastInsertRowId, 'CREATE', JSON.stringify({ cli_nome: nome, cli_cnpj: cnpj }), now]
      );

      await fetchClients();
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  };

  const deleteClient = async (id: number) => {
    try {
      const db = await getDatabase();
      const now = Date.now();
      
      const client = await db.getFirstAsync<any>('SELECT cli_id FROM cliente WHERE id = ?', [id]);
      
      await db.runAsync('DELETE FROM cliente WHERE id = ?', [id]);
      
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, local_id, server_id, operation, created_at) VALUES (?, ?, ?, ?, ?)',
        ['cliente', id, client?.cli_id || null, 'DELETE', now]
      );

      await fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, loading, addClient, deleteClient, refresh: fetchClients };
}
