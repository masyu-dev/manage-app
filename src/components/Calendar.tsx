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
import { ChevronLeft, ChevronRight, Plus, Share2, AlertCircle, CheckCircle, LayoutGrid, LayoutList } from 'lucide-react'; // アイコン追加
import styles from './Calendar.module.css';
import ShiftForm from './ShiftForm';
import VerticalCalendar from './VerticalCalendar';
import { motion, AnimatePresence } from 'framer-motion';

// トーストの種類を定義
type ToastType = 'success' | 'error';

// トーストコンポーネント（色とアイコンを出し分け）
const Toast = ({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // 背景色とアイコンの切り替え
  const bgColor = type === 'error' ? '#ef4444' : '#333'; // エラーなら赤、通常は黒
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { shifts, jobs } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedShift, setSelectedShift] = useState<any>(undefined);

  const today = new Date();

  // トースト管理（メッセージとタイプ）
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

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
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
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

  // トースト表示関数（タイプ指定可能に拡張）
  const triggerToast = (msg: string, type: ToastType = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="btn btn-outline"
            title={viewMode === 'grid' ? 'リスト表示' : 'グリッド表示'}
          >
            {viewMode === 'grid' ? <LayoutList size={20} /> : <LayoutGrid size={20} />}
          </button>
          <button onClick={prevMonth} className="btn btn-outline"><ChevronLeft size={20} /></button>
        </div>

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
          key={page + viewMode}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 600, damping: 40 },
            opacity: { duration: 0.2 }
          }}
          className={viewMode === 'grid' ? styles.grid : ''}
        >
          {viewMode === 'grid' ? (
            <>
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
                    {/* Payday Highlight */}
                    <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginBottom: '2px' }}>
                      {jobs.filter(j => j.payDay === day.getDate()).map(j => (
                        <div
                          key={j.id}
                          title={`${j.name} 給料日`}
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: j.color,
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}
                        />
                      ))}
                    </div>
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
            </>
          ) : (
            <VerticalCalendar
              currentDate={currentDate}
              shifts={shifts}
              jobs={jobs}
              onDayClick={handleDayClick}
              onShiftClick={handleShiftClick}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {isModalOpen && (
        <ShiftForm
          initialDate={selectedDate}
          existingShift={selectedShift}
          onClose={() => setIsModalOpen(false)}
          onSave={() => triggerToast('シフトを保存しました！', 'success')}
          onDelete={() => triggerToast('シフトを削除しました。', 'success')}
          onToast={triggerToast} // 子コンポーネントに高機能なトースト関数を渡す
        />
      )}

      {/* タイプ付きトーストを表示 */}
      {showToast && <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />}
    </div>
  );
}