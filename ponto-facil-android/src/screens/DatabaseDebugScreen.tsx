import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { getDatabase } from '../database/db';
import { theme } from '../theme/theme';
import { ArrowLeft, Database } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSync } from '../hooks/useSync';

export default function DatabaseDebugScreen() {
  const navigation = useNavigation();
  const [counts, setCounts] = useState<{table: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const { performSync, syncing } = useSync();

  const loadCounts = async () => {
    try {
      setLoading(true);
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
      await db.runAsync('DELETE FROM sync_queue');
      // Reset last sync time
      await AsyncStorage.removeItem('@PontoFacil:lastSyncAt');
      
      const success = await performSync();
      if (success) {
        Alert.alert('Sucesso', 'Sincronização completa finalizada com sucesso!');
        loadCounts();
      } else {
        Alert.alert('Erro', 'Ocorreu um erro durante a sincronização forçada.');
      }
    } catch (e: any) {
      Alert.alert('Erro fatal', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Debug do Banco</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
