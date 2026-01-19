'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { calculateMonthlySalary, calculateShiftSalary, calculateDuration } from '@/lib/calculations';
import { format, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#2EC4B6', '#E71D36'];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

export default function SalaryView() {
  const { shifts, userConfig, updateUserConfig, jobs, addJob, updateJob, deleteJob } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [[page, direction], setPage] = useState([0, 0]);

  // Job Management State
  const [newJobName, setNewJobName] = useState('');
  const [newJobWage, setNewJobWage] = useState(userConfig.hourlyWage.toString());
  const [newJobColor, setNewJobColor] = useState(COLORS[0]);
  const [newJobPayDay, setNewJobPayDay] = useState('25');
  const [newJobClosingDate, setNewJobClosingDate] = useState('31'); // デフォルト末日(31)
  
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // Wage Input State
  const [hourlyWageInput, setHourlyWageInput] = useState(userConfig.hourlyWage.toString());
  const [nightWageInput, setNightWageInput] = useState(userConfig.nightWageMultiplier ? userConfig.nightWageMultiplier.toString() : '1.25');

  // 深夜手当の入力モード ('multiplier' = 倍率, 'amount' = 金額)
  const [nightWageMode, setNightWageMode] = useState<'multiplier' | 'amount'>('multiplier');

  // Sync from store
  useEffect(() => {
    if (Number(hourlyWageInput) !== userConfig.hourlyWage && hourlyWageInput !== '' && userConfig.hourlyWage !== 0) {
      setHourlyWageInput(userConfig.hourlyWage.toString());
    }
  }, [userConfig.hourlyWage]);

  useEffect(() => {
    const currentNight = Number(nightWageInput);
    const storeNight = userConfig.nightWageMultiplier;
    if (currentNight !== storeNight && !(nightWageInput === '' && storeNight === 0)) {
      setNightWageInput(storeNight ? storeNight.toString() : '');
    }
  }, [userConfig.nightWageMultiplier]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const monthlySalary = calculateMonthlySalary(shifts, year, month, userConfig.nightWageMultiplier);

  const currentMonthShifts = shifts.filter(shift => {
    const date = new Date(shift.date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalHours = currentMonthShifts.reduce((acc, shift) => {
    return acc + calculateDuration(shift.startTime, shift.endTime, shift.breakTime);
  }, 0);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
    setCurrentDate(newDirection > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  const nextMonth = () => paginate(1);
  const prevMonth = () => paginate(-1);

  const handleAddJob = () => {
    if (newJobName && newJobWage) {
      const jobData = {
        name: newJobName,
        hourlyWage: Number(newJobWage),
        color: newJobColor,
        payDay: Number(newJobPayDay) || 25,
        closingDate: Number(newJobClosingDate) || 31,
      };

      if (editingJobId) {
        updateJob({
          ...jobData,
          id: editingJobId,
        });
      } else {
        addJob({
          ...jobData,
          id: crypto.randomUUID(),
        });
      }

      resetJobForm();
    }
  };

  const resetJobForm = () => {
    setNewJobName('');
    setNewJobWage(userConfig.hourlyWage.toString());
    setNewJobColor(COLORS[0]);
    setNewJobPayDay('25');
    setNewJobClosingDate('31');
    setEditingJobId(null);
    setIsJobFormOpen(false);
  };

  const handleEditJob = (job: any) => {
    setNewJobName(job.name);
    setNewJobWage(job.hourlyWage.toString());
    setNewJobColor(job.color);
    setNewJobPayDay(job.payDay ? job.payDay.toString() : '25');
    setNewJobClosingDate(job.closingDate ? job.closingDate.toString() : '31');
    setEditingJobId(job.id);
    setIsJobFormOpen(true);
  };

  // 深夜手当: 金額入力時のハンドラ
  const handleNightAmountChange = (amountStr: string) => {
    const amount = Number(amountStr);
    const baseWage = Number(hourlyWageInput);

    if (baseWage > 0 && amount > 0) {
      const calculatedMultiplier = amount / baseWage;
      setNightWageInput(calculatedMultiplier.toString());
      updateUserConfig({ nightWageMultiplier: calculatedMultiplier });
    } else if (amountStr === '') {
      updateUserConfig({ nightWageMultiplier: 0 });
    }
  };

  const currentNightAmount = Math.round(Number(hourlyWageInput) * Number(nightWageInput));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={prevMonth} className="btn btn-outline"><ChevronLeft size={20} /></button>
          <h2 style={{ fontSize: '1.25rem' }}>{format(currentDate, 'yyyy年 M月', { locale: ja })}</h2>
          <button onClick={nextMonth} className="btn btn-outline"><ChevronRight size={20} /></button>
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
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>予想給与</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>
                ¥{monthlySalary.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.875rem' }}>
              <div>
                <div style={{ color: '#666' }}>勤務時間</div>
                <div>{totalHours.toFixed(1)}時間</div>
              </div>
              <div>
                <div style={{ color: '#666' }}>勤務日数</div>
                <div>{currentMonthShifts.length}日</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="card">
        <h3>基本設定</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {/* 基本時給 */}
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>基本時給</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                value={hourlyWageInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setHourlyWageInput(val);
                  updateUserConfig({ hourlyWage: val === '' ? 0 : Number(val) });
                }}
                className="input"
                placeholder="1000"
              />
              <span style={{ alignSelf: 'center', minWidth: '2em' }}>円</span>
            </div>
          </div>

          {/* 深夜手当設定 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                深夜手当 (22:00以降)
              </div>

              {/* スイッチUI */}
              <div style={{
                display: 'flex',
                position: 'relative',
                backgroundColor: '#f3f4f6',
                padding: '4px',
                borderRadius: '9999px',
                border: '1px solid #e5e7eb'
              }}>
                {[
                  { id: 'multiplier', label: '倍率' },
                  { id: 'amount', label: '金額' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setNightWageMode(mode.id as 'multiplier' | 'amount')}
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      fontWeight: nightWageMode === mode.id ? '600' : '400',
                      color: nightWageMode === mode.id ? '#000' : '#666',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      minWidth: '60px',
                      textAlign: 'center'
                    }}
                  >
                    {mode.label}
                    {nightWageMode === mode.id && (
                      <motion.div
                        layoutId="active-switch-bg"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: '#ffffff',
                          borderRadius: '9999px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          zIndex: -1
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {nightWageMode === 'multiplier' ? (
                <>
                  <input
                    type="number"
                    step="0.05"
                    value={nightWageInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNightWageInput(val);
                      updateUserConfig({ nightWageMultiplier: val === '' ? 0 : Number(val) });
                    }}
                    className="input"
                    placeholder="1.25"
                  />
                  <span style={{ alignSelf: 'center', minWidth: '2em' }}>倍</span>
                </>
              ) : (
                <>
                  <input
                    type="number"
                    value={currentNightAmount || ''}
                    onChange={(e) => handleNightAmountChange(e.target.value)}
                    className="input"
                    placeholder="1250"
                  />
                  <span style={{ alignSelf: 'center', minWidth: '2em' }}>円</span>
                </>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem', textAlign: 'right' }}>
              {nightWageMode === 'multiplier'
                ? `(時給換算: ¥${currentNightAmount.toLocaleString()})`
                : `(倍率換算: ${Number(nightWageInput).toFixed(2)}倍)`
              }
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3>バイト先管理</h3>
          <button onClick={() => {
            if (isJobFormOpen) resetJobForm();
            else setIsJobFormOpen(true);
          }} className="btn btn-outline" style={{ padding: '0.25rem' }}>
            {isJobFormOpen ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {isJobFormOpen && (
          <div style={{ padding: '1rem', backgroundColor: 'hsl(var(--background))', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '1px solid hsl(var(--border))' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem' }}>名称</label>
              <input className="input" style={{ width: '100%' }} value={newJobName} onChange={e => setNewJobName(e.target.value)} placeholder="例: カフェ" />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem' }}>時給</label>
              <input className="input" type="number" style={{ width: '100%' }} value={newJobWage} onChange={e => setNewJobWage(e.target.value)} />
            </div>
            
            {/* 給料日・締め日入力欄 (修正: どちらもinputに統一して完全に同じデザインにする) */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem' }}>給料日 (日)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="31"
                  style={{ width: '100%' }}
                  value={newJobPayDay}
                  onChange={e => setNewJobPayDay(e.target.value)}
                  placeholder="25"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem' }}>締め日 (日)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="31"
                  style={{ width: '100%' }}
                  value={newJobClosingDate}
                  onChange={e => setNewJobClosingDate(e.target.value)}
                  placeholder="31 (末日)"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem' }}>カラー</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewJobColor(c)}
                    style={{
                      width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c,
                      border: newJobColor === c ? '2px solid black' : '2px solid transparent', cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={resetJobForm} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>キャンセル</button>
              <button onClick={handleAddJob} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                {editingJobId ? '更新' : '追加'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {jobs.map(job => (
            <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: job.color }}></div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{job.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#666', flexWrap: 'wrap' }}>
                    <span>¥{job.hourlyWage.toLocaleString()} / h</span>
                    {job.payDay && <span>給料: {job.payDay}日</span>}
                    {job.closingDate && <span>(締: {job.closingDate === 31 ? '末' : job.closingDate}日)</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button onClick={() => handleEditJob(job)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => deleteJob(job.id)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && <div style={{ fontSize: '0.875rem', color: '#666' }}>バイト先が登録されていません。デフォルト時給が使用されます。</div>}
        </div>
      </div>

      <div className="card">
        <h3>シフト詳細</h3>
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
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}
          >
            {currentMonthShifts.map(shift => {
              const job = jobs.find(j => j.id === shift.jobId);
              return (
                <div key={shift.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {format(new Date(shift.date), 'M/d (E)', { locale: ja })}
                      {job && <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: job.color, color: '#fff' }}>{job.name}</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{shift.startTime} - {shift.endTime}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>¥{calculateShiftSalary(shift, userConfig.nightWageMultiplier).toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{calculateDuration(shift.startTime, shift.endTime, shift.breakTime).toFixed(1)}h</div>
                  </div>
                </div>
              );
            })}
            {currentMonthShifts.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>シフトがありません</div>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}