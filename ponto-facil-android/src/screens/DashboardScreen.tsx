import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, AppState, ActivityIndicator } from 'react-native';
import { Clock, TrendingUp, DollarSign, Calendar as CalendarIcon, RefreshCw, WifiOff } from 'lucide-react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useMonths } from '../hooks/useMonths';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSync } from '../hooks/useSync';
import { useAuthStore } from '../store/useAuthStore';
import { useDays } from '../hooks/useDays';
import { useIntervals } from '../hooks/useIntervals';
import { calculateDuration } from '../utils/calcHoras';
import { theme } from '../theme/theme';
import { getDatabase } from '../database/db';

import { normalize, screenWidth as width } from '../utils/responsive';

const DashboardCard = ({ title, value, icon: Icon, color, backgroundColor, onPress }: any) => (
  <TouchableOpacity
    style={[styles.card, { backgroundColor }]}
    onPress={onPress}
  >
    <View style={styles.cardHeader}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text 
        style={[styles.cardTitle, { fontFamily: theme.fonts.bold }]} 
        numberOfLines={1} 
        adjustsFontSizeToFit
        allowFontScaling={false}
      >
        {title}
      </Text>
    </View>
    <Text 
      style={[styles.cardValue, { fontFamily: theme.fonts.black }]}
      numberOfLines={1}
      adjustsFontSizeToFit
      allowFontScaling={false}
    >
      {value}
    </Text>
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
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  const loadDashboardData = React.useCallback(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
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
    return curr.intFim ? acc + calculateDuration(curr.intInicio, curr.intFim) : acc;
  }, 0);

  const horasFormatado = `${Math.floor(totalHorasHjObj).toString().padStart(2, '0')}:${Math.round((totalHorasHjObj % 1) * 60).toString().padStart(2, '0')}`;

  useEffect(() => {
    const initSync = async () => {
      try {
        const db = await getDatabase();
        // Verifica se temos dados sincronizados do servidor
        const checkSynced = await db.getFirstAsync<any>('SELECT id FROM dia WHERE diaId IS NOT NULL LIMIT 1');
        
        // Sincroniza (força se o banco não tiver dados sincronizados)
        await performSync(!checkSynced);
        
        // Recarrega os dados após a tentativa de sincronização
        loadDashboardData();
      } catch (err) {
        console.error('[Dashboard] Erro na sincronização inicial:', err);
        loadDashboardData(); // Garante o carregamento mesmo com erro no sync
      }
    };
    
    initSync();
  }, [performSync, loadDashboardData, !!user?.leitor]);

  const navigateToDay = () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    navigation.navigate('Day', { date: today });
  };

  const navigateToCalendar = () => {
    navigation.navigate('Calendário');
  };

  const todayStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={14} color="#BA1A1A" style={{ marginRight: 6 }} />
          <Text style={styles.offlineText}>Modo Offline - Sincronização pausada</Text>
        </View>
      )}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.usuNome?.split(' ')[0] || user?.nome?.split(' ')[0] || 'Usuário'}</Text>
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
          value={`R$ ${summary.valueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          color={theme.colors.secondary}
          backgroundColor={theme.colors.surface_container_lowest}
          onPress={navigateToCalendar}
        />
        <DashboardCard
          title="Valor Estimado"
          value={`R$ ${summary.estimativa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
            {(() => {
              const maxHours = Math.max(summary.dailyMeta || 8, ...summary.chartData.map(d => d.hours));
              const goalLineHeight = (summary.dailyMeta / maxHours) * 120;
              return (
                <>
                  <View 
                    style={[
                      styles.goalLine, 
                      { bottom: goalLineHeight + 18 } 
                    ]} 
                  />
                  {summary.chartData?.map((data, index) => {
                    const heightPercent = (data.hours / maxHours) * 100;
                    return (
                      <View key={index} style={styles.barContainer}>
                  <Text style={styles.barValue}>
                    {data.hours > 0 
                      ? `${Math.floor(data.hours).toString().padStart(2, '0')}:${Math.round((data.hours % 1) * 60).toString().padStart(2, '0')}` 
                      : ''}
                  </Text>
                  <View style={styles.barBackground}>
                    <View style={[styles.barFill, { height: `${heightPercent}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{data.day.toString().padStart(2, '0')}</Text>
                      </View>
                    );
                  })}
                </>
              );
            })()}
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

        {intervals.length === 0 ? (
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
        ) : (
          intervals.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.intervalCard}>
              <View style={styles.intervalInfo}>
                <Text style={styles.intervalClient}>{item.clienteNome || 'Cliente avulso'}</Text>
                <Text style={styles.intervalTime}>{item.intInicio} — {item.intFim || 'Em aberto'}</Text>
              </View>
              <Text style={styles.intervalDuration}>
                {item.intInicio && item.intFim ? `${calculateDuration(item.intInicio, item.intFim).toFixed(2)}h` : '...'}
              </Text>
            </View>
          ))
        )}
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
  offlineBanner: {
    backgroundColor: '#FFDAD6',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40, // push down a bit because of safe area if needed, or adjust below
  },
  offlineText: {
    color: '#BA1A1A',
    fontSize: 12,
    fontFamily: theme.fonts.bold,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24, // adjusted
    paddingBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: normalize(24),
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
  },
  date: {
    fontSize: normalize(15),
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
    fontSize: normalize(9),
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
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    minHeight: 120,
    justifyContent: 'space-between',
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
    fontSize: normalize(11),
    fontWeight: '600',
    textTransform: 'uppercase',
    flex: 1,
    flexWrap: 'wrap',
  },
  cardValue: {
    color: '#1E1A22',
    fontSize: normalize(20),
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
    fontSize: normalize(18),
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
  },
  seeAll: {
    color: theme.colors.secondary,
    fontFamily: theme.fonts.medium,
    fontSize: normalize(13),
  },
  emptyState: {
    backgroundColor: '#F4EBF6',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.on_surface_variant,
    fontSize: normalize(14),
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
    paddingTop: 40,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    marginRight: 6,
    width: 24,
  },
  barBackground: {
    height: 160,
    width: 16,
    backgroundColor: '#F4EBF6',
    borderRadius: 8,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  barLabel: {
    fontSize: normalize(10),
    color: '#82737D',
    fontFamily: theme.fonts.medium,
  },
  barValue: {
    fontSize: normalize(10),
    fontFamily: theme.fonts.bold,
    color: theme.colors.secondary,
    marginBottom: 12,
    transform: [{ rotate: '-90deg' }],
    width: 40,
    textAlign: 'center',
    position: 'absolute',
    top: -30,
  },
  intervalCard: {
    backgroundColor: theme.colors.surface_container_lowest,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  intervalInfo: {
    flex: 1,
  },
  intervalClient: {
    fontSize: normalize(15),
    fontFamily: theme.fonts.bold,
    color: theme.colors.on_surface,
    marginBottom: 2,
  },
  intervalTime: {
    fontSize: normalize(12),
    fontFamily: theme.fonts.regular,
    color: theme.colors.on_surface_variant,
  },
  intervalDuration: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.black,
    color: theme.colors.primary,
    marginLeft: 16,
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    opacity: 0.3,
    zIndex: 0,
  },
});
