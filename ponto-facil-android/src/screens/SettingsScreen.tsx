import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { RefreshCw, Clock, ChevronRight, ShieldCheck, Mail, FileText, CalendarOff, Eye, LogOut, User } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/useAuthStore';
import { useSync } from '../hooks/useSync';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { getDatabase } from '../database/db';

import { normalize } from '../utils/responsive';

const LAST_SYNC_KEY = '@PontoFacil:lastSyncAt';

export default function SettingsScreen() {
  const { performSync, syncing, error } = useSync();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp<any>>();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: async () => await logout() }
      ]
    );
  };

  const loadLastSync = async () => {
    const value = await AsyncStorage.getItem(LAST_SYNC_KEY);
    setLastSync(value);
  };

  useEffect(() => {
    loadLastSync();
  }, [syncing]);

  const handleSync = async () => {
    Alert.alert(
      'Sincronização',
      'Deseja realizar uma sincronização normal ou completa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Normal', 
          onPress: async () => {
            const success = await performSync(false);
            if (success) Alert.alert('Sucesso', 'Sincronização concluída!');
            else Alert.alert('Erro', error || 'Falha na sincronização.');
          }
        },
        { 
          text: 'Completa (Baixar tudo)', 
          onPress: async () => {
            try {
              const db = await getDatabase();
              // Limpa fila e metadados para garantir um estado limpo como na tela de debug
              await db.execAsync('DELETE FROM sync_queue');
              await AsyncStorage.removeItem(LAST_SYNC_KEY);
              
              const success = await performSync(true);
              if (success) Alert.alert('Sucesso', 'Todos os dados foram baixados!');
              else Alert.alert('Erro', error || 'Falha na sincronização completa.');
            } catch (e: any) {
              Alert.alert('Erro fatal', e.message);
            }
          }
        }
      ]
    );
  };


  return (
    <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nuvem e Sincronização</Text>
          <View style={styles.syncCard}>
            <View style={styles.syncStatusRow}>
              <View>
                <Text style={styles.syncStatusLabel}>STATUS DA CONTA</Text>
                <Text style={styles.syncStatusValue}>
                  {syncing ? 'Sincronizando...' : error ? 'Erro na última tentativa' : 'Dados Protegidos'}
                </Text>
              </View>
              <View style={[styles.statusIcon, { backgroundColor: syncing || !error ? '#F4EBF6' : '#FFDAD6' }]}>
                {syncing ? (
                  <ActivityIndicator color="#631660" size="small" />
                ) : error ? (
                  <ShieldCheck color="#BA1A1A" size={20} />
                ) : (
                  <ShieldCheck color="#631660" size={20} />
                )}
              </View>
            </View>

            <View style={styles.lastSyncRow}>
              <Clock size={14} color="#50434D" />
              <Text style={styles.lastSyncText}>
                Visto por último: {lastSync ? new Date(lastSync).toLocaleString() : 'Nunca sincronizado'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={[styles.syncButton, { flex: 1 }, syncing && styles.syncButtonDisabled]} 
                onPress={handleSync}
                disabled={syncing}
              >
                <RefreshCw size={18} color="#FFF" style={syncing ? { transform: [{ rotate: '45deg' }] } : {}} />
                <Text style={styles.syncButtonText}>{syncing ? 'Processando...' : 'Sincronizar Agora'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.syncButton, { width: 56, paddingVertical: 0 }]} 
                onPress={() => navigation.navigate('DatabaseDebug')}
              >
                <Eye size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências do App</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F4EBF6' }]}>
                <Clock size={20} color="#631660" />
              </View>
              <Text style={styles.menuItemText}>Meta Diária</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>08:00h</Text>
              <ChevronRight size={20} color="#D4C1CD" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Reports')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F4EBF6' }]}>
                <FileText size={20} color="#631660" />
              </View>
              <Text style={styles.menuItemText}>Exportação e Relatórios</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.outline_variant} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Feriados')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.surface_container }]}>
                <CalendarOff size={20} color={theme.colors.primary_container} />
              </View>
              <Text style={styles.menuItemText}>Feriados Nacionais e Fixos</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.outline_variant} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F4EBF6' }]}>
                <Mail size={20} color="#631660" />
              </View>
              <Text style={styles.menuItemText}>Backup SMTP</Text>
            </View>
            <ChevronRight size={20} color="#D4C1CD" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F4EBF6' }]}>
                <User size={20} color="#631660" />
              </View>
              <View>
                <Text style={styles.menuItemText}>{user?.nome || user?.login || 'Usuário'}</Text>
                <Text style={{ fontSize: 12, color: '#50434D' }}>{user?.email}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFDAD6' }]}>
                <LogOut size={20} color="#BA1A1A" />
              </View>
              <Text style={[styles.menuItemText, { color: '#BA1A1A' }]}>Sair da Conta</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>PONTO FÁCIL ANDROID</Text>
          <Text style={styles.versionNumber}>
            Versão {Constants.expoConfig?.version} (Build {Constants.expoConfig?.android?.versionCode})
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7FF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: normalize(24),
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: normalize(11),
    color: theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 8,
    fontFamily: theme.fonts.bold,
  },
  syncCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    elevation: 2,
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncStatusLabel: {
    color: '#82737D',
    fontSize: normalize(9),
    fontWeight: 'bold',
  },
  syncStatusValue: {
    color: '#1E1A22',
    fontSize: normalize(17),
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  lastSyncText: {
    color: '#50434D',
    fontSize: normalize(11),
    marginLeft: 8,
  },
  syncButton: {
    backgroundColor: '#631660',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
  },
  syncButtonDisabled: {
    backgroundColor: '#D4C1CD',
  },
  syncButtonText: {
    color: theme.colors.on_primary,
    fontSize: normalize(15),
    marginLeft: 12,
    fontFamily: theme.fonts.bold,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    color: theme.colors.on_surface,
    fontSize: normalize(15),
    fontFamily: theme.fonts.medium,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemValue: {
    color: '#82737D',
    marginRight: 8,
    fontSize: normalize(13),
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  versionText: {
    color: '#631660',
    fontSize: normalize(9),
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  versionNumber: {
    color: '#D4C1CD',
    fontSize: normalize(11),
    marginTop: 4,
  },
});
