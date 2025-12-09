'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData, Shift, ShiftProfile, Tag, Job, Transaction, UserConfig } from '@/types';

interface AppContextType extends AppData {
  addShift: (shift: Shift) => void;
  updateShift: (shift: Shift) => void;
  deleteShift: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateUserConfig: (config: Partial<UserConfig>) => void;
  addShiftProfile: (profile: ShiftProfile) => void;
  addJob: (job: Job) => void;
  updateJob: (job: Job) => void;
  deleteJob: (id: string) => void;
  addTag: (tag: Tag) => void;
  updateTag: (tag: Tag) => void;
  deleteTag: (id: string) => void;
}

const defaultAppData: AppData = {
  shifts: [],
  transactions: [],
  tags: [
    { id: '1', name: '食費', color: '#ff6b6b', type: 'expense' },
    { id: '2', name: '交通費', color: '#4ecdc4', type: 'expense' },
    { id: '3', name: '給料', color: '#ffe66d', type: 'income' },
  ],
  jobs: [],
  shiftProfiles: [],
  userConfig: {
    hourlyWage: 1000,
    monthlyBudget: 50000,
    savingsGoal: 100000,
    payDay: 25,
    themeMode: 'light',
    themeColor: 'blue',
    nightWageMultiplier: 1.25,
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(defaultAppData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('manage-app-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Ensure new fields exist
        if (!parsed.jobs) parsed.jobs = [];
        if (!parsed.userConfig.nightWageMultiplier) parsed.userConfig.nightWageMultiplier = 1.25;
        // Ensure existing tags are preserved if any, otherwise use default
        if (!parsed.tags || parsed.tags.length === 0) parsed.tags = defaultAppData.tags;

        setData(parsed);
      } catch (e) {
        console.error('Failed to load data', e);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem('manage-app-data', JSON.stringify(data));
    }
  }, [data, loaded]);

  // Apply theme
  useEffect(() => {
    if (loaded) {
      document.documentElement.setAttribute('data-theme', data.userConfig.themeMode);
      document.documentElement.setAttribute('data-color', data.userConfig.themeColor);
    }
  }, [data.userConfig.themeMode, data.userConfig.themeColor, loaded]);

  const addShift = (shift: Shift) => {
    setData(prev => ({ ...prev, shifts: [...prev.shifts, shift] }));
  };

  const updateShift = (updatedShift: Shift) => {
    setData(prev => ({
      ...prev,
      shifts: prev.shifts.map(s => s.id === updatedShift.id ? updatedShift : s)
    }));
  };

  const deleteShift = (id: string) => {
    setData(prev => ({
      ...prev,
      shifts: prev.shifts.filter(s => s.id !== id)
    }));
  };

  const addTransaction = (transaction: Transaction) => {
    setData(prev => ({ ...prev, transactions: [...prev.transactions, transaction] }));
  };

  const deleteTransaction = (id: string) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  const updateUserConfig = (config: Partial<UserConfig>) => {
    setData(prev => ({ ...prev, userConfig: { ...prev.userConfig, ...config } }));
  };

  const addShiftProfile = (profile: ShiftProfile) => {
    setData(prev => ({ ...prev, shiftProfiles: [...prev.shiftProfiles, profile] }));
  };

  const addJob = (job: Job) => {
    setData(prev => ({ ...prev, jobs: [...prev.jobs, job] }));
  };

  const updateJob = (updatedJob: Job) => {
    setData(prev => ({
      ...prev,
      jobs: prev.jobs.map(j => j.id === updatedJob.id ? updatedJob : j)
    }));
  };

  const deleteJob = (id: string) => {
    setData(prev => ({
      ...prev,
      jobs: prev.jobs.filter(j => j.id !== id)
    }));
  };

  const addTag = (tag: Tag) => {
    setData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
  };

  const updateTag = (updatedTag: Tag) => {
    setData(prev => ({
      ...prev,
      tags: prev.tags.map(t => t.id === updatedTag.id ? updatedTag : t)
    }));
  };

  const deleteTag = (id: string) => {
    setData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t.id !== id)
    }));
  };

  if (!loaded) return null; // Or a loading spinner

  return (
    <AppContext.Provider value={{
      ...data,
      addShift,
      updateShift,
      deleteShift,
      addTransaction,
      deleteTransaction,
      updateUserConfig,
      addShiftProfile,
      addJob,
      updateJob,
      deleteJob,
      addTag,
      updateTag,
      deleteTag,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
