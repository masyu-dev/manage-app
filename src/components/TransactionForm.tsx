'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Transaction, TransactionType } from '@/types';
import { X } from 'lucide-react';
import styles from './ShiftForm.module.css'; // Reusing modal styles

interface TransactionFormProps {
  initialDate?: Date;
  onClose: () => void;
}

export default function TransactionForm({ initialDate, onClose }: TransactionFormProps) {
  const { addTransaction, tags } = useApp();

  const [date, setDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [tagId, setTagId] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      date,
      amount: Number(amount),
      type,
      tagId: tagId || tags.find(t => t.type === type)?.id || '',
      description,
    };

    addTransaction(transaction);
    onClose();
  };

  const filteredTags = tags.filter(t => t.type === type);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>{type === 'income' ? '収入' : '支出'}を追加</h3>
          <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', marginBottom: '1rem', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn ${type === 'expense' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setType('expense')}
            style={{ flex: 1 }}
          >
            支出
          </button>
          <button
            type="button"
            className={`btn ${type === 'income' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setType('income')}
            style={{ flex: 1 }}
          >
            収入
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="input"
            />
          </div>

          <div className={styles.formGroup}>
            <label>金額</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              placeholder="0"
              className="input"
            />
          </div>

          <div className={styles.formGroup}>
            <label>カテゴリー</label>
            <select
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              className="input"
              required
            >
              <option value="" disabled>選択してください</option>
              {filteredTags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>メモ (任意)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
            />
          </div>

          <div className={styles.actions}>
            <div style={{ flex: 1 }}></div>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ marginRight: '0.5rem' }}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
