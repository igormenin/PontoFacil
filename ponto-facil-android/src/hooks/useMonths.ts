import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../database/db';

export interface MonthSummary {
  hoursTotal: number;
  valueTotal: number;
  workingDays: number;
  expectedHours: number;
  progressPercent: number;
}

export function useMonths() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [summary, setSummary] = useState<MonthSummary>({
    hoursTotal: 0,
    valueTotal: 0,
    workingDays: 0,
    expectedHours: 0,
    progressPercent: 0
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

      for (const day of days) {
        // Calculate totals from intervals for this day
        const dayIntervals = await db.getAllAsync<any>(
          'SELECT SUM(valor_total) as valTotal FROM intervalos WHERE dia_id = ?',
          [day.id]
        );

        // Actually, hours_total should be in the 'dias' table or calculated here?
        // Let's assume we need to calculate them if not present.
        // For now, let's use the sums
        valueTotal += dayIntervals[0]?.valTotal || 0;
        
        // Sum durations (HH:mm) - we might need a utility to sum durations
        // Re-calculate hours total for accuracy if needed
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
        hoursTotal += dayMinutes / 60;

        if (day.tipo === 'UTIL') workingDays++;
        if (day.horas_meta) dailyMeta = day.horas_meta;
      }

      const expectedHours = workingDays * dailyMeta;
      const progressPercent = expectedHours > 0 ? (hoursTotal / expectedHours) * 100 : 0;

      setSummary({
        hoursTotal,
        valueTotal,
        workingDays,
        expectedHours,
        progressPercent
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
