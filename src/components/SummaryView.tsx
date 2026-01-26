'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { calculateMonthlySalary } from '@/lib/calculations';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
// ▼▼▼ 修正: 未使用の Chart.js 関連インポートを削除しました ▼▼▼
import BudgetSettings from '@/components/BudgetSettings';

export default function SummaryView() {
  // jobs を追加で取得
  const { shifts, transactions, userConfig, jobs } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  // calculateMonthlySalary に必要な引数 (jobs, defaultWage, nightMultiplier) を渡す
  const monthlySalary = calculateMonthlySalary(
    shifts,
    jobs,
    year,
    month,
    userConfig.hourlyWage,
    userConfig.nightWageMultiplier
  );

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
  const monthlySavings = Math.max(0, balance);

  // 累積貯金(全期間)
  const totalIncomeAllTime = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseAllTime = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = Math.max(0, totalIncomeAllTime - totalExpenseAllTime);

  // 最終目標に対する達成率
  const savingsProgress = userConfig.savingsGoal > 0
      ? Math.min((totalSavings / userConfig.savingsGoal) * 100, 100)
      : 0;

  const savingsColor = savingsProgress >= 100
    ? 'var(--success)'
    : savingsProgress >= 50
    ? 'var(--primary)'
    : 'var(--warning)';

  // Budget Progress
  const budgetProgress = userConfig.monthlyBudget > 0 
    ? Math.min((totalExpense / userConfig.monthlyBudget) * 100, 100) 
    : 0;
    
  const budgetColor = budgetProgress > 90
    ? 'hsl(var(--danger))'
    : budgetProgress > 75
    ? 'hsl(var(--warning))'
    : 'hsl(var(--success))';

  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* ===== 上段：月別サマリー ===== */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={prevMonth} className="btn btn-outline">
            <ChevronLeft size={20} />
          </button>
          <h2 style={{ fontSize: '1.25rem' }}>
            {format(currentDate, 'yyyy年 M月', { locale: ja })}
          </h2>
          <button onClick={nextMonth} className="btn btn-outline">
            <ChevronRight size={20} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>今月の収支</div>
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: balance >= 0 ? 'var(--primary)' : 'var(--danger)',
            }}
          >
            {balance >= 0 ? '+' : ''}¥{balance.toLocaleString()}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card" style={{ backgroundColor: 'hsl(var(--background))', padding: '1rem', border: 'none' }}>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>総収入</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
              ¥{totalIncome.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999' }}>
              (給与: ¥{monthlySalary.toLocaleString()})
            </div>
          </div>

          <div className="card" style={{ backgroundColor: 'hsl(var(--background))', padding: '1rem', border: 'none' }}>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>総支出</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--danger)' }}>
              ¥{totalExpense.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* ===== 予算管理 ===== */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>予算管理</h3>
          <button className="btn btn-outline" onClick={() => setIsSettingsOpen(prev => !prev)}>
            <Settings size={16} />
          </button>
        </div>

        {!isSettingsOpen && (
          <div style={{ marginTop: '0.5rem' }}>
            {/* 予算バー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>予算消化率</span>
              <span>{Math.round(budgetProgress)}%</span>
            </div>
            <div style={{ height: '10px', backgroundColor: 'hsl(var(--background))', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${budgetProgress}%`, height: '100%', backgroundColor: budgetColor, transition: 'width 0.5s' }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
              残り: ¥{Math.max(0, userConfig.monthlyBudget - totalExpense).toLocaleString()}
            </div>

            {/* 貯金バー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '1rem', marginBottom: '0.25rem' }}>
              <span>貯金目標達成率</span>
              <span>{Math.round(savingsProgress)}%</span>
            </div>
            <div style={{ height: '10px', backgroundColor: 'hsl(var(--background))', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${savingsProgress}%`, height: '100%', backgroundColor: `hsl(${savingsColor})`, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>今月の貯金 ¥{monthlySavings.toLocaleString()}</span>
              <span>目標: ¥{userConfig.savingsGoal.toLocaleString()}</span>
            </div>
          </div>
        )}

        {isSettingsOpen && (
          <BudgetSettings onClose={() => setIsSettingsOpen(false)} />
        )}
      </div>
    </div>
  );
}