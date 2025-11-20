'use client';

import React from 'react';
import { Calendar, DollarSign, PieChart, LayoutDashboard } from 'lucide-react';
import styles from './Navigation.module.css';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'shift', label: 'シフト', icon: Calendar },
    { id: 'salary', label: '給与', icon: DollarSign },
    { id: 'budget', label: '家計簿', icon: PieChart },
    { id: 'summary', label: '概要', icon: LayoutDashboard },
  ];

  return (
    <nav className={styles.nav}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={24} />
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
