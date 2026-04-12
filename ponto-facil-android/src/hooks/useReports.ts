import { useState, useCallback } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { getDatabase } from '../database/db';
import { generateReportHTML, generateReportCSV, ReportData } from '../utils/reportTemplates';
import { calculateDuration } from '../utils/calcHoras';
import { useAuthStore } from '../store/useAuthStore';

export function useReports() {
  const [exporting, setExporting] = useState(false);
  const { user } = useAuthStore();

  const fetchReportData = useCallback(async (month: number, year: number, clientId?: number): Promise<ReportData> => {
    const db = await getDatabase();
    const monthStr = String(month + 1).padStart(2, '0');
    const anoMes = `${year}-${monthStr}`;

    // 1. Fetch days
    const days = await db.getAllAsync<any>(
      "SELECT * FROM dias WHERE data LIKE ? || '-%' ORDER BY data ASC",
      [anoMes]
    );

    const reportDays: any[] = [];
    let totalHours = 0;
    let totalValue = 0;

    for (const day of days) {
      // 2. Fetch intervals for day, potentially filtered by client
      let intervalsQuery = 'SELECT i.*, c.nome as cliente_nome FROM intervalos i LEFT JOIN clientes c ON i.cliente_id = c.id WHERE dia_id = ?';
      let params: any[] = [day.id];

      if (clientId) {
        intervalsQuery += ' AND i.cliente_id = ?';
        params.push(clientId);
      }

      const intervals = await db.getAllAsync<any>(intervalsQuery, params);
      
      if (intervals.length === 0 && clientId) continue; // Skip days without target client

      let dayHours = 0;
      let dayValue = 0;

      const reportIntervals = intervals.map(int => {
        const dur = int.inicio && int.fim ? calculateDuration(int.inicio, int.fim) : 0;
        dayHours += dur;
        dayValue += int.valor_total || 0;
        return {
          inicio: int.inicio,
          fim: int.fim,
          cliente: int.cliente_nome || 'N/A',
          valor: int.valor_total || 0
        };
      });

      reportDays.push({
        date: new Date(day.data + 'T12:00:00').toLocaleDateString('pt-BR'),
        totalHours: dayHours,
        totalValue: dayValue,
        intervals: reportIntervals
      });

      totalHours += dayHours;
      totalValue += dayValue;
    }

    // Get specific client name if filtered
    let clientName = undefined;
    if (clientId) {
      const client = await db.getFirstAsync<any>('SELECT nome FROM clientes WHERE id = ?', [clientId]);
      clientName = client?.nome;
    }

    return {
      userName: user?.nome || 'Usuário Ponto Fácil',
      period: `${monthStr}/${year}`,
      clientName,
      days: reportDays,
      summary: { totalHours, totalValue }
    };
  }, [user]);

  const exportPDF = useCallback(async (month: number, year: number, clientId?: number) => {
    setExporting(true);
    try {
      const data = await fetchReportData(month, year, clientId);
      const html = generateReportHTML(data);
      
      const { uri } = await Print.printToFileAsync({ html });
      
      // UTI for PDF on iOS: 'public.pdf-document' or 'com.adobe.pdf'
      await Sharing.shareAsync(uri, { 
        UTI: Platform.OS === 'ios' ? 'com.adobe.pdf' : undefined,
        mimeType: 'application/pdf',
        dialogTitle: `Relatório Ponto Fácil - ${data.period}`
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    } finally {
      setExporting(false);
    }
  }, [fetchReportData]);

  const exportCSV = useCallback(async (month: number, year: number, clientId?: number) => {
    setExporting(true);
    try {
      const data = await fetchReportData(month, year, clientId);
      const csvContent = generateReportCSV(data);
      
      const fileName = `Relatorio_${data.period.replace('/', '-')}${clientId ? '_Filtrado' : ''}.csv`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { 
        mimeType: 'text/csv',
        dialogTitle: `Exportação CSV - ${data.period}`
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    } finally {
      setExporting(false);
    }
  }, [fetchReportData]);

  return { exportPDF, exportCSV, exporting };
}
