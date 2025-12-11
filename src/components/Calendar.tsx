'use client';

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useApp } from '@/lib/store';
import { ChevronLeft, ChevronRight, Plus, Share2 } from 'lucide-react';
import styles from './Calendar.module.css';
import ShiftForm from './ShiftForm';
import { motion, AnimatePresence } from 'framer-motion';

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};


export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [[page, direction], setPage] = useState([0, 0]);
  const { shifts, jobs } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedShift, setSelectedShift] = useState<any>(undefined);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
    setCurrentDate(newDirection > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  const nextMonth = () => paginate(1);
  const prevMonth = () => paginate(-1);

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

      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 500, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className={styles.grid}
        >
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
                  {dayShifts.map(shift => {
                    const job = jobs.find(j => j.id === shift.jobId);
                    const backgroundColor = job ? job.color : 'hsl(217, 91%, 60%)';
                    return (
                      <div
                        key={shift.id}
                        className={styles.shiftItem}
                        style={{ backgroundColor, color: '#fff' }}
                        onClick={(e) => handleShiftClick(e, shift)}
                      >
                        {job && <span style={{ fontSize: '0.6rem', marginRight: '2px', opacity: 0.9 }}>{job.name.slice(0, 1)}</span>}
                        {shift.startTime}-{shift.endTime}
                      </div>
                    );
                  })}
                </div>
                {isCurrentMonth && (
                  <button className={styles.addButton}>
                    <Plus size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

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

