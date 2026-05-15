import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Switch, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Plus, X, Calendar as CalendarIcon, Trash2, ArrowLeft } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { useFeriados } from '../hooks/useFeriados';
import { theme } from '../theme/theme';

export default function FeriadosScreen() {
  const navigation = useNavigation();
  const { feriados, addFeriado, deleteFeriado } = useFeriados();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [nome, setNome] = useState('');
  const [dataObj, setDataObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tipo, setTipo] = useState('NACIONAL');
  const [fixo, setFixo] = useState(false);

  const tiposDisponiveis = ['NACIONAL', 'ESTADUAL', 'MUNICIPAL', 'FACULTATIVO'];

  const handleAdd = async () => {
    if (nome.trim()) {
      const dateStr = `${dataObj.getFullYear()}-${(dataObj.getMonth() + 1).toString().padStart(2, '0')}-${dataObj.getDate().toString().padStart(2, '0')}`;
      await addFeriado(dateStr, nome, fixo ? 1 : 0, tipo);
      setNome('');
      setDataObj(new Date());
      setTipo('NACIONAL');
      setFixo(false);
      setModalVisible(false);
    }
  };

  const renderRightActions = (id: number) => {
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity style={styles.swipeAction} onPress={() => deleteFeriado(id)}>
          <Trash2 color={theme.colors.on_error} size={20} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderFeriado = ({ item }: any) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <CalendarIcon color={theme.colors.primary_container} size={24} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.ferNome}</Text>
          <Text style={styles.cardSubtitle}>
            {item.ferData} • {item.ferTipo || 'NACIONAL'} {item.ferFixo === 1 ? '(Fixo)' : ''}
          </Text>
        </View>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Feriados</Text>
      </View>

      <FlatList
        data={feriados}
        renderItem={renderFeriado}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum feriado cadastrado.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Feriado</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <X color={theme.colors.primary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOME</Text>
              <TextInput style={styles.input} placeholder="Ex: Natal" placeholderTextColor={theme.colors.outline} value={nome} onChangeText={setNome} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DATA</Text>
              <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={{ color: theme.colors.on_surface, fontSize: 16 }}>
                  {dataObj.toLocaleDateString('pt-BR')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dataObj}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) setDataObj(selectedDate);
                  }}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>TIPO</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {tiposDisponiveis.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, tipo === t && styles.chipSelected]}
                    onPress={() => setTipo(t)}
                  >
                    <Text style={[styles.chipText, tipo === t && styles.chipTextSelected]}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.labelSwitch}>Feriado Anual Fixo?</Text>
              <Switch value={fixo} onValueChange={setFixo} trackColor={{ false: theme.colors.surface_container, true: theme.colors.primary_container }} thumbColor="#FFF" />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
              <Text style={styles.saveButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 16 },
  title: { fontSize: 28, fontFamily: theme.fonts.bold, color: theme.colors.primary },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface_container_lowest, borderRadius: 20, padding: 16, marginBottom: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.colors.surface_container, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 16 },
  cardTitle: { color: theme.colors.on_surface, fontSize: 16, fontFamily: theme.fonts.bold },
  cardSubtitle: { color: theme.colors.on_surface_variant, fontSize: 12, marginTop: 2, fontFamily: theme.fonts.regular },
  swipeActionsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  swipeAction: { width: 64, height: '100%', justifyContent: 'center', alignItems: 'center', borderTopRightRadius: 20, borderBottomRightRadius: 20, backgroundColor: theme.colors.error },
  fab: { position: 'absolute', right: 24, bottom: 24, backgroundColor: theme.colors.primary_container, width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: theme.colors.outline, fontSize: 16, fontFamily: theme.fonts.regular },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(70, 0, 69, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.surface_container_lowest, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: 24, fontFamily: theme.fonts.bold, color: theme.colors.primary },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface_container, justifyContent: 'center', alignItems: 'center' },
  inputGroup: { marginBottom: 20 },
  switchGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 },
  label: { fontSize: 12, fontFamily: theme.fonts.bold, color: theme.colors.secondary, marginBottom: 8, marginLeft: 4 },
  labelSwitch: { fontSize: 16, fontFamily: theme.fonts.bold, color: theme.colors.on_surface },
  input: { backgroundColor: theme.colors.surface_container, borderRadius: 16, padding: 16, color: theme.colors.on_surface, fontSize: 16, fontFamily: theme.fonts.regular, justifyContent: 'center' },
  chipScroll: { flexDirection: 'row', paddingVertical: 4 },
  chip: { backgroundColor: theme.colors.surface_container, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: theme.colors.outline },
  chipSelected: { backgroundColor: theme.colors.primary_container, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.on_surface_variant, fontSize: 14, fontFamily: theme.fonts.medium },
  chipTextSelected: { color: '#FFF', fontFamily: theme.fonts.bold },
  saveButton: { backgroundColor: theme.colors.primary_container, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 12 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontFamily: theme.fonts.bold },
});
