export type TransactionType = 'income' | 'expense';

export interface Tag {
  id: string;
  name: string;
  color: string; // hex or css var
  type: TransactionType;
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
}

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakTime: number; // minutes
  hourlyWage: number; // Snapshot of wage at that time
}

export interface UserConfig {
  hourlyWage: number;
  monthlyBudget: number;
  savingsGoal: number;
}

export interface AppData {
  shifts: Shift[];
  transactions: Transaction[];
  tags: Tag[];
  shiftProfiles: ShiftProfile[];
  userConfig: UserConfig;
}
