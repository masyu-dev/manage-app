'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { X, Moon, Sun } from 'lucide-react';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  onClose: () => void;
}

const THEME_COLORS = [
  { id: 'blue', name: 'ブルー', color: '210 100% 45%' },
  { id: 'purple', name: 'パープル', color: '262 80% 45%' },
  { id: 'orange', name: 'オレンジ', color: '34 100% 45%' },
  { id: 'green', name: 'グリーン', color: '142 76% 36%' },
  { id: 'red', name: 'レッド', color: '0 72% 51%' },
];

// ... (existing imports)

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { userConfig, updateUserConfig, shifts } = useApp();

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>設定</h3>
          <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h4>カラーモード</h4>
            {/* ... existing color mode toggle ... */}
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeButton} ${userConfig.themeMode === 'light' ? styles.active : ''}`}
                onClick={() => updateUserConfig({ themeMode: 'light' })}
              >
                <Sun size={20} /> ライト
              </button>
              <button
                className={`${styles.modeButton} ${userConfig.themeMode === 'dark' ? styles.active : ''}`}
                onClick={() => updateUserConfig({ themeMode: 'dark' })}
              >
                <Moon size={20} /> ダーク
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <h4>テーマカラー</h4>
            <div className={styles.colorGrid}>
              {THEME_COLORS.map(theme => (
                <button
                  key={theme.id}
                  className={`${styles.colorButton} ${userConfig.themeColor === theme.id ? styles.activeColor : ''}`}
                  style={{ backgroundColor: `hsl(${theme.color})` }}
                  onClick={() => updateUserConfig({ themeColor: theme.id })}
                  aria-label={theme.name}
                />
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h4>その他の設定</h4>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              時給や予算の設定は「概要」タブから変更できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
