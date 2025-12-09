'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { calculateMonthlySalary, calculateShiftSalary, calculateDuration } from '@/lib/calculations';
import { format, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
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
  const { shifts, userConfig, updateUserConfig, jobs, addJob, deleteJob } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [[page, direction], setPage] = useState([0, 0]);

  // Job Management State
  const [newJobName, setNewJobName] = useState('');
  const [newJobWage, setNewJobWage] = useState(userConfig.hourlyWage.toString());
  const [newJobColor, setNewJobColor] = useState(COLORS[0]);
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);

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
      addJob({
        id: crypto.randomUUID(),
        name: newJobName,
        hourlyWage: Number(newJobWage),
        color: newJobColor,
      });
      setNewJobName('');
      setNewJobWage(userConfig.hourlyWage.toString());
      setIsJobFormOpen(false);
    }
  };

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
            transition={{ opacity: { duration: 0.2 } }}
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
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>基本時給</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                value={userConfig.hourlyWage}
                onChange={(e) => updateUserConfig({ hourlyWage: Number(e.target.value) })}
                className="input"
              />
              <span style={{ alignSelf: 'center' }}>円</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              深夜手当倍率 (22:00以降)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                step="0.05"
                value={userConfig.nightWageMultiplier || 1.25}
                onChange={(e) => updateUserConfig({ nightWageMultiplier: Number(e.target.value) })}
                className="input"
              />
              <span style={{ alignSelf: 'center' }}>倍</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3>バイト先管理</h3>
          <button onClick={() => setIsJobFormOpen(!isJobFormOpen)} className="btn btn-outline" style={{ padding: '0.25rem' }}>
            <Plus size={16} />
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
              <button onClick={() => setIsJobFormOpen(false)} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>キャンセル</button>
              <button onClick={handleAddJob} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>追加</button>
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
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>¥{job.hourlyWage.toLocaleString()} / h</div>
                </div>
              </div>
              <button onClick={() => deleteJob(job.id)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}><Trash2 size={16} /></button>
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
            transition={{ opacity: { duration: 0.2 } }}
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
