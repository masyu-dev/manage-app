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
import styles from './VerticalCalendar.module.css';

interface VerticalCalendarProps {
  currentDate: Date;
  shifts: Shift[];
  jobs: Job[];
  onDayClick: (date: Date) => void;
  onShiftClick: (e: React.MouseEvent, shift: Shift) => void;
}

export default function VerticalCalendar({
  currentDate,
  shifts,
  jobs,
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
              {dayShifts.length > 0 ? (
                dayShifts.map((shift) => {
                  const job = jobs.find((j) => j.id === shift.jobId);
                  const backgroundColor = job ? job.color : 'hsl(217, 91%, 60%)';
                  return (
                    <div
                      key={shift.id}
                      className={styles.shiftItem}
                      style={{ backgroundColor }}
                      onClick={(e) => onShiftClick(e, shift)}
                    >
                      {job && <span style={{ marginRight: '4px', opacity: 0.9 }}>{job.name.slice(0, 1)}</span>}
                      {shift.startTime}-{shift.endTime}
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
