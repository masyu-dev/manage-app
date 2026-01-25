'use client';

import React from 'react';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { Shift, Job } from '@/types';
import { calculateShiftSalary } from '@/lib/calculations';
import styles from './VerticalCalendar.module.css';

interface VerticalCalendarProps {
  currentDate: Date;
  shifts: Shift[];
  jobs: Job[];
  nightWageMultiplier: number;
  onDayClick: (date: Date) => void;
  onShiftClick: (e: React.MouseEvent, shift: Shift) => void;
}

export default function VerticalCalendar({
  currentDate,
  shifts,
  jobs,
  nightWageMultiplier,
  onDayClick,
  onShiftClick,
}: VerticalCalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getShiftsForDay = (date: Date) => {
    return shifts.filter((shift) => isSameDay(new Date(shift.date), date));
  };

  const today = new Date();

  return (
    <div className={styles.container}>
      {days.map((day) => {
        const dayShifts = getShiftsForDay(day);
        const isToday = isSameDay(day, today);
        const isSaturday = day.getDay() === 6;
        const isSunday = day.getDay() === 0;

        return (
          <div
            key={day.toString()}
            className={`${styles.dayRow} ${isToday ? styles.today : ''}`}
            onClick={() => onDayClick(day)}
          >
            <div className={styles.dateSection}>
              <div
                className={`${styles.dateNumber} ${isSaturday ? styles.saturday : isSunday ? styles.sunday : ''
                  }`}
              >
                {format(day, 'd')}
              </div>
              <div className={styles.dayOfWeek}>
                {format(day, 'EEE', { locale: ja })}
              </div>
            </div>
            <div className={styles.shiftSection}>
              {/* Payday Label */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: dayShifts.length > 0 ? '4px' : '0' }}>
                {jobs.filter(j => j.payDay === day.getDate()).map(j => (
                  <div
                    key={j.id}
                    style={{
                      fontSize: '0.65rem',
                      backgroundColor: j.color,
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    💰 {j.name} 給料日
                  </div>
                ))}
              </div>
              {dayShifts.length > 0 ? (
                dayShifts.map((shift) => {
                  const job = jobs.find((j) => j.id === shift.jobId);
                  const backgroundColor = job ? job.color : 'hsl(217, 91%, 60%)';
                  return (
                    <div
                      key={shift.id}
                      className={styles.shiftItem}
                      style={{
                        backgroundColor,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onClick={(e) => onShiftClick(e, shift)}
                    >
                      <span>
                        {job && <span style={{ marginRight: '4px', opacity: 0.9 }}>{job.name.slice(0, 1)}</span>}
                        {shift.startTime}-{shift.endTime}
                      </span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                        ¥{calculateShiftSalary(shift, nightWageMultiplier).toLocaleString()}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className={styles.noShifts}>予定なし</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
