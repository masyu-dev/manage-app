'use client';

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useApp } from '@/lib/store';
import { ChevronLeft, ChevronRight, Plus, Share2 } from 'lucide-react';
import styles from './Calendar.module.css';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { shifts } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedShift, setSelectedShift] = useState<any>(undefined);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getShiftsForDay = (date: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.date), date));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedShift(undefined);
    setIsModalOpen(true);
  };

  const handleShiftClick = (e: React.MouseEvent, shift: any) => {
    e.stopPropagation();
    setSelectedShift(shift);
    setSelectedDate(new Date(shift.date));
    setIsModalOpen(true);
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <button onClick={prevMonth} className="btn btn-outline"><ChevronLeft size={20} /></button>
        <h2 className={styles.monthTitle}>{format(currentDate, 'yyyy年 M月', { locale: ja })}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => {
            const text = shifts
              .filter(s => isSameMonth(new Date(s.date), currentDate))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(s => `${format(new Date(s.date), 'M/d(E)', { locale: ja })} ${s.startTime}-${s.endTime}`)
              .join('\n');
            navigator.clipboard.writeText(text);
            alert('シフトをコピーしました！');
          }} className="btn btn-outline" title="シフトをコピー">
            <Share2 size={20} />
          </button>
          <button onClick={nextMonth} className="btn btn-outline"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className={styles.grid}>
        {['日', '月', '火', '水', '木', '金', '土'].map(day => (
          <div key={day} className={styles.dayHeader}>{day}</div>
        ))}

        {calendarDays.map(day => {
          const dayShifts = getShiftsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div
              key={day.toString()}
              className={`${styles.dayCell} ${!isCurrentMonth ? styles.disabled : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <div className={styles.dateNumber}>{format(day, 'd')}</div>
              <div className={styles.shiftList}>
                {dayShifts.map(shift => (
                  <div
                    key={shift.id}
                    className={styles.shiftItem}
                    onClick={(e) => handleShiftClick(e, shift)}
                  >
                    {shift.startTime}-{shift.endTime}
                  </div>
                ))}
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

      {isModalOpen && (
        <ShiftForm
          initialDate={selectedDate}
          existingShift={selectedShift}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
import ShiftForm from './ShiftForm';
