import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Clock, Users, MessageSquare } from 'lucide-react-native';
import { useClients } from '../hooks/useClients';

interface IntervalFormProps {
  onSubmit: (data: { cliente_id: number; inicio: string; fim: string; anotacoes: string }) => void;
  onCancel: () => void;
}

export default function IntervalForm({ onSubmit, onCancel }: IntervalFormProps) {
  const { clients } = useClients();
  const [clientId, setClientId] = useState<number | null>(clients[0]?.id || null);
  const [inicio, setInicio] = useState('09:00');
  const [fim, setFim] = useState('12:00');
  const [anotacoes, setAnotacoes] = useState('');

  const handleSave = () => {
    if (clientId && inicio && fim) {
      onSubmit({ cliente_id: clientId, inicio, fim, anotacoes });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Users size={16} color="#FF00FF" />
          <Text style={styles.label}>Cliente</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientPicker}>
          {clients.map(client => (
            <TouchableOpacity 
              key={client.id}
              style={[styles.clientChip, clientId === client.id && styles.clientChipSelected]}
              onPress={() => setClientId(client.id)}
            >
              <Text style={[styles.clientChipText, clientId === client.id && styles.clientChipTextSelected]}>
                {client.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeInputContainer}>
          <View style={styles.labelContainer}>
            <Clock size={16} color="#03DAC6" />
            <Text style={styles.label}>Início</Text>
          </View>
          <TextInput
            style={styles.input}
            value={inicio}
            onChangeText={setInicio}
            placeholder="00:00"
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.timeInputContainer}>
          <View style={styles.labelContainer}>
            <Clock size={16} color="#FF4081" />
            <Text style={styles.label}>Fim</Text>
          </View>
          <TextInput
            style={styles.input}
            value={fim}
            onChangeText={setFim}
            placeholder="00:00"
            placeholderTextColor="#444"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <MessageSquare size={16} color="#6200EE" />
          <Text style={styles.label}>Anotações</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={anotacoes}
          onChangeText={setAnotacoes}
          placeholder="O que foi feito?"
          placeholderTextColor="#444"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  section: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  clientPicker: {
    flexDirection: 'row',
  },
  clientChip: {
    backgroundColor: '#1E1E2E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  clientChipSelected: {
    backgroundColor: '#6200EE22',
    borderColor: '#6200EE',
  },
  clientChipText: {
    color: '#888',
    fontSize: 14,
  },
  clientChipTextSelected: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeInputContainer: {
    width: '48%',
  },
  input: {
    backgroundColor: '#0F0F1A',
    borderRadius: 8,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
