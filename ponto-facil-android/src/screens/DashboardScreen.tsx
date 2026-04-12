import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Clock, TrendingUp, DollarSign, Calendar as CalendarIcon } from 'lucide-react-native';
import { useMonths } from '../hooks/useMonths';
import { useNavigation } from '@react-navigation/native';

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
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardValue}>{value}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { summary } = useMonths();

  const navigateToDay = () => {
    const today = new Date().toISOString().split('T')[0];
    navigation.navigate('DayScreen', { date: today });
  };

  const navigateToCalendar = () => {
    navigation.navigate('Calendar');
  };

  const todayStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, Igor</Text>
          <Text style={styles.date}>{todayStr}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={navigateToCalendar}>
          <CalendarIcon color="#631660" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <DashboardCard 
          title="Horas Hoje" 
          value="00:00" // Should be dynamic in next iteration
          icon={Clock} 
          color="#460045" 
          backgroundColor="#FFFFFF"
          onPress={navigateToDay}
        />
        <DashboardCard 
          title="Progresso Mês" 
          value={`${summary.progressPercent.toFixed(0)}%`}
          icon={TrendingUp} 
          color="#9B2F96" 
          backgroundColor="#FFFFFF"
          onPress={navigateToCalendar}
        />
        <DashboardCard 
          title="Valor Estimado" 
          value={`R$ ${summary.valueTotal.toFixed(0)}`}
          icon={DollarSign} 
          color="#631660" 
          backgroundColor="#FFFFFF"
          onPress={navigateToCalendar}
        />
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos Intervalos</Text>
          <TouchableOpacity onPress={navigateToDay}>
            <Text style={styles.seeAll}>Timeline</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhum intervalo registrado hoje.</Text>
          <TouchableOpacity style={styles.addButton} onPress={navigateToDay}>
            <Text style={styles.addButtonText}>Registrar Agora</Text>
          </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#460045',
  },
  date: {
    fontSize: 16,
    color: '#50434D',
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F4EBF6',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#50434D',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardValue: {
    color: '#1E1A22',
    fontSize: 22,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#460045',
  },
  seeAll: {
    color: '#9B2F96',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#F4EBF6',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#50434D',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#631660',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
