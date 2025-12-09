'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>マニージ</h1>
      <button onClick={onOpenSettings} className={styles.settingsButton} aria-label="設定">
        <Settings size={24} />
      </button>
    </header>
  );
}
