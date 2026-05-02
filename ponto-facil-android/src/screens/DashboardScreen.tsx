import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, AppState } from 'react-native';
import { Clock, TrendingUp, DollarSign, Calendar as CalendarIcon, RefreshCw } from 'lucide-react-native';
import { useMonths } from '../hooks/useMonths';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSync } from '../hooks/useSync';
import { useAuthStore } from '../store/useAuthStore';
import { useDays } from '../hooks/useDays';
import { useIntervals } from '../hooks/useIntervals';
import { calculateDuration } from '../utils/calcHoras';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

const DashboardCard = ({ title, value, icon: Icon, color, backgroundColor, onPress }: any) => (
  <TouchableOpacity
    style={[styles.card, { backgroundColor }]}
    onPress={onPress}
  >
    <View style={styles.cardHeader}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={[styles.cardTitle, { fontFamily: theme.fonts.bold }]}>{title}</Text>
    </View>
    <Text style={[styles.cardValue, { fontFamily: theme.fonts.black }]}>{value}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { summary, refresh: refreshMonths } = useMonths();
  const { performSync, syncing } = useSync();
  const user = useAuthStore((state) => state.user);
  const { getOrCreateDay } = useDays();
  const [dayId, setDayId] = React.useState<number | undefined>();
  const { intervals, refresh: refreshIntervals } = useIntervals(dayId);

  const loadDashboardData = React.useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    getOrCreateDay(today).then(day => {
      setDayId(day.id);
      refreshIntervals();
    }).catch(console.error);
    refreshMonths(); // Refresh months data
  }, [getOrCreateDay, refreshMonths, refreshIntervals]);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        loadDashboardData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadDashboardData]);

  const totalHorasHjObj = intervals.reduce((acc, curr) => {
    return curr.fim ? acc + calculateDuration(curr.inicio, curr.fim) : acc;
  }, 0);

  const horasFormatado = `${Math.floor(totalHorasHjObj).toString().padStart(2, '0')}:${Math.round((totalHorasHjObj % 1) * 60).toString().padStart(2, '0')}`;

  useEffect(() => {
    const initSync = async () => {
      const success = await performSync();
      if (success) {
        refreshMonths(); // Refresh months data after sync
        refreshIntervals(); // Refresh intervals too
      }
    };
    initSync();
  }, [performSync, refreshMonths, refreshIntervals]);

  const navigateToDay = () => {
    const today = new Date().toISOString().split('T')[0];
    navigation.navigate('Day', { date: today });
  };

  const navigateToCalendar = () => {
    navigation.navigate('Calendário');
  };

  const todayStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.nome?.split(' ')[0] || 'Usuário'}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.date}>{todayStr}</Text>
            {syncing && (
              <View style={styles.syncIndicator}>
                <ActivityIndicator size={12} color="#631660" />
                <Text style={styles.syncText}>Sincronizando...</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={navigateToCalendar}>
          <CalendarIcon color="#631660" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <DashboardCard
          title="Horas Hoje"
          value={horasFormatado}
          icon={Clock}
          color={theme.colors.primary}
          backgroundColor={theme.colors.surface_container_lowest}
          onPress={navigateToDay}
        />
        <DashboardCard
          title="Valor Executado"
          value={`R$ ${summary.valueTotal.toFixed(2).replace('.', ',')}`}
          icon={DollarSign}
          color={theme.colors.secondary}
          backgroundColor={theme.colors.surface_container_lowest}
          onPress={navigateToCalendar}
        />
        <DashboardCard
          title="Valor Estimado"
          value={`R$ ${summary.estimativa.toFixed(2).replace('.', ',')}`}
          icon={DollarSign}
          color={theme.colors.primary_container}
          backgroundColor={theme.colors.surface_container_lowest}
          onPress={navigateToCalendar}
        />
        <DashboardCard
          title="Progresso Mês"
          value={`${summary.progressPercent.toFixed(0)}%`}
          icon={TrendingUp}
          color={theme.colors.primary}
          backgroundColor={theme.colors.surface_container_lowest}
          onPress={navigateToCalendar}
        />
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Andamento Mensal</Text>
        <View style={styles.chartCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
            {summary.chartData?.map((data, index) => {
              const maxHours = Math.max(8, ...summary.chartData.map(d => d.hours));
              const heightPercent = (data.hours / maxHours) * 100;
              return (
                <View key={index} style={styles.barContainer}>
                  <Text style={styles.barValue}>{data.hours > 0 ? data.hours.toFixed(1) : ''}</Text>
                  <View style={styles.barBackground}>
                    <View style={[styles.barFill, { height: `${heightPercent}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{data.day.toString().padStart(2, '0')}</Text>
                </View>
              );
            })}
            {(!summary.chartData || summary.chartData.length === 0) && (
              <Text style={styles.emptyText}>Nenhum dado para exibir no momento.</Text>
            )}
          </ScrollView>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos Intervalos</Text>
          <TouchableOpacity onPress={navigateToCalendar}>
            <Text style={styles.seeAll}>Calendário</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {user?.leitor ? 'Modo de visualização. Registros aparecem aqui conforme sincronizados.' : 'Nenhum intervalo registrado hoje.'}
          </Text>
          {!user?.leitor && (
            <TouchableOpacity style={styles.addButton} onPress={navigateToDay}>
              <Text style={styles.addButtonText}>Registrar Agora</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7FF', // Lavender Paper
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
  },
  date: {
    fontSize: 16,
    color: theme.colors.on_surface_variant,
    marginTop: 4,
    fontFamily: theme.fonts.regular,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F4EBF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4EBF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  syncText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#631660',
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 48) / 2,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    color: '#50434D',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    flex: 1,
    flexWrap: 'wrap',
  },
  cardValue: {
    color: '#1E1A22',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
  },
  seeAll: {
    color: theme.colors.secondary,
    fontFamily: theme.fonts.medium,
  },
  emptyState: {
    backgroundColor: '#F4EBF6',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.on_surface_variant,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: theme.fonts.regular,
  },
  addButton: {
    backgroundColor: theme.colors.primary_container,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  addButtonText: {
    color: theme.colors.on_primary,
    fontFamily: theme.fonts.bold,
  },
  chartSection: {
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 5,
  },
  chartCard: {
    backgroundColor: theme.colors.surface_container_lowest,
    borderRadius: 20,
    padding: 16,
    paddingBottom: 0,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  chartScroll: {
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 28,
  },
  barBackground: {
    height: 120,
    width: 12,
    backgroundColor: '#F4EBF6',
    borderRadius: 6,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10,
    color: '#82737D',
    fontFamily: theme.fonts.medium,
  },
  barValue: {
    fontSize: 9,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
    marginBottom: 4,
  },
});
