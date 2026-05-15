import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { Plus, Trash2, Clock, Calendar as CalendarIcon, ChevronLeft, MoreVertical } from 'lucide-react-native';
import { useIntervals, Interval } from '../hooks/useIntervals';
import { useDays, DayRecord } from '../hooks/useDays';
import IntervalForm from '../components/IntervalForm';
import { calculateDuration } from '../utils/calcHoras';
import { theme } from '../theme/theme';
import { useAuthStore } from '../store/useAuthStore';

const { width } = Dimensions.get('window');

export default function DayScreen({ route, navigation }: any) {
  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  };
  const date = route?.params?.date || getTodayStr();
  const { getOrCreateDay } = useDays();
  const [dayRecord, setDayRecord] = useState<DayRecord | null>(null);
  const { intervals, loading, addInterval, deleteInterval } = useIntervals(dayRecord?.id);
  const [modalVisible, setModalVisible] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isLeitor = user?.leitor === true;

  const loadDay = useCallback(async () => {
    const record = await getOrCreateDay(date);
    setDayRecord(record);
  }, [date, getOrCreateDay]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  const totalHoras = intervals.reduce((acc, curr) => {
    if (curr.int_inicio && curr.int_fim) {
      return acc + calculateDuration(curr.int_inicio, curr.int_fim);
    }
    return acc;
  }, 0);

  const handleAddInterval = async (data: any) => {
    if (dayRecord) {
      try {
        await addInterval({ ...data, dia_id: dayRecord.id });
        setModalVisible(false);
      } catch (error) {
        console.error(error);
        Alert.alert('Erro', 'Não foi possível salvar o lançamento.');
      }
    }
  };

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  const renderInterval = ({ item, index }: { item: Interval, index: number }) => (
    <View style={styles.timelineItem}>
      {/* Timeline Pulse Component */}
      <View style={styles.pulseContainer}>
        <View style={[styles.pulseNode, { backgroundColor: theme.colors.primary_container }]} />
        {index < intervals.length - 1 && <View style={styles.pulseLine} />}
      </View>

      <View style={styles.intervalCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.clientName}>{item.cliente_nome || 'Cliente avulso'}</Text>
            <View style={styles.timeRow}>
              <Clock size={12} color={theme.colors.secondary} />
              <Text style={styles.timeRange}>{item.int_inicio} — {item.int_fim || 'Em aberto'}</Text>
            </View>
          </View>
          {!isLeitor && (
            <TouchableOpacity onPress={() => deleteInterval(item.id)} style={styles.deleteButton}>
              <Trash2 size={18} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
        
        {item.int_anotacoes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>{item.int_anotacoes}</Text>
          </View>
        ) : null}
        
        <View style={styles.cardFooter}>
           <Text style={styles.durationText}>
              {item.int_inicio && item.int_fim ? `${calculateDuration(item.int_inicio, item.int_fim).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} horas` : 'Contabilizando...'}
           </Text>
           {item.sync_status !== 'synced' && (
             <View style={styles.syncIndicator} />
           )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#460045" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Jornada</Text>
          <Text style={styles.headerSubtitle}>{formattedDate}</Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <View style={styles.summaryItem}>
          <Text style={styles.heroNumber}>{totalHoras.toFixed(2).replace('.', ',')}</Text>
          <Text style={styles.summaryLabel}>HORAS TOTAIS</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.heroNumber}>{dayRecord?.dia_horas_meta || 8}</Text>
          <Text style={styles.summaryLabel}>META DO DIA</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#631660" style={styles.loader} />
      ) : (
        <FlatList
          data={intervals}
          renderItem={renderInterval}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {isLeitor ? 'Nenhum registro para este dia.' : 'Sua linha do tempo está limpa. Comece seu dia aqui.'}
              </Text>
              {!isLeitor && (
                <TouchableOpacity style={styles.emptyAction} onPress={() => setModalVisible(true)}>
                  <Text style={styles.emptyActionText}>Registrar Ponto</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {!isLeitor && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Plus color="#FFF" size={32} />
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Ponto</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalButton}>
                <Plus color="#460045" size={24} style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            </View>
            <IntervalForm 
              onSubmit={handleAddInterval}
              onCancel={() => setModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4EBF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: theme.colors.primary,
    fontSize: 24,
    fontFamily: theme.fonts.bold,
  },
  headerSubtitle: {
    color: theme.colors.on_surface_variant,
    fontSize: 14,
    textTransform: 'capitalize',
    fontFamily: theme.fonts.regular,
  },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: '#F4EBF6',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#D4C1CD',
  },
  heroNumber: {
    fontSize: 32,
    fontFamily: theme.fonts.black,
    color: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: 10,
    color: theme.colors.secondary,
    fontFamily: theme.fonts.bold,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  pulseContainer: {
    width: 24,
    alignItems: 'center',
    paddingTop: 12,
  },
  pulseNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  pulseLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#D4C1CD33',
    marginVertical: 4,
  },
  intervalCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginLeft: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientName: {
    color: theme.colors.on_surface,
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRange: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    marginLeft: 6,
  },
  deleteButton: {
    padding: 4,
  },
  notesContainer: {
    backgroundColor: '#F4EBF6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  notesText: {
    color: '#50434D',
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    color: theme.colors.on_surface_variant,
    fontSize: 12,
    fontFamily: theme.fonts.bold,
    textTransform: 'uppercase',
  },
  syncIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#631660',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#631660',
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#82737D',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyAction: {
    backgroundColor: '#F4EBF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#631660',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(70, 0, 69, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 48,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#460045',
  },
  closeModalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4EBF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
