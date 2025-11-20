'use client';

import React, { useState } from 'react';
import Calendar from '@/components/Calendar';
import Navigation from '@/components/Navigation';

export default function Home() {
  const [activeTab, setActiveTab] = useState('shift');

  return (
    <main style={{ paddingBottom: '80px', minHeight: '100vh' }}>
      <div className="container">
        <h1 style={{ margin: '1rem 0', fontSize: '1.5rem' }}>マニージ</h1>

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
    </main>
  );
}
import SalaryView from '@/components/SalaryView';
import BudgetView from '@/components/BudgetView';
import SummaryView from '@/components/SummaryView';
