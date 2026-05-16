import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Plus, X, DollarSign, Trash2, ArrowLeft } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useValorHora } from '../hooks/useValorHora';
import { normalize } from '../utils/responsive';

export default function ValorHoraScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { clienteId, clienteNome } = route.params || {};
  const validClienteId = (clienteId !== undefined && clienteId !== null) ? Number(clienteId) : undefined;

  const { valores, loading, addValor, deleteValor } = useValorHora(validClienteId && !isNaN(validClienteId) ? validClienteId : undefined);

  if (!validClienteId || isNaN(validClienteId)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={theme.colors.primary} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Erro</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>ID de cliente inválido.</Text>
        </View>
      </View>
    );
  }
  
  const [modalVisible, setModalVisible] = useState(false);
  const [valorStr, setValorStr] = useState('');
  const [mesInicio, setMesInicio] = useState(''); // YYYY-MM

  const handleAdd = async () => {
    const v = parseFloat(valorStr.replace(',', '.'));
    if (!isNaN(v) && mesInicio.trim()) {
      await addValor(v, mesInicio);
      setValorStr('');
      setMesInicio('');
      setModalVisible(false);
    }
  };

  const renderRightActions = (id: number) => {
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity style={styles.swipeAction} onPress={() => deleteValor(id)}>
          <Trash2 color={theme.colors.on_error} size={20} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderValor = ({ item }: any) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <DollarSign color={theme.colors.primary_container} size={24} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>R$ {Number(item.vhValor || 0).toFixed(2)} /h</Text>
          <Text style={styles.cardSubtitle}>Vigência desde: {item.vhMesInicio || 'N/D'}</Text>
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
        <View>
          <Text style={styles.title}>Valores e Taxas</Text>
          <Text style={styles.subtitle}>{clienteNome}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Buscando valores...</Text>
        </View>
      ) : (
        <FlatList
          data={valores}
          renderItem={renderValor}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum valor cadastrado para este cliente.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Valor/Hora</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <X color={theme.colors.primary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>VALOR (R$)</Text>
              <TextInput style={styles.input} placeholder="Ex: 150.00" keyboardType="numeric" placeholderTextColor={theme.colors.outline} value={valorStr} onChangeText={setValorStr} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MÊS DE INÍCIO (YYYY-MM)</Text>
              <TextInput style={styles.input} placeholder="2024-01" placeholderTextColor={theme.colors.outline} value={mesInicio} onChangeText={setMesInicio} />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
              <Text style={styles.saveButtonText}>Salvar Vigência</Text>
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
  title: { fontSize: normalize(20), fontFamily: theme.fonts.bold, color: theme.colors.primary },
  subtitle: { fontSize: normalize(15), fontFamily: theme.fonts.medium, color: theme.colors.secondary, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface_container_lowest, borderRadius: 20, padding: 16, marginBottom: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.colors.surface_container, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 16 },
  cardTitle: { color: theme.colors.on_surface, fontSize: normalize(16), fontFamily: theme.fonts.bold },
  cardSubtitle: { color: theme.colors.on_surface_variant, fontSize: normalize(11), marginTop: 2, fontFamily: theme.fonts.regular },
  swipeActionsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  swipeAction: { width: 64, height: '100%', justifyContent: 'center', alignItems: 'center', borderTopRightRadius: 20, borderBottomRightRadius: 20, backgroundColor: theme.colors.error },
  fab: { position: 'absolute', right: 24, bottom: 24, backgroundColor: theme.colors.primary_container, width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: theme.colors.outline, fontSize: normalize(15), fontFamily: theme.fonts.regular },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(70, 0, 69, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.surface_container_lowest, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: normalize(20), fontFamily: theme.fonts.bold, color: theme.colors.primary },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface_container, justifyContent: 'center', alignItems: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: normalize(11), fontFamily: theme.fonts.bold, color: theme.colors.secondary, marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: theme.colors.surface_container, borderRadius: 16, padding: normalize(14), color: theme.colors.on_surface, fontSize: normalize(15), fontFamily: theme.fonts.regular },
  saveButton: { backgroundColor: theme.colors.primary_container, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 12 },
  saveButtonText: { color: '#FFF', fontSize: normalize(16), fontFamily: theme.fonts.bold },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: theme.colors.secondary, fontFamily: theme.fonts.medium },
});
