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
      "SELECT * FROM dia WHERE dia_data LIKE ? || '-%' ORDER BY dia_data ASC",
      [anoMes]
    );

    const reportDays: any[] = [];
    let totalHours = 0;
    let totalValue = 0;

    for (const day of days) {
      // 2. Fetch intervals for day, potentially filtered by client
      let intervalsQuery = 'SELECT i.*, c.cli_nome as cliente_nome FROM intervalo i LEFT JOIN cliente c ON i.int_cli_id = c.id WHERE int_dia_id = ?';
      let params: any[] = [day.id];

      if (clientId) {
        intervalsQuery += ' AND i.int_cli_id = ?';
        params.push(clientId);
      }

      const intervals = await db.getAllAsync<any>(intervalsQuery, params);
      
      if (intervals.length === 0 && clientId) continue; // Skip days without target client

      let dayHours = 0;
      let dayValue = 0;

      const reportIntervals = intervals.map(int => {
        const dur = int.int_inicio && int.int_fim ? calculateDuration(int.int_inicio, int.int_fim) : 0;
        dayHours += dur;
        dayValue += int.int_valor_total || 0;
        return {
          inicio: int.int_inicio,
          fim: int.int_fim,
          cliente: int.cliente_nome || 'N/A',
          valor: int.int_valor_total || 0
        };
      });

      reportDays.push({
        date: new Date(day.dia_data + 'T12:00:00').toLocaleDateString('pt-BR'),
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
      const client = await db.getFirstAsync<any>('SELECT cli_nome FROM cliente WHERE id = ?', [clientId]);
      clientName = client?.cli_nome;
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
      const FS = FileSystem as any;
      const fileName = `Relatorio_${data.period.replace('/', '-')}${clientId ? '_Filtrado' : ''}.csv`;
      const fileUri = FS.cacheDirectory + fileName;
      
      await FS.writeAsStringAsync(fileUri, csvContent, { encoding: FS.EncodingType.UTF8 });
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
