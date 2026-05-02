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
    chartData: []
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
        "SELECT * FROM dias WHERE data LIKE ? || '-%'",
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
          'SELECT SUM(valor_total) as valTotal FROM intervalos WHERE dia_id = ?',
          [day.id]
        );

        valueTotal += dayIntervals[0]?.valTotal || 0;
        
        const intervals = await db.getAllAsync<any>(
          'SELECT inicio, fim FROM intervalos WHERE dia_id = ?',
          [day.id]
        );
        
        let dayMinutes = 0;
        for (const int of intervals) {
          if (int.inicio && int.fim) {
            const [h1, m1] = int.inicio.split(':').map(Number);
            const [h2, m2] = int.fim.split(':').map(Number);
            dayMinutes += (h2 * 60 + m2) - (h1 * 60 + m1);
          }
        }
        
        const dayHours = dayMinutes / 60;
        hoursTotal += dayHours;

        if (day.data) {
          const dayNumberMatch = day.data.split('-')[2];
          if (dayNumberMatch) {
            const dNum = parseInt(dayNumberMatch, 10);
            const chartItem = chartData.find(c => c.day === dNum);
            if (chartItem) {
              chartItem.hours = dayHours;
            }
          }
        }

        if (day.tipo === 'UTIL') workingDays++;
        if (day.horas_meta) dailyMeta = day.horas_meta;
      }

      // Fetch estimated value from meses table
      const mesRecord = await db.getFirstAsync<any>(
        'SELECT estimativa, valor_hora FROM meses WHERE ano_mes = ?',
        [anoMes]
      );
      const estimativa = (mesRecord?.estimativa || 0) * (mesRecord?.valor_hora || 0);

      const expectedHours = workingDays * dailyMeta;
      const progressPercent = expectedHours > 0 ? (hoursTotal / expectedHours) * 100 : 0;

      setSummary({
        hoursTotal,
        valueTotal,
        workingDays,
        expectedHours,
        progressPercent,
        estimativa,
        chartData
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
