'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  setMonth, 
  setYear, 
  getYear, 
  getMonth 
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { useApp } from '@/lib/store';
import { ChevronLeft, ChevronRight, Plus, Share2 } from 'lucide-react';
import styles from './Calendar.module.css';
import ShiftForm from './ShiftForm';
import { motion, AnimatePresence } from 'framer-motion';

// トーストコンポーネント
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: '#333',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '8px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {message}
    </div>,
    document.body
  );
};

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
  
  const today = new Date();

  // トースト表示用のstate
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  // 年月選択用のハンドラ
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setCurrentDate(setYear(currentDate, newYear));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    setCurrentDate(setMonth(currentDate, newMonth));
  };

  const currentYear = getYear(currentDate);
  const currentMonth = getMonth(currentDate);
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i); // +/- 5 years
  const months = Array.from({ length: 12 }, (_, i) => i);

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

  // トースト表示用の関数
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <button onClick={prevMonth} className="btn btn-outline"><ChevronLeft size={20} /></button>

        {/* 年月選択ドロップダウン */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={currentYear}
            onChange={handleYearChange}
            className={styles.monthTitle}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none' }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>
          <select
            value={currentMonth}
            onChange={handleMonthChange}
            className={styles.monthTitle}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none' }}
          >
            {months.map(month => (
              <option key={month} value={month}>{month + 1}月</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => {
            const text = shifts
              .filter(s => isSameMonth(new Date(s.date), currentDate))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(s => `${format(new Date(s.date), 'M/d(E)', { locale: ja })} ${s.startTime}-${s.endTime}`)
              .join('\n');
            navigator.clipboard.writeText(text);
            triggerToast('シフトをコピーしました！');
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
            x: { type: "spring", stiffness: 600, damping: 40 },
            opacity: { duration: 0.2 }
          }}
          className={styles.grid}
        >
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div key={day} className={`${styles.dayHeader} ${index === 0 ? styles.sunday : index === 6 ? styles.saturday : ''}`}>{day}</div>
          ))}

          {calendarDays.map(day => {
            const dayShifts = getShiftsForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isSaturday = day.getDay() === 6;
            const isSunday = day.getDay() === 0;
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toString()}
                className={`${styles.dayCell} ${!isCurrentMonth ? styles.disabled : ''} ${isToday ? styles.today : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <div className={`${styles.dateNumber} ${isSaturday ? styles.saturday : ''} ${isSunday ? styles.sunday : ''}`}>{format(day, 'd')}</div>
                <div className={styles.shiftList}>
                  {dayShifts.map(shift => {
                    const job = jobs.find(j => j.id === shift.jobId);
                    const backgroundColor = job ? job.color : 'hsl(217, 91%, 60%)';
                    return (
                      <div
                        key={shift.id}
                        className={styles.shiftItem}
                        style={{
                          backgroundColor,
                          color: '#fff',
                          borderRadius: '12px',
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          marginBottom: '2px'
                        }}
                        onClick={(e) => handleShiftClick(e, shift)}
                      >
                        {job && <span style={{ marginRight: '4px', opacity: 0.9 }}>{job.name.slice(0, 1)}</span>}
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

      {/* ShiftFormにトースト関連のPropsを渡す */}
      {isModalOpen && (
        <ShiftForm
          initialDate={selectedDate}
          existingShift={selectedShift}
          onClose={() => setIsModalOpen(false)}
          onSave={() => triggerToast('シフトを保存しました！')}
          onDelete={() => triggerToast('シフトを削除しました。')}
          onToast={triggerToast}
        />
      )}

      {/* トースト表示 */}
      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
    </div>
  );
}