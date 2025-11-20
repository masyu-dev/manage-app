'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { calculateMonthlySalary } from '@/lib/calculations';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SummaryView() {
  const { shifts, transactions, userConfig, updateUserConfig } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  const monthlySalary = calculateMonthlySalary(shifts, year, month);

  const currentMonthTransactions = transactions.filter(t =>
    isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
  );

  const otherIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = monthlySalary + otherIncome;

  const totalExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  // Budget Progress
  const budgetProgress = Math.min((totalExpense / userConfig.monthlyBudget) * 100, 100);
  const budgetColor = budgetProgress > 90 ? 'var(--danger)' : budgetProgress > 75 ? 'var(--warning)' : 'var(--success)';

  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={prevMonth} className="btn btn-outline"><ChevronLeft size={20} /></button>
          <h2 style={{ fontSize: '1.25rem' }}>{format(currentDate, 'yyyy年 M月', { locale: ja })}</h2>
          <button onClick={nextMonth} className="btn btn-outline"><ChevronRight size={20} /></button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>今月の収支</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: balance >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
            {balance >= 0 ? '+' : ''}¥{balance.toLocaleString()}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card" style={{ backgroundColor: 'hsl(var(--background))', padding: '1rem', border: 'none' }}>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>総収入</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>¥{totalIncome.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#999' }}>(給与: ¥{monthlySalary.toLocaleString()})</div>
          </div>
          <div className="card" style={{ backgroundColor: 'hsl(var(--background))', padding: '1rem', border: 'none' }}>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>総支出</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--danger)' }}>¥{totalExpense.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>予算管理</h3>
          <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="btn btn-outline" style={{ padding: '0.25rem' }}>
            <Settings size={16} />
          </button>
        </div>

        {isSettingsOpen && (
          <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'hsl(var(--background))', borderRadius: 'var(--radius)' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>月間予算目標</label>
              <input
                type="number"
                value={userConfig.monthlyBudget}
                onChange={(e) => updateUserConfig({ monthlyBudget: Number(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>貯金目標総額</label>
              <input
                type="number"
                value={userConfig.savingsGoal}
                onChange={(e) => updateUserConfig({ savingsGoal: Number(e.target.value) })}
                className="input"
              />
            </div>
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            <span>予算消化率</span>
            <span>{Math.round(budgetProgress)}%</span>
          </div>
          <div style={{ height: '10px', backgroundColor: 'hsl(var(--background))', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${budgetProgress}%`, height: '100%', backgroundColor: budgetColor, transition: 'width 0.5s' }}></div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            残り: ¥{Math.max(0, userConfig.monthlyBudget - totalExpense).toLocaleString()}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            <span>貯金目標達成率 (今月の貯金: ¥{Math.max(0, balance).toLocaleString()})</span>
          </div>
          {/* Ideally this would track total savings over time, but for now we just show current month contribution context */}
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            目標: ¥{userConfig.savingsGoal.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
