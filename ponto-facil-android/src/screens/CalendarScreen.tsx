import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign, Clock, TrendingUp } from 'lucide-react-native';
import { useMonths } from '../hooks/useMonths';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 7;

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const MONTHS_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const { selectedMonth, summary, loading, changeMonth } = useMonths();

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
        <ChevronLeft color="#460045" size={24} />
      </TouchableOpacity>
      
      <View style={styles.monthTitle}>
        <Text style={styles.monthName}>{MONTHS_BR[selectedMonth.getMonth()]}</Text>
        <Text style={styles.yearName}>{selectedMonth.getFullYear()}</Text>
      </View>

      <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
        <ChevronRight color="#460045" size={24} />
      </TouchableOpacity>
    </View>
  );

  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Clock size={16} color="#631660" />
        <Text style={styles.summaryValue}>{summary.hoursTotal.toFixed(1)}h</Text>
        <Text style={styles.summaryLabel}>Total Horas</Text>
      </View>
      
      <View style={styles.summaryCard}>
        <DollarSign size={16} color="#631660" />
        <Text style={styles.summaryValue}>R$ {summary.valueTotal.toFixed(2)}</Text>
        <Text style={styles.summaryLabel}>Total Valor</Text>
      </View>

      <View style={styles.summaryCard}>
        <TrendingUp size={16} color="#631660" />
        <Text style={styles.summaryValue}>{summary.progressPercent.toFixed(0)}%</Text>
        <Text style={styles.summaryLabel}>Meta</Text>
      </View>
    </View>
  );

  const generateDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, key: `empty-${i}` });
    }
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, key: `day-${i}` });
    }
    return days;
  };

  const dayItems = generateDays();

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {renderHeader()}
        {renderSummary()}
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.weekHeader}>
          {WEEKDAYS.map(day => (
            <Text key={day} style={styles.weekText}>{day}</Text>
          ))}
        </View>

        <FlatList
          data={dayItems}
          numColumns={7}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            if (!item.day) return <View style={styles.dayCellEmpty} />;
            
            const isToday = new Date().toDateString() === new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), item.day).toDateString();
            
            return (
              <TouchableOpacity 
                style={[styles.dayCell, isToday && styles.todayCell]}
                onPress={() => {
                   const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
                   navigation.navigate('Day', { date: dateStr });
                }}
              >
                <Text style={[styles.dayText, isToday && styles.todayText]}>{item.day}</Text>
                {/* Visual indicator for work - for now, just a dot */}
                <View style={styles.workIndicator} />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topSection: {
    backgroundColor: theme.colors.surface_container,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    alignItems: 'center',
  },
  monthName: {
    fontSize: 22,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
  },
  yearName: {
    fontSize: 14,
    color: theme.colors.on_surface_variant,
    marginTop: 2,
    fontFamily: theme.fonts.regular,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    width: (width - 64) / 3,
    elevation: 2,
    shadowColor: '#460045',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.on_surface,
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: theme.colors.on_surface_variant,
    textTransform: 'uppercase',
    fontFamily: theme.fonts.regular,
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekText: {
    width: COLUMN_WIDTH,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary_container,
  },
  dayCell: {
    width: COLUMN_WIDTH,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 12,
  },
  dayCellEmpty: {
    width: COLUMN_WIDTH,
    height: 60,
  },
  dayText: {
    fontSize: 16,
    color: theme.colors.on_surface,
    fontFamily: theme.fonts.medium,
  },
  todayCell: {
    backgroundColor: theme.colors.primary_container,
  },
  todayText: {
    color: theme.colors.on_primary,
    fontFamily: theme.fonts.bold,
  },
  workIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#631660',
    marginTop: 4,
  }
});
