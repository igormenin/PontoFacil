import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { getDatabase } from '../database/db';
import { theme } from '../theme/theme';
import { ArrowLeft, Database, Share2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSync } from '../hooks/useSync';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { useAuthStore } from '../store/useAuthStore';

export default function DatabaseDebugScreen() {
  const navigation = useNavigation();
  const [counts, setCounts] = useState<{table: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const { performSync, syncing } = useSync();
  const { user, token } = useAuthStore();
  const [syncSummary, setSyncSummary] = useState<string>('');

  const loadCounts = async () => {
    try {
      setLoading(true);
      const summary = await AsyncStorage.getItem('@PontoFacil:lastSyncSummary');
      setSyncSummary(summary || 'Nenhum dado recebido ainda');
      
      const db = await getDatabase();
      const tables = ['clientes', 'dias', 'intervalos', 'meses', 'feriados', 'valor_hora_historico', 'sync_queue'];
      const results = [];

      for (const table of tables) {
        try {
          const result = await db.getFirstAsync<any>(`SELECT COUNT(*) as total FROM ${table}`);
          results.push({ table, count: result?.total || 0 });
        } catch (err) {
          results.push({ table, count: -1 });
        }
      }
      setCounts(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const handleForceFullSync = async () => {
    try {
      const db = await getDatabase();
      // Clear queue
      await db.execAsync('DELETE FROM sync_queue');
      // Reset last sync time
      await AsyncStorage.removeItem('@PontoFacil:lastSyncAt');
      
      const success = await performSync();
      if (success) {
        Alert.alert('Sucesso', 'Sincronização completa finalizada com sucesso!');
        loadCounts();
        const updatedSummary = await AsyncStorage.getItem('@PontoFacil:lastSyncSummary');
        setSyncSummary(updatedSummary || 'Sincronizado com sucesso');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro durante a sincronização forçada.');
      }
    } catch (e: any) {
      Alert.alert('Erro fatal', e.message);
    }
  };

  const handleClearLocal = async () => {
    Alert.alert(
      'Atenção',
      'Isso apagará TODOS os dados locais. O que não foi sincronizado será perdido. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar Tudo', style: 'destructive', onPress: async () => {
            try {
              const db = await getDatabase();
              // Executa tudo em uma única chamada para ser mais atômico no Android
              await db.execAsync(`
                DELETE FROM intervalos;
                DELETE FROM dias;
                DELETE FROM clientes;
                DELETE FROM meses;
                DELETE FROM feriados;
                DELETE FROM sync_queue;
              `);
              
              await AsyncStorage.multiRemove([
                '@PontoFacil:lastSyncAt',
                '@PontoFacil:lastSyncSummary'
              ]);

              Alert.alert('Sucesso', 'Banco local zerado.');
              await loadCounts();
            } catch (err: any) {
              Alert.alert('Erro', err.message);
            }
          }
        }
      ]
    );
  };

  const handleExportDB = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/pontofacil.db`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      if (!fileInfo.exists) {
        Alert.alert('Erro', 'Arquivo do banco de dados não encontrado.');
        return;
      }
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo.');
        return;
      }
      
      await Sharing.shareAsync(dbPath, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Exportar Banco de Dados Ponto Fácil'
      });
    } catch (e: any) {
      Alert.alert('Erro ao exportar', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Debug do Banco</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleExportDB} style={styles.exportBtn}>
          <Share2 size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 60 }]}>
        {loading || syncing ? (
          <Text style={styles.loading}>Carregando tabelas...</Text>
        ) : (
          <>
            <TouchableOpacity style={styles.forceSyncBtn} onPress={handleForceFullSync}>
              <Text style={styles.forceSyncText}>Forçar Sincronização Completa (Zera Fila + Zera Data)</Text>
            </TouchableOpacity>
            {counts.map(item => (
            <View key={item.table} style={styles.card}>
              <View style={styles.iconBox}>
                <Database size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={styles.tableName}>{item.table}</Text>
                <Text style={styles.countText}>{item.count} registro(s)</Text>
              </View>
            </View>
          ))}
          </>
        )}

        <View style={{ marginTop: 24, padding: 16, backgroundColor: '#F4EBF6', borderRadius: 12 }}>
          <Text style={{ fontWeight: 'bold', color: '#631660', marginBottom: 8 }}>Diagnóstico de Sessão</Text>
          <Text style={{ fontSize: 13, color: '#50434D' }}>Usuário: {user?.email || 'Não identificado'}</Text>
          <Text style={{ fontSize: 13, color: '#50434D' }}>ID no Servidor: {user?.id || 'N/A'}</Text>
          <Text style={{ fontSize: 11, color: '#50434D' }}>Token: {token ? `${token.substring(0, 15)}...` : 'N/A'}</Text>
          <Text style={{ fontSize: 13, color: '#631660', marginTop: 8, fontWeight: '500' }}>Último Pull do Servidor:</Text>
          <Text style={{ fontSize: 12, color: '#50434D' }}>{syncSummary}</Text>
        </View>

        <TouchableOpacity 
          style={{ marginTop: 16, padding: 12, borderLevel: 1, borderColor: '#BA1A1A', borderWidth: 1, borderRadius: 8, alignItems: 'center' }} 
          onPress={handleClearLocal}
        >
          <Text style={{ color: '#BA1A1A', fontWeight: 'bold' }}>LIMPAR BANCO LOCAL (RECOMEÇAR)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7FF' },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtn: { marginRight: 16 },
  exportBtn: { padding: 4 },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: theme.fonts.bold
  },
  content: { padding: 20 },
  loading: {
    textAlign: 'center',
    marginTop: 40,
    color: theme.colors.on_surface_variant
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F4EBF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  info: { flex: 1 },
  tableName: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary
  },
  countText: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: 4
  },
  forceSyncBtn: {
    backgroundColor: '#BA1A1A',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20
  },
  forceSyncText: {
    color: '#FFF',
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    textAlign: 'center'
  }
});
