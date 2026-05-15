import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../database/db';

export interface DailyChartData {
  day: number;
  date: string;
  hours: number;
}

export interface MonthSummary {
  hoursTotal: number;
  valueTotal: number;
  workingDays: number;
  expectedHours: number;
  progressPercent: number;
  estimativa: number;
  chartData: DailyChartData[];
  dailyMeta: number;
}

export function useMonths() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [summary, setSummary] = useState<MonthSummary>({
    hoursTotal: 0,
    valueTotal: 0,
    workingDays: 0,
    expectedHours: 0,
    progressPercent: 0,
    estimativa: 0,
    chartData: [],
    dailyMeta: 8
  });
  const [loading, setLoading] = useState(true);

  const fetchMonthData = useCallback(async () => {
    setLoading(true);
    const db = await getDatabase();
    
    // Format YYYY-MM
    const year = selectedMonth.getFullYear();
    const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
    const anoMes = `${year}-${month}`;

    try {
      // 1. Fetch days for this month to aggregate
      const days = await db.getAllAsync<any>(
        "SELECT * FROM dia WHERE diaData LIKE ? || '-%'",
        [anoMes]
      );

      let hoursTotal = 0;
      let valueTotal = 0;
      let workingDays = 0;
      let dailyMeta = 8; // Default

      let chartData: DailyChartData[] = [];
      const now = new Date();
      const isCurrentMonth = selectedMonth.getFullYear() === now.getFullYear() && selectedMonth.getMonth() === now.getMonth();
      const isFutureMonth = selectedMonth.getFullYear() > now.getFullYear() || (selectedMonth.getFullYear() === now.getFullYear() && selectedMonth.getMonth() > now.getMonth());

      let maxDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
      if (isCurrentMonth) {
        maxDay = now.getDate();
      } else if (isFutureMonth) {
        maxDay = 0;
      }

      for (let i = 1; i <= maxDay; i++) {
        chartData.push({
          day: i,
          date: `${anoMes}-${String(i).padStart(2, '0')}`,
          hours: 0,
        });
      }

      for (const day of days) {
        // Calculate totals from intervals for this day
        const dayIntervals = await db.getAllAsync<any>(
          'SELECT SUM(intValorTotal) as valTotal FROM intervalo WHERE intDiaId = ?',
          [day.id]
        );

        valueTotal += dayIntervals[0]?.valTotal || 0;
        
        const intervals = await db.getAllAsync<any>(
          'SELECT intInicio, intFim FROM intervalo WHERE intDiaId = ?',
          [day.id]
        );
        
        let dayMinutes = 0;
        for (const int of intervals) {
          if (int.intInicio && int.intFim) {
            const [h1, m1] = int.intInicio.split(':').map(Number);
            const [h2, m2] = int.intFim.split(':').map(Number);
            dayMinutes += (h2 * 60 + m2) - (h1 * 60 + m1);
          }
        }
        
        const dayHours = dayMinutes / 60;
        hoursTotal += dayHours;

        if (day.diaData) {
          const dayNumberMatch = day.diaData.split('-')[2];
          if (dayNumberMatch) {
            const dNum = parseInt(dayNumberMatch, 10);
            const chartItem = chartData.find(c => c.day === dNum);
            if (chartItem) {
              chartItem.hours = dayHours;
            }
          }
        }

        if (day.diaTipo && day.diaTipo.toUpperCase() === 'UTIL') workingDays++;
        if (day.diaHorasMeta && day.diaHorasMeta > 0) dailyMeta = day.diaHorasMeta;
      }
      
      // If we found days but no UTIL days, and it's a util month, fallback to 22
      if (workingDays === 0 && days.length > 0) {
        workingDays = days.filter(d => {
          const dayOfWeek = new Date(d.diaData + 'T12:00:00').getDay();
          return dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday or Saturday
        }).length || 22;
      }

      // Fetch estimated value from mes table
      const mesRecord = await db.getFirstAsync<any>(
        'SELECT mesEstimativa, mesValorHora FROM mes WHERE mesAnoMes = ?',
        [anoMes]
      );
      
      let valorHora = mesRecord?.mesValorHora || 0;
      
      // Fallback: try to get from history if zero
      if (valorHora === 0) {
        const historyRecord = await db.getFirstAsync<any>(
          'SELECT vhValor FROM valor_hora WHERE vhMesInicio <= ? ORDER BY vhMesInicio DESC LIMIT 1',
          [anoMes]
        );
        valorHora = historyRecord?.vhValor || 0;
      }
      
      // Ultra Fallback: Get ANY vhValor from history if still zero
      if (valorHora === 0) {
        const anyHistory = await db.getFirstAsync<any>(
          'SELECT vhValor FROM valor_hora ORDER BY updated_at DESC LIMIT 1'
        );
        valorHora = anyHistory?.vhValor || 0;
      }

      // Final Fallback: Get from any month record
      if (valorHora === 0) {
        const anyMes = await db.getFirstAsync<any>(
          'SELECT mesValorHora FROM mes WHERE mesValorHora > 0 LIMIT 1'
        );
        valorHora = anyMes?.mesValorHora || 0;
      }

      // Ultra Final Fallback: Get from any interval record
      if (valorHora === 0) {
        const anyInterval = await db.getFirstAsync<any>(
          'SELECT intValorHora FROM intervalo WHERE intValorHora > 0 ORDER BY id DESC LIMIT 1'
        );
        valorHora = anyInterval?.intValorHora || 0;
      }

      const expectedHours = workingDays * dailyMeta;
      
      // If mesRecord has a direct estimativa (value), use it. 
      // Otherwise, calculate based on expectedHours * valorHora
      const estimativa = mesRecord?.mesEstimativa ? (mesRecord.mesEstimativa * valorHora) : (expectedHours * valorHora);
      const progressPercent = expectedHours > 0 ? (hoursTotal / expectedHours) * 100 : 0;

      setSummary({
        hoursTotal,
        valueTotal,
        workingDays,
        expectedHours,
        progressPercent,
        estimativa,
        chartData,
        dailyMeta
      });
    } catch (error) {
      console.error('Error fetching month data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  const changeMonth = (delta: number) => {
    const next = new Date(selectedMonth);
    next.setMonth(selectedMonth.getMonth() + delta);
    setSelectedMonth(next);
  };

  return {
    selectedMonth,
    summary,
    loading,
    changeMonth,
    refresh: fetchMonthData
  };
}
