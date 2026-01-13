'use client';

import React, { useState } from 'react'; // フォームの入力内容を管理するために必要
import { useApp } from '@/lib/store';


type Props = {
  onClose: () => void;
};

export default function BudgetSettings({ onClose }: Props) {
  const { userConfig, updateUserConfig, tags } = useApp();

  

  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: 'hsl(var(--background))',
        borderRadius: 'var(--radius)',
      }}
    >
      <div style={{ marginBottom: '0.75rem' }}>
        <label>月間予算目標</label>
        <input
          type="number"
          className="input"
          value={userConfig.monthlyBudget}
          onChange={(e) =>
            updateUserConfig({ monthlyBudget: Number(e.target.value) })
          }
        />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label>貯金目標総額</label>
        <input
          type="number"
          className="input"
          value={userConfig.savingsGoal}
          onChange={(e) =>
            updateUserConfig({ savingsGoal: Number(e.target.value) })
          }
        />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label>給料日（日）</label>
        <input
          type="number"
          className="input"
          min={1}
          max={31}
          value={userConfig.payDay}
          onChange={(e) =>
            updateUserConfig({ payDay: Number(e.target.value) })
          }
        />
      </div>

      <button className="btn btn-outline" onClick={onClose}>
        閉じる
      </button>
    </div>
  );
}
