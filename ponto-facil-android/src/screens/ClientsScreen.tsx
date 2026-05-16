import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Plus, Search, X, Briefcase, Trash2, Edit2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { useClients } from '../hooks/useClients';
import { theme } from '../theme/theme';

import { normalize } from '../utils/responsive';

export default function ClientsScreen() {
  const navigation = useNavigation<any>();
  const { clients, loading, addClient, deleteClient } = useClients();
  const [modalVisible, setModalVisible] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCnpj, setNewClientCnpj] = useState('');
  const [search, setSearch] = useState('');

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const lowerSearch = search.toLowerCase();
    return clients.filter(c => 
      c.cliNome.toLowerCase().includes(lowerSearch) || 
      (c.cliCnpj && c.cliCnpj.toLowerCase().includes(lowerSearch))
    );
  }, [clients, search]);

  const handleAddClient = async () => {
    if (newClientName.trim()) {
      await addClient(newClientName, newClientCnpj);
      setNewClientName('');
      setNewClientCnpj('');
      setModalVisible(false);
    }
  };

  const renderRightActions = (id: number) => {
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity style={[styles.swipeAction, { backgroundColor: theme.colors.error }]} onPress={() => deleteClient(id)}>
          <Trash2 color={theme.colors.on_error} size={20} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderClient = ({ item }: any) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <TouchableOpacity 
        style={styles.clientCard}
        onPress={() => navigation.navigate('ValorHora', { clienteId: item.id, clienteNome: item.cliNome })}
      >
        <View style={styles.clientIcon}>
          <Briefcase color={theme.colors.primary_container} size={24} />
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.cliNome}</Text>
          <Text style={styles.clientCnpj}>{item.cliCnpj || 'Sem identificação'}</Text>
        </View>
        <View style={[styles.badge, item.sync_status === 'synced' ? styles.badgeSynced : styles.badgePending]}>
          <Text style={[styles.badgeText, { color: item.sync_status === 'synced' ? '#03DAC6' : theme.colors.secondary }]}>
            {item.sync_status === 'synced' ? 'OK' : 'Pendente'}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#50434D" size={20} />
          <TextInput 
            placeholder="Buscar..." 
            placeholderTextColor={theme.colors.outline} 
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary_container} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredClients}
          renderItem={renderClient}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Comece adicionando seu primeiro cliente.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Cliente</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <X color="#460045" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOME</Text>
              <TextInput
                style={styles.input}
                placeholder="Empresa ou Profissional"
                placeholderTextColor="#82737D"
                value={newClientName}
                onChangeText={setNewClientName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CNPJ / ID</Text>
              <TextInput
                style={styles.input}
                placeholder="00.000.000/0000-00"
                placeholderTextColor="#82737D"
                value={newClientCnpj}
                onChangeText={setNewClientCnpj}
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleAddClient}
            >
              <Text style={styles.saveButtonText}>Adicionar</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: normalize(24),
    color: theme.colors.primary,
    marginBottom: 16,
    fontFamily: theme.fonts.bold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface_container,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.on_surface,
    marginLeft: 12,
    fontSize: normalize(15),
    fontFamily: theme.fonts.regular,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  clientIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F4EBF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
    marginLeft: 16,
  },
  clientName: {
    color: theme.colors.on_surface,
    fontSize: normalize(15),
    fontFamily: theme.fonts.bold,
  },
  clientCnpj: {
    color: theme.colors.on_surface_variant,
    fontSize: normalize(11),
    marginTop: 2,
    fontFamily: theme.fonts.regular,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.surface_container,
  },
  badgeSynced: {
    backgroundColor: '#E6FFF5',
  },
  badgePending: {
    backgroundColor: '#FFF0F7',
  },
  badgeText: {
    fontSize: normalize(9),
    fontFamily: theme.fonts.bold,
    textTransform: 'uppercase',
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  swipeAction: {
    width: 64,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
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
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: theme.colors.outline,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: theme.fonts.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(70, 0, 69, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface_container_lowest,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: normalize(20),
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4EBF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: normalize(11),
    fontWeight: 'bold',
    color: '#631660',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F4EBF6',
    borderRadius: 16,
    padding: normalize(14),
    color: '#1E1A22',
    fontSize: normalize(15),
  },
  saveButton: {
    backgroundColor: '#631660',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: normalize(16),
    fontWeight: 'bold',
  },
});
