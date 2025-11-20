import { Shift } from '@/types';

export function calculateDuration(startTime: string, endTime: string, breakTimeMinutes: number): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Handle overnight shifts
  }

  const durationMinutes = endMinutes - startMinutes - breakTimeMinutes;
  return Math.max(0, durationMinutes / 60); // Return hours
}

export function calculateShiftSalary(shift: Shift): number {
  const hours = calculateDuration(shift.startTime, shift.endTime, shift.breakTime);
  return Math.floor(hours * shift.hourlyWage);
}

export function calculateMonthlySalary(shifts: Shift[], year: number, month: number): number {
  return shifts
    .filter(shift => {
      const date = new Date(shift.date);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    })
    .reduce((total, shift) => total + calculateShiftSalary(shift), 0);
}
