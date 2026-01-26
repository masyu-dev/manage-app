'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  getMonth,
  setDate,
  addDays,
  startOfDay,
  endOfDay
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { useApp } from '@/lib/store';
import { ChevronLeft, ChevronRight, Plus, Share2, X, Calculator, Moon } from 'lucide-react';
import styles from './Calendar.module.css';
import ShiftForm from './ShiftForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Job, Shift } from '@/types';

// --- 給与明細モーダル (深夜手当対応版) ---
const PayslipModal = ({ isOpen, onClose, job, payDate, shifts }: { 
  isOpen: boolean; 
  onClose: () => void; 
  job: Job; 
  payDate: Date; 
  shifts: Shift[] 
}) => {
  // ストアから設定（深夜割増率）を取得
  const { userConfig } = useApp();
  
  if (!isOpen || !job) return null;

  const calculation = useMemo(() => {
    const cutoffDay = job.closingDate || 31; 
    let periodEnd = new Date(payDate);
    let tentativeEnd = setDate(new Date(payDate), cutoffDay);
    
    // 締め日判定ロジック
    if (payDate.getDate() <= cutoffDay && cutoffDay !== 31) {
       if (payDate.getDate() <= cutoffDay) {
           tentativeEnd = subMonths(tentativeEnd, 1);
       }
    } else if (payDate.getDate() > cutoffDay) {
       tentativeEnd = setDate(new Date(payDate), cutoffDay);
    } else {
       tentativeEnd = subMonths(new Date(payDate), 1);
       tentativeEnd = endOfMonth(tentativeEnd);
    }

    periodEnd = endOfDay(tentativeEnd);
    let periodStart = startOfDay(addDays(subMonths(periodEnd, 1), 1));

    const targetShifts = shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return shift.jobId === job.id && 
             shiftDate >= periodStart && 
             shiftDate <= periodEnd;
    });

    let totalMinutes = 0;
    let totalNightMinutes = 0; // 深夜労働時間（分）

    targetShifts.forEach((shift) => {
      const [sH, sM] = shift.startTime.split(':').map(Number);
      const [eH, eM] = shift.endTime.split(':').map(Number);
      
      // 分換算 (0:00 = 0, 24:00 = 1440)
      let startMin = sH * 60 + sM;
      let endMin = eH * 60 + eM;
      
      // 日またぎ対応 (終了が開始より前なら+24時間)
      if (endMin < startMin) endMin += 1440;
      
      // 1. 総拘束時間の計算
      const duration = endMin - startMin;
      
      // 2. 休憩時間を引く (実労働時間)
      const breakMins = shift.breakTime || 0;
      const effectiveDuration = Math.max(0, duration - breakMins);
      totalMinutes += effectiveDuration;

      // 3. 深夜時間の計算 (22:00〜05:00)
      // 深夜帯の定義（分）: 
      // 当日 00:00-05:00 = 0 - 300
      // 当日 22:00-29:00 = 1320 - 1740 (翌05:00)
      
      const getOverlap = (start: number, end: number, rStart: number, rEnd: number) => {
        return Math.max(0, Math.min(end, rEnd) - Math.max(start, rStart));
      };

      // 0:00〜5:00 との重複 (早朝・深夜)
      const earlyMorningOverlap = getOverlap(startMin, endMin, 0, 300);
      // 22:00〜29:00 (翌5:00) との重複
      const lateNightOverlap = getOverlap(startMin, endMin, 1320, 1740);

      // そのシフトの深夜時間合計
      let shiftNightMinutes = earlyMorningOverlap + lateNightOverlap;

      // ※休憩時間が深夜にかぶっている可能性を考慮し、
      // 「計算された深夜時間」が「実労働時間」を超えないように補正する
      // (例: 22:00-23:00勤務で休憩60分なら、深夜労働は0分)
      shiftNightMinutes = Math.min(shiftNightMinutes, effectiveDuration);

      totalNightMinutes += shiftNightMinutes;
    });

    // 集計
    const totalHours = Math.max(0, totalMinutes / 60);
    const hourlyWage = job.hourlyWage || 1000;
    const multiplier = userConfig.nightWageMultiplier || 1.25; // デフォルト1.25倍
    
    // 基本給 = 実労働時間 × 時給
    const baseSalary = Math.floor((totalMinutes / 60) * hourlyWage);
    
    // 深夜割増分 = 深夜時間 × 時給 × (倍率 - 1) 
    // ※基本給の中に1.0倍分は既に入っているため、0.25倍分だけ足す
    const nightAllowance = Math.floor((totalNightMinutes / 60) * hourlyWage * (multiplier - 1));
    
    const totalAmount = baseSalary + nightAllowance;

    return {
      start: periodStart,
      end: periodEnd,
      count: targetShifts.length,
      hours: totalHours.toFixed(1),
      amount: totalAmount.toLocaleString(),
      nightHours: (totalNightMinutes / 60).toFixed(1), // 表示用に深夜時間も計算
      shifts: targetShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };
  }, [job, payDate, shifts, userConfig.nightWageMultiplier]);

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={22} color={job.color} /> 
            <span>給与明細</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', marginLeft: 'auto', marginRight: '8px' }}>
              (仮計算)
            </span>
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} color="#666" /></button>
        </div>

        {/* ヘッダー情報 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '4px', height: '40px', backgroundColor: job.color, borderRadius: '2px' }}></div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{job.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              期間: {format(calculation.start, 'M/d')} 〜 {format(calculation.end, 'M/d')}
            </div>
          </div>
        </div>

        {/* 金額・時間表示 */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryBox}>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>勤務時間</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{calculation.hours}<span style={{fontSize: '0.9rem'}}>h</span></div>
            {Number(calculation.nightHours) > 0 && (
                <div style={{ fontSize: '0.7rem', color: '#6b7280', display:'flex', alignItems:'center', justifyContent:'center', gap:'2px' }}>
                    <Moon size={10} /> 内深夜 {calculation.nightHours}h
                </div>
            )}
          </div>
          <div className={styles.summaryBox} style={{ background: '#fefce8', borderColor: '#fde047' }}>
             <div style={{ fontSize: '0.8rem', color: '#854d0e' }}>支給額目安</div>
             <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#854d0e' }}>¥{calculation.amount}</div>
          </div>
        </div>

        {/* 内訳リスト */}
        <div className={styles.shiftList}>
           <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>シフト内訳 ({calculation.count}日)</div>
           {calculation.shifts.map((s) => (
             <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: job.color }}></span>
                  <span>{format(new Date(s.date), 'M/d(E)', { locale: ja })}</span>
               </div>
               <span style={{ fontFamily: 'monospace' }}>{s.startTime}-{s.endTime}</span>
             </div>
           ))}
           {calculation.count === 0 && <div style={{textAlign:'center', color:'#999', fontSize:'0.8rem', padding: '20px'}}>対象期間のシフトはありません</div>}
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- Toast (変更なし) ---
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return createPortal(
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#333', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, animation: 'fadeIn 0.3s ease-out' }}>
      {message}
    </div>, document.body
  );
};

const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 100 : -100, opacity: 0 }),
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [[page, direction], setPage] = useState([0, 0]);
  const { shifts, jobs } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedShift, setSelectedShift] = useState<any>(undefined);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [selectedPaydayInfo, setSelectedPaydayInfo] = useState<{job: Job, date: Date} | null>(null);
  const today = new Date();
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

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => setCurrentDate(setYear(currentDate, parseInt(e.target.value, 10)));
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => setCurrentDate(setMonth(currentDate, parseInt(e.target.value, 10)));

  const currentYear = getYear(currentDate);
  const currentMonth = getMonth(currentDate);
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  const getShiftsForDay = (date: Date) => shifts.filter(shift => isSameDay(new Date(shift.date), date));

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

  const handlePaydayClick = (e: React.MouseEvent, job: Job, date: Date) => {
    e.stopPropagation();
    setSelectedPaydayInfo({ job, date });
    setIsPayslipOpen(true);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <button onClick={prevMonth} className="btn btn-outline"><ChevronLeft size={20} /></button>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={currentYear} onChange={handleYearChange} className={styles.monthTitle} style={{ border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none' }}>
            {years.map(year => <option key={year} value={year}>{year}年</option>)}
          </select>
          <select value={currentMonth} onChange={handleMonthChange} className={styles.monthTitle} style={{ border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none' }}>
            {months.map(month => <option key={month} value={month}>{month + 1}月</option>)}
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
          key={page} custom={direction} variants={variants}
          initial="enter" animate="center" exit="exit"
          transition={{ x: { type: "spring", stiffness: 600, damping: 40 }, opacity: { duration: 0.2 } }}
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
            
            // その日の給料日リスト
            const payDayJobs = jobs.filter(j => j.payDay === day.getDate());

            return (
              <div
                key={day.toString()}
                className={`${styles.dayCell} ${!isCurrentMonth ? styles.disabled : ''} ${isToday ? styles.today : ''}`}
                onClick={() => handleDayClick(day)}
              >
                {/* ▼ 日付と給料日バッジのヘッダー ▼ */}
                <div className={styles.cellHeader}>
                    <div className={`${styles.dateNumber} ${isSaturday ? styles.saturday : ''} ${isSunday ? styles.sunday : ''}`}>
                        {format(day, 'd')}
                    </div>
                    
                    {/* 給料日バッジコンテナ（右端） */}
                    <div className={styles.badgeContainer}>
                        {payDayJobs.map((j) => (
                            <div
                                key={`payday-${j.id}`}
                                className={styles.paydayBadge}
                                onClick={(e) => handlePaydayClick(e, j, day)}
                                style={{ backgroundColor: j.color }}
                                title="タップして明細を確認"
                            >
                                💰給料日
                            </div>
                        ))}
                    </div>
                </div>

                {/* シフトリスト */}
                <div className={styles.shiftList}>
                  {dayShifts.map(shift => {
                    const job = jobs.find(j => j.id === shift.jobId);
                    return (
                      <div
                        key={shift.id}
                        className={styles.shiftItem}
                        style={{
                          backgroundColor: job ? job.color : 'hsl(217, 91%, 60%)',
                          color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontWeight: 'bold', display: 'inline-flex',
                          alignItems: 'center', marginBottom: '2px'
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
                  <button className={styles.addButton}><Plus size={16} /></button>
                )}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* シフト編集モーダル */}
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

      {/* 給与明細モーダル */}
      <PayslipModal 
        isOpen={isPayslipOpen}
        onClose={() => setIsPayslipOpen(false)}
        job={selectedPaydayInfo?.job as Job}
        payDate={selectedPaydayInfo?.date as Date}
        shifts={shifts}
      />

      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
    </div>
  );
}