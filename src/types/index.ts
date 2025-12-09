export type TransactionType = 'income' | 'expense';

export interface Tag {
  id: string;
  name: string;
  color: string; // hex or css var
  type: TransactionType;
}

export interface Job {
  id: string;
  name: string;
  hourlyWage: number;
  color: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  amount: number;
  type: TransactionType;
  tagId: string;
  description?: string;
}

export interface ShiftProfile {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakTime: number; // minutes
  jobId?: string;
}

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakTime: number; // minutes
  hourlyWage: number; // Snapshot of wage at that time
  jobId?: string;
}

export interface UserConfig {
  hourlyWage: number; // Default fallback wage
  monthlyBudget: number;
  savingsGoal: number;
  payDay: number; // Day of month (1-31)
  themeMode: 'light' | 'dark';
  themeColor: string; // 'blue', 'purple', 'orange', etc.
  nightWageMultiplier: number; // Default 1.25
}

export interface AppData {
  shifts: Shift[];
  transactions: Transaction[];
  tags: Tag[];
  jobs: Job[];
  shiftProfiles: ShiftProfile[];
  userConfig: UserConfig;
}
