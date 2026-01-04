'use client';

import React from 'react';
import { Settings, HelpCircle } from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export default function Header({ onOpenSettings, onOpenHelp }: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>マニージ</h1>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={onOpenHelp} className={styles.settingsButton} aria-label="ヘルプ">
          <HelpCircle size={24} />
        </button>
        <button onClick={onOpenSettings} className={styles.settingsButton} aria-label="設定">
          <Settings size={24} />
        </button>
      </div>
    </header>
  );
}
