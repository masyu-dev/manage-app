'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { calculateMonthlySalary } from '@/lib/calculations';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import TransactionForm from './TransactionForm';
import BudgetCalendar from './BudgetCalendar';
import { motion, AnimatePresence } from 'framer-motion';

const TAG_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#1a535c', '#ff9f1c', '#2ec4b6', '#e71d36', '#d62828', '#003049', '#f77f00', '#fcbf49'];

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

export default function BudgetView() {
const { 
    transactions, 
    tags, 
    addTag, 
    deleteTag, 
    deleteTransaction, 
    userConfig, 
    shifts, 
    addTransaction,   // feature-HAC_Subsc で必要
    updateUserConfig, // feature-HAC_Subsc で必要
    jobs              // main で必要
  } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [[page, direction], setPage] = useState([0, 0]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // --- 39行目 〜 67行目を以下に書き換え ---
  useEffect(() => {
    if (!userConfig.fixedCosts?.length) return;

    // 現在表示されている月の「年-月」 (例: "2024-05")
    const monthStr = format(currentDate, 'yyyy-MM');

    userConfig.fixedCosts.forEach(cost => {
      const fixedDescription = `${cost.name} (固定費)`;

      // 重複チェック：今月の履歴に「同じ説明文」のデータがあるか判定
      const isAlreadyAdded = transactions.some(t => 
        t.date.startsWith(monthStr) && t.description === fixedDescription
      );

      if (!isAlreadyAdded) {
        const dayStr = String(cost.day).padStart(2, '0');
        addTransaction({
          id: crypto.randomUUID(),
          date: `${monthStr}-${dayStr}`,
          amount: cost.amount,
          type: 'expense',
          tagId: cost.tagId,
          description: fixedDescription,
        });
      }
    });
    // 重要な修正：transactions そのものではなく .length を監視することでループを防ぎます
  }, [currentDate, userConfig.fixedCosts, transactions.length]);

  // Tag Form State
  const [isTagFormOpen, setIsTagFormOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

// --- 固定費設定用のステート ---
  const [isFixedSettingsOpen, setIsFixedSettingsOpen] = useState(false);
  const [newFixedName, setNewFixedName] = useState('');
  const [newFixedAmount, setNewFixedAmount] = useState('');
  const [newFixedDay, setNewFixedDay] = useState('1');
  const [newFixedTagId, setNewFixedTagId] = useState('');

  const handleAddTag = () => {
    if (newTagName) {
      addTag({
        id: crypto.randomUUID(),
        name: newTagName,
        color: newTagColor,
        type: 'expense',
      });
      setNewTagName('');
      setIsTagFormOpen(false);
    }
  };

  const handleDeleteTag = (id: string) => {
    if (confirm('このタグを削除しますか？')) {
      deleteTag(id);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  // Calculate Scheduled Salary per Job
  const scheduledSalaries = jobs.map(job => {
    const payDay = job.payDay || 25; // Default to 25 if not set
    const payDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), Math.min(payDay, endOfMonth(currentDate).getDate()));

    // Logic: Salary for month M is usually paid in month M+1 or M. 
    // Assuming standard "paid next month" for now, or use previous month's shifts.
    // Let's assume the payday in THIS month pays for LAST month's shifts.
    const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

    // Filter shifts for this job in the previous month
    const jobShifts = shifts.filter(s => {
      const d = new Date(s.date);
      return s.jobId === job.id &&
        d.getFullYear() === prevMonthDate.getFullYear() &&
        d.getMonth() === prevMonthDate.getMonth();
    });

    const jobSalary = calculateMonthlySalary(jobShifts, prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, userConfig.nightWageMultiplier); // Assuming this helper works with filtered shifts

    if (jobSalary === 0) return null;

    return {
      id: `salary-${job.id}`,
      date: payDate.toISOString().split('T')[0],
      amount: jobSalary,
      type: 'income' as const,
      tagId: 'salary', // Virtual tag
      description: `給与予定 (${job.name})`,
      isVirtual: true,
      jobColor: job.color, // Helper to color code
    };
  }).filter(Boolean) as any[]; // Type cast for custom props

  // Fallback for default job/shifts without job ID if needed, but we encourage using jobs now.
  // If there are shifts without jobId, we might need a "General" salary entry using global settings?
  // For simplicity, let's assume we proceed with job-based.

  const rawTransactions = transactions.filter(t =>
    isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
  );

  const currentMonthTransactions = [...rawTransactions, ...scheduledSalaries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + (newDirection > 0 ? 1 : -1))));
  };

  const nextMonth = () => paginate(1);
  const prevMonth = () => paginate(-1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card">
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
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>タグ管理</h3>
          <button onClick={() => setIsTagFormOpen(!isTagFormOpen)} className="btn btn-outline" style={{ padding: '0.25rem' }}>
            <Plus size={16} />
          </button>
        </div>

        {isTagFormOpen && (
          <div style={{ padding: '1rem', backgroundColor: 'hsl(var(--background))', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '1px solid hsl(var(--border))' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input className="input" style={{ flex: 1 }} value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="タグ名 (例: 美容)" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {TAG_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewTagColor(c)}
                    style={{
                      width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c,
                      border: newTagColor === c ? '2px solid black' : '2px solid transparent', cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsTagFormOpen(false)} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>キャンセル</button>
              <button onClick={handleAddTag} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>追加</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {tags.filter(t => t.type === 'expense').map(tag => (
            <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', border: '1px solid hsl(var(--border))', borderRadius: '1rem', fontSize: '0.875rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: tag.color }}></div>
              <span>{tag.name}</span>
              {/* Only allow deleting custom tags? For now all expense tags */}
              <button onClick={() => handleDeleteTag(tag.id)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: 0, marginLeft: '4px' }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

{/* --- カレンダーの直前に挿入 --- */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem' }}>固定費の自動入力設定</h3>
          <button onClick={() => setIsFixedSettingsOpen(!isFixedSettingsOpen)} className="btn btn-outline" style={{ padding: '0.25rem' }}>
            <Plus size={16} />
          </button>
        </div>

        {isFixedSettingsOpen && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}>
            {/* 入力フォーム */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input" placeholder="項目名 (例: 家賃)" value={newFixedName} onChange={e => setNewFixedName(e.target.value)} style={{ flex: 2 }} />
                <input className="input" type="number" placeholder="金額" value={newFixedAmount} onChange={e => setNewFixedAmount(e.target.value)} style={{ flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select className="input" value={newFixedDay} onChange={e => setNewFixedDay(e.target.value)} style={{ flex: 1 }}>
                  {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}日</option>)}
                </select>
                <select className="input" value={newFixedTagId} onChange={e => setNewFixedTagId(e.target.value)} style={{ flex: 2 }}>
                  <option value="" disabled>カテゴリ</option>
                  {tags.filter(t => t.type === 'expense').map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => {
                  if (!newFixedName || !newFixedAmount || !newFixedTagId) return;
                  updateUserConfig({ fixedCosts: [...(userConfig.fixedCosts || []), { id: crypto.randomUUID(), name: newFixedName, amount: Number(newFixedAmount), day: Number(newFixedDay), tagId: newFixedTagId }] });
                  setNewFixedName(''); setNewFixedAmount('');
                }}>追加</button>
              </div>
            </div>
            
            {/* 登録済みリスト */}
            <div style={{ borderTop: '1px solid #ddd', paddingTop: '0.5rem' }}>
              {userConfig.fixedCosts?.map(cost => (
                <div 
                  key={cost.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', // 垂直方向の中央揃え
                    fontSize: '0.8rem', 
                    padding: '0.4rem 0', 
                    borderBottom: '1px solid #eee' 
                  }}
                >
                  <span>{cost.day}日: {cost.name} (¥{cost.amount.toLocaleString()})</span>
                  
                  {/* 丸みを帯びた四角い枠の削除ボタン */}
                  <button 
                    onClick={() => updateUserConfig({ fixedCosts: userConfig.fixedCosts.filter(c => c.id !== cost.id) })} 
                    style={{ 
                      color: '#dc2626',                  // 直接的な赤色指定
                      border: '1px solid #dc2626',       // 直接的な赤色指定
                      borderRadius: '6px',
                      padding: '4px 12px',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontFamily: 'inherit',             // フォント継承
                      transition: 'all 0.2s ease'        // ホバーアニメーション用
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';  // ホバー時の背景色
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BudgetCalendar />

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>履歴</h3>
          <button onClick={() => setIsFormOpen(true)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }}>
            <Plus size={16} style={{ marginRight: '0.25rem' }} /> 追加
          </button>
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
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
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
          </motion.div>
        </AnimatePresence>
      </div>

      {isFormOpen && <TransactionForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}
