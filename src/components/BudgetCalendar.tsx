'use client';

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useApp } from '@/lib/store';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import styles from './Calendar.module.css'; // Reusing Calendar styles for consistency
import TransactionForm from './TransactionForm';

export default function BudgetCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { transactions } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getTransactionsForDay = (date: Date) => {
    return transactions.filter(t => isSameDay(new Date(t.date), date));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsFormOpen(true);
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <button onClick={prevMonth} className="btn btn-outline"><ChevronLeft size={20} /></button>
        <h2 className={styles.monthTitle}>{format(currentDate, 'yyyy年 M月', { locale: ja })}</h2>
        <button onClick={nextMonth} className="btn btn-outline"><ChevronRight size={20} /></button>
      </div>

      <div className={styles.grid}>
        {['日', '月', '火', '水', '木', '金', '土'].map(day => (
          <div key={day} className={styles.dayHeader}>{day}</div>
        ))}

        {calendarDays.map(day => {
          const dayTransactions = getTransactionsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);

          const dailyIncome = dayTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

          const dailyExpense = dayTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          return (
            <div
              key={day.toString()}
              className={`${styles.dayCell} ${!isCurrentMonth ? styles.disabled : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <div className={styles.dateNumber}>{format(day, 'd')}</div>
              <div className={styles.shiftList}>
                {dailyIncome > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>+{dailyIncome.toLocaleString()}</div>
                )}
                {dailyExpense > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>-{dailyExpense.toLocaleString()}</div>
                )}
              </div>
              {isCurrentMonth && (
                <button className={styles.addButton}>
                  <Plus size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isFormOpen && (
        <TransactionForm
          initialDate={selectedDate}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
