'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { ChevronLeft, ChevronRight, Plus, Share2, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './Calendar.module.css';
import ShiftForm from './ShiftForm';
import ShiftDetail from './ShiftDetail';
<<<<<<< Updated upstream
import { Shift } from '@/types';
=======
>>>>>>> Stashed changes
import { motion, AnimatePresence } from 'framer-motion';

// トーストの種類を定義
type ToastType = 'success' | 'error';

// トーストコンポーネント
const Toast = ({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? '#ef4444' : '#333';
  const Icon = type === 'error' ? AlertCircle : CheckCircle;

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: bgColor,
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '8px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      animation: 'fadeIn 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 'bold'
    }}>
      <Icon size={20} />
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedShift, setSelectedShift] = useState<any>(undefined);

<<<<<<< Updated upstream
  // Shift Detail Sheet State (from shiftpage_OT)
  const [viewingShift, setViewingShift] = useState<Shift | null>(null);

  // Double-tap logic ref (from shiftpage_OT)
=======
>>>>>>> Stashed changes
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const today = new Date();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const paginate = (newDirection: number) => {
    setViewingShift(null); // Dismiss detail view on navigation
    setPage([page + newDirection, newDirection]);
    setCurrentDate(newDirection > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    setIsDetailModalOpen(false);
  };

  const nextMonth = () => paginate(1);
  const prevMonth = () => paginate(-1);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewingShift(null); // Dismiss detail view
    const newYear = parseInt(e.target.value, 10);
    setCurrentDate(setYear(currentDate, newYear));
    setIsDetailModalOpen(false);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewingShift(null); // Dismiss detail view
    const newMonth = parseInt(e.target.value, 10);
    setCurrentDate(setMonth(currentDate, newMonth));
    setIsDetailModalOpen(false);
  };

  const currentYear = getYear(currentDate);
  const currentMonth = getMonth(currentDate);
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  const getShiftsForDay = (date: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.date), date));
  };

  // Click handler for empty cell (or cell background)
  const handleDayClick = (date: Date) => {
    // If detail view is open, just close it and return (Dismiss action)
    if (viewingShift) {
      setViewingShift(null);
      return;
    }

    setSelectedDate(date);
    setSelectedShift(undefined);
    setIsModalOpen(true);
    setIsDetailModalOpen(false);
  };

  // Click handler for Shift Item (Single vs Double Tap)
  const handleShiftClick = (e: React.MouseEvent, shift: any) => {
    e.stopPropagation();

    if (clickTimeoutRef.current) {
<<<<<<< Updated upstream
      // --- Double Tap Detected ---
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      // Cancel viewing shift if it was about to open
      setViewingShift(null);

      // Open Edit Modal
      setSelectedShift(shift);
      setSelectedDate(new Date(shift.date));
      setIsModalOpen(true);
    } else {
      // --- First Click (Potential Single Tap) ---
      // Dismiss any currently open detail view first, if it's a different one
      if (viewingShift && viewingShift.id !== shift.id) {
        setViewingShift(null);
      }

      clickTimeoutRef.current = setTimeout(() => {
        // --- Single Tap Confirmed ---
        clickTimeoutRef.current = null;
        setViewingShift(shift);
      }, 300); // 300ms delay for better double-tap detection
    }
=======
      // Double Tap Detected -> Edit Mode
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      setSelectedShift(shift);
      setSelectedDate(new Date(shift.date));
      setIsDetailModalOpen(false);
      setIsModalOpen(true);
    } else {
      // Single Tap -> Wait for potential second tap
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;

        // Single Tap Confirmed -> Detail Mode
        setSelectedShift(shift);
        setIsDetailModalOpen(true);
      }, 250);
    }
  };

  const handleDetailEdit = () => {
    setIsDetailModalOpen(false);
    setSelectedDate(new Date(selectedShift.date));
    setIsModalOpen(true);
>>>>>>> Stashed changes
  };

  const triggerToast = (msg: string, type: ToastType = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <button onClick={prevMonth} className="btn btn-outline"><ChevronLeft size={20} /></button>

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
          {['日', '月', '火', '水', '木', '金', '土'].map(day => (
            <div key={day} className={styles.dayHeader}>{day}</div>
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
                          marginBottom: '2px',
                          cursor: 'pointer',
                          userSelect: 'none'
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

      {/* Edit Form Modal */}
      {isModalOpen && (
        <ShiftForm
          initialDate={selectedDate}
          existingShift={selectedShift}
          onClose={() => setIsModalOpen(false)}
          onSave={() => triggerToast('シフトを保存しました！', 'success')}
          onDelete={() => triggerToast('シフトを削除しました。', 'success')}
          onToast={triggerToast}
        />
      )}

<<<<<<< Updated upstream
      {/* 詳細表示 Bottom Sheet (from shiftpage_OT) */}
      {viewingShift && (
        <ShiftDetail
          shift={viewingShift}
          job={jobs.find(j => j.id === viewingShift.jobId)}
          isOpen={!!viewingShift}
          onClose={() => setViewingShift(null)}
          onEdit={() => {
            setViewingShift(null); // Close sheet
            // Open edit modal directly
            setSelectedShift(viewingShift);
            setSelectedDate(new Date(viewingShift.date));
            setIsModalOpen(true);
          }}
        />
      )}

      {/* タイプ付きトーストを表示 (from main) */}
=======
      {/* Shift Detail Bottom Sheet */}
      <AnimatePresence>
        {isDetailModalOpen && selectedShift && (
          <ShiftDetail
            shift={selectedShift}
            job={jobs.find(j => j.id === selectedShift.jobId)}
            onClose={() => setIsDetailModalOpen(false)}
            onEdit={handleDetailEdit}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
>>>>>>> Stashed changes
      {showToast && <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />}
    </div>
  );
}