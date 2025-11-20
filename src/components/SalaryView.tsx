'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { calculateMonthlySalary, calculateShiftSalary, calculateDuration } from '@/lib/calculations';
import { format, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function SalaryView() {
  const { shifts, userConfig, updateUserConfig } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const monthlySalary = calculateMonthlySalary(shifts, year, month);

  const currentMonthShifts = shifts.filter(shift => {
    const date = new Date(shift.date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalHours = currentMonthShifts.reduce((acc, shift) => {
    return acc + calculateDuration(shift.startTime, shift.endTime, shift.breakTime);
  }, 0);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={prevMonth} className="btn btn-outline"><ChevronLeft size={20} /></button>
          <h2 style={{ fontSize: '1.25rem' }}>{format(currentDate, 'yyyy年 M月', { locale: ja })}</h2>
          <button onClick={nextMonth} className="btn btn-outline"><ChevronRight size={20} /></button>
        </div>

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
      </div>

      <div className="card">
        <h3>時給設定</h3>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <input
            type="number"
            value={userConfig.hourlyWage}
            onChange={(e) => updateUserConfig({ hourlyWage: Number(e.target.value) })}
            className="input"
          />
          <span style={{ alignSelf: 'center' }}>円</span>
        </div>
      </div>

      <div className="card">
        <h3>シフト詳細</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {currentMonthShifts.map(shift => (
            <div key={shift.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
              <div>
                <div>{format(new Date(shift.date), 'M/d (E)', { locale: ja })}</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>{shift.startTime} - {shift.endTime}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>¥{calculateShiftSalary(shift).toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>{calculateDuration(shift.startTime, shift.endTime, shift.breakTime).toFixed(1)}h</div>
              </div>
            </div>
          ))}
          {currentMonthShifts.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>シフトがありません</div>}
        </div>
      </div>
    </div>
  );
}
