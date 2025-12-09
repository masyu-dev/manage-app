'use client';

import React, { useState } from 'react';
import Calendar from '@/components/Calendar';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import SettingsModal from '@/components/SettingsModal';
import SalaryView from '@/components/SalaryView';
import BudgetView from '@/components/BudgetView';
import SummaryView from '@/components/SummaryView';

export default function Home() {
  const [activeTab, setActiveTab] = useState('shift');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <main style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', minHeight: '100vh' }}>
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      <div className="container">
        {activeTab === 'shift' && (
          <div>
            <Calendar />
          </div>
        )}

        {activeTab === 'salary' && (
          <SalaryView />
        )}

        {activeTab === 'budget' && (
          <BudgetView />
        )}

        {activeTab === 'summary' && (
          <SummaryView />
        )}
      </div>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </main>
  );
}
