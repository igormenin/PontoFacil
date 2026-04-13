import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Plus, User, Search, X, Briefcase } from 'lucide-react-native';
import { useClients } from '../hooks/useClients';

const { width } = Dimensions.get('window');

export default function ClientsScreen() {
  const { clients, loading, addClient } = useClients();
  const [modalVisible, setModalVisible] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCnpj, setNewClientCnpj] = useState('');

  const handleAddClient = async () => {
    if (newClientName.trim()) {
      await addClient(newClientName, newClientCnpj);
      setNewClientName('');
      setNewClientCnpj('');
      setModalVisible(false);
    }
  };

  const renderClient = ({ item }: any) => (
    <View style={styles.clientCard}>
      <View style={styles.clientIcon}>
        <Briefcase color="#631660" size={24} />
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.nome}</Text>
        <Text style={styles.clientCnpj}>{item.cnpj || 'Sem identificação'}</Text>
      </View>
      <View style={[styles.badge, item.sync_status === 'synced' ? styles.badgeSynced : styles.badgePending]}>
        <Text style={[styles.badgeText, { color: item.sync_status === 'synced' ? '#03DAC6' : '#9B2F96' }]}>
          {item.sync_status === 'synced' ? 'OK' : 'Pendente'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Clientes</Text>
        <View style={styles.searchContainer}>
          <Search color="#50434D" size={20} />
          <TextInput 
            placeholder="Buscar..." 
            placeholderTextColor="#82737D" 
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#631660" style={styles.loader} />
      ) : (
        <FlatList
          data={clients}
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
    backgroundColor: '#FFF7FF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#460045',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4EBF6',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  searchInput: {
    flex: 1,
    color: '#1E1A22',
    marginLeft: 12,
    fontSize: 16,
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
    color: '#1E1A22',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientCnpj: {
    color: '#50434D',
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F4EBF6',
  },
  badgeSynced: {
    backgroundColor: '#E6FFF5',
  },
  badgePending: {
    backgroundColor: '#FFF0F7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
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
    color: '#82737D',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#460045',
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9B2F96',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F4EBF6',
    borderRadius: 16,
    padding: 16,
    color: '#1E1A22',
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
});
