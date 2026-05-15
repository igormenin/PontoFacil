import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { FileText, Download, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useReports } from '../hooks/useReports';
import { useClients } from '../hooks/useClients';

const MONTHS_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function ReportsScreen() {
  const navigation = useNavigation();
  const { exportPDF, exportCSV, exporting } = useReports();
  const { clients } = useClients();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined);

  const handleExportPDF = async () => {
    try {
      await exportPDF(selectedMonth, selectedYear, selectedClientId);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportCSV(selectedMonth, selectedYear, selectedClientId);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível gerar o CSV.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#460045" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Relatórios</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Período de Referência</Text>
          <View style={styles.filterCard}>
             <View style={styles.filterRow}>
                <CalendarIcon size={20} color="#9B2F96" />
                <View style={styles.filterInfo}>
                  <Text style={styles.filterLabel}>MÊS E ANO</Text>
                  <Text style={styles.filterValue}>{MONTHS_BR[selectedMonth]} {selectedYear}</Text>
                </View>
             </View>
             
             <View style={styles.monthGrid}>
                <TouchableOpacity 
                   onPress={() => {
                     if (selectedMonth === 0) {
                       setSelectedMonth(11);
                       setSelectedYear(selectedYear - 1);
                     } else {
                       setSelectedMonth(selectedMonth - 1);
                     }
                   }}
                   style={styles.adjustButton}
                 >
                   <Text style={styles.adjustButtonText}>Anterior</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   onPress={() => {
                     if (selectedMonth === 11) {
                       setSelectedMonth(0);
                       setSelectedYear(selectedYear + 1);
                     } else {
                       setSelectedMonth(selectedMonth + 1);
                     }
                   }}
                   style={styles.adjustButton}
                 >
                   <Text style={styles.adjustButtonText}>Próximo</Text>
                 </TouchableOpacity>
             </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filtrar por Cliente (Opcional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientScroll}>
            <TouchableOpacity 
              style={[styles.clientChip, !selectedClientId && styles.clientChipActive]}
              onPress={() => setSelectedClientId(undefined)}
            >
              <Text style={[styles.clientChipText, !selectedClientId && styles.clientChipTextActive]}>Todos</Text>
            </TouchableOpacity>
            {clients.map(client => (
              <TouchableOpacity 
                key={client.id}
                style={[styles.clientChip, selectedClientId === client.id && styles.clientChipActive]}
                onPress={() => setSelectedClientId(client.id)}
              >
                <Text style={[styles.clientChipText, selectedClientId === client.id && styles.clientChipTextActive]}>
                  {client.cliNome}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.actionsBox}>
          <Text style={styles.actionsHint}>Escolha o formato de saída</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.pdfButton]} 
            onPress={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <FileText color="#FFF" size={24} />
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Gerar Documento PDF</Text>
                  <Text style={styles.actionDesc}>Ideal para impressão e envio formal</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.csvButton]} 
            onPress={handleExportCSV}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#631660" />
            ) : (
              <>
                <Download color="#631660" size={24} />
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionTitle, { color: '#460045' }]}>Exportar Planilha CSV</Text>
                  <Text style={styles.actionDesc}>Para Excel ou Planilhas Google</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#460045',
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9B2F96',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 8,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    elevation: 2,
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterInfo: {
    marginLeft: 16,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#82737D',
  },
  filterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1A22',
  },
  monthGrid: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F4EBF6',
    paddingTop: 16,
    justifyContent: 'space-between',
  },
  adjustButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F4EBF6',
    borderRadius: 12,
  },
  adjustButtonText: {
    color: '#460045',
    fontWeight: '700',
    fontSize: 14,
  },
  clientScroll: {
    flexDirection: 'row',
  },
  clientChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F4EBF6',
    borderRadius: 16,
    marginRight: 12,
  },
  clientChipActive: {
    backgroundColor: '#631660',
  },
  clientChipText: {
    color: '#460045',
    fontWeight: '600',
  },
  clientChipTextActive: {
    color: '#FFF',
  },
  actionsBox: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  actionsHint: {
    fontSize: 14,
    color: '#82737D',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    marginBottom: 16,
    elevation: 4,
  },
  pdfButton: {
    backgroundColor: '#631660',
  },
  csvButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F4EBF6',
  },
  actionInfo: {
    marginLeft: 16,
  },
  actionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionDesc: {
    color: '#D4C1CD',
    fontSize: 12,
    marginTop: 2,
  },
});
