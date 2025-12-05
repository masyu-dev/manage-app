'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { calculateMonthlySalary } from '@/lib/calculations';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import TransactionForm from './TransactionForm';
import BudgetCalendar from './BudgetCalendar';


export default function BudgetView() {
  const { transactions, tags, deleteTransaction, userConfig, shifts } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  // Calculate Estimated Salary
  const payDay = userConfig.payDay || 25;
  const payDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), Math.min(payDay, endOfMonth(currentDate).getDate()));

  // Salary is for the previous month
  const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const estimatedSalary = calculateMonthlySalary(shifts, prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1);

  const salaryTransaction = {
    id: 'salary-schedule',
    date: payDate.toISOString().split('T')[0],
    amount: estimatedSalary,
    type: 'income' as const,
    tagId: 'salary', // Virtual tag
    description: '給与予定',
    isVirtual: true,
  };

  const rawTransactions = transactions.filter(t =>
    isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
  );

  // Add salary to transactions if it's within the current view month (which it always is by definition of payDate)
  // But only if there isn't already a manual "Salary" entry on that day to avoid duplication if user manually added it?
  // For now, let's just show it as "Scheduled".
  const currentMonthTransactions = [...rawTransactions, salaryTransaction].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const income = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;

  // Chart Data Preparation
  const expenseTags = tags.filter(t => t.type === 'expense');
  const expenseByTag = expenseTags.map(tag => {
    const total = currentMonthTransactions
      .filter(t => t.tagId === tag.id && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { tag, total };
  }).filter(item => item.total > 0);

  const chartData = {
    labels: expenseByTag.map(item => item.tag.name),
    datasets: [
      {
        data: expenseByTag.map(item => item.total),
        backgroundColor: expenseByTag.map(item => item.tag.color),
        borderWidth: 1,
      },
    ],
  };

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

        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>収入</div>
            <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>+¥{income.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>支出</div>
            <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>-¥{expense.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>収支</div>
            <div style={{ fontWeight: 'bold' }}>
              {balance > 0 ? '+' : ''}¥{balance.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', height: '200px', display: 'flex', justifyContent: 'center' }}>
          {expenseByTag.length > 0 ? (
            <Pie data={chartData} options={{ maintainAspectRatio: false }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', color: '#999' }}>データがありません</div>
          )}
        </div>
      </div>

      <BudgetCalendar />

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>履歴</h3>
          <button onClick={() => setIsFormOpen(true)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }}>
            <Plus size={16} style={{ marginRight: '0.25rem' }} /> 追加
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {currentMonthTransactions.map(t => {
            const isVirtual = (t as any).isVirtual;
            const tag = tags.find(tag => tag.id === t.tagId);
            return (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid hsl(var(--border))', opacity: isVirtual ? 0.7 : 1, backgroundColor: isVirtual ? 'hsl(var(--background))' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: isVirtual ? 'gold' : (tag?.color || '#ccc')
                  }}></div>
                  <div>
                    <div style={{ fontSize: '0.875rem' }}>{isVirtual ? '給与(予定)' : (tag?.name || '不明')}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{format(new Date(t.date), 'M/d')} {t.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    fontWeight: 'bold',
                    color: t.type === 'income' ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {t.type === 'income' ? '+' : '-'}¥{t.amount.toLocaleString()}
                  </div>
                  {!isVirtual && (
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {currentMonthTransactions.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>履歴がありません</div>}
        </div>
      </div>

      {isFormOpen && <TransactionForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}
