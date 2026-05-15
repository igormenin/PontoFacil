import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Clock, Users, MessageSquare } from 'lucide-react-native';
import { useClients } from '../hooks/useClients';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { theme } from '../theme/theme';

interface IntervalFormProps {
  onSubmit: (data: { int_cli_id: number; int_inicio: string; int_fim: string; int_anotacoes: string }) => void;
  onCancel: () => void;
}

export default function IntervalForm({ onSubmit, onCancel }: IntervalFormProps) {
  const { clients } = useClients();
  const [clientId, setClientId] = useState<number | null>(clients[0]?.id || null);
  const [inicioDate, setInicioDate] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [fimDate, setFimDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [anotacoes, setAnotacoes] = useState('');
  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [showFimPicker, setShowFimPicker] = useState(false);

  // Auto-select first client when they load
  React.useEffect(() => {
    if (!clientId && clients.length > 0) {
      setClientId(clients[0].id);
    }
  }, [clients, clientId]);

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (!clientId) {
      Alert.alert('Atenção', 'Por favor, selecione um cliente.');
      return;
    }
    const isFimBeforeInicio = fimDate.getHours() < inicioDate.getHours() || 
      (fimDate.getHours() === inicioDate.getHours() && fimDate.getMinutes() < inicioDate.getMinutes());
      
    if (isFimBeforeInicio) {
      Alert.alert('Horário Inválido', 'O horário de fim não pode ser anterior ao horário de início.');
      return;
    }
    onSubmit({ int_cli_id: clientId, int_inicio: formatTime(inicioDate), int_fim: formatTime(fimDate), int_anotacoes: anotacoes });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Users size={16} color={theme.colors.primary} />
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
                {client.cli_nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeInputContainer}>
          <View style={styles.labelContainer}>
            <Clock size={16} color={theme.colors.primary} />
            <Text style={styles.label}>Início</Text>
          </View>
          <TouchableOpacity style={styles.input} onPress={() => setShowInicioPicker(true)}>
            <Text style={styles.inputText}>{formatTime(inicioDate)}</Text>
          </TouchableOpacity>
          {showInicioPicker && (
            <DateTimePicker
              value={inicioDate}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedDate) => {
                setShowInicioPicker(Platform.OS === 'ios');
                if (selectedDate) setInicioDate(selectedDate);
              }}
            />
          )}
        </View>

        <View style={styles.timeInputContainer}>
          <View style={styles.labelContainer}>
            <Clock size={16} color={theme.colors.secondary} />
            <Text style={styles.label}>Fim</Text>
          </View>
          <TouchableOpacity style={styles.input} onPress={() => setShowFimPicker(true)}>
            <Text style={styles.inputText}>{formatTime(fimDate)}</Text>
          </TouchableOpacity>
          {showFimPicker && (
            <DateTimePicker
              value={fimDate}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedDate) => {
                setShowFimPicker(Platform.OS === 'ios');
                if (selectedDate) setFimDate(selectedDate);
              }}
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <MessageSquare size={16} color={theme.colors.primary} />
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
    color: theme.colors.on_surface_variant,
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    marginLeft: 8,
  },
  clientPicker: {
    flexDirection: 'row',
  },
  clientChip: {
    backgroundColor: theme.colors.surface_container,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  clientChipSelected: {
    backgroundColor: theme.colors.primary_container,
    borderColor: theme.colors.primary,
  },
  clientChipText: {
    color: theme.colors.on_surface_variant,
    fontSize: 14,
    fontFamily: theme.fonts.medium,
  },
  clientChipTextSelected: {
    color: '#FFF',
    fontFamily: theme.fonts.bold,
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
    backgroundColor: theme.colors.surface_container_lowest,
    borderRadius: 16,
    padding: 16,
    color: theme.colors.on_surface,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    borderWidth: 1,
    borderColor: theme.colors.surface_container,
    justifyContent: 'center',
  },
  inputText: {
    color: theme.colors.on_surface,
    fontSize: 16,
    fontFamily: theme.fonts.bold,
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
    color: theme.colors.on_surface_variant,
    fontSize: 16,
    fontFamily: theme.fonts.medium,
  },
  saveButton: {
    backgroundColor: theme.colors.primary_container,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginLeft: 12,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: theme.fonts.bold,
  },
});
