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

export function calculateShiftSalary(shift: Shift, nightWageMultiplier: number = 1.25): number {
  const [startH, startM] = shift.startTime.split(':').map(Number);
  const [endH, endM] = shift.endTime.split(':').map(Number);

  let startMin = startH * 60 + startM;
  let endMin = endH * 60 + endM;

  if (endMin < startMin) {
    endMin += 24 * 60;
  }

  // Total work minutes
  let totalWorkMinutes = endMin - startMin - shift.breakTime;
  if (totalWorkMinutes <= 0) return 0;

  // Calculate night minutes (22:00 - 05:00 next day)
  // 22:00 = 22 * 60 = 1320
  // 05:00 (next day) = 29 * 60 = 1740
  // We need to check overlap between [startMin, endMin] and [1320, 1740] (and potentially [22:00 previous day, 05:00 current day] if shift starts early morning, but simplified assumption: shift is within 24h window mostly starting day)
  // Simplified logic: Check intersection with 22:00-29:00 window relative to start day.

  const nightStart = 22 * 60; // 22:00
  const nightEnd = 29 * 60;   // 05:00 next day (29:00)

  // Calculate overlap
  const overlapStart = Math.max(startMin, nightStart);
  const overlapEnd = Math.min(endMin, nightEnd);

  let nightMinutes = 0;
  if (overlapStart < overlapEnd) {
    nightMinutes = overlapEnd - overlapStart;
  }

  // Adjust break time from normal/night hours?
  // Simplification: Subtract break time proportionally or from "normal" hours first?
  // Legal standard usually requires break during work. Let's assume break is taken from non-night hours first for user benefit, or just average it.
  // Actually, easiest and safer for now: Ratio of night hours to total duration * break time is deducted from night minutes.

  const totalDurationRaw = endMin - startMin;
  if (totalDurationRaw > 0) {
    const nightRatio = nightMinutes / totalDurationRaw;
    const nightBreak = shift.breakTime * nightRatio;
    nightMinutes -= nightBreak;
  }

  const normalMinutes = totalWorkMinutes - nightMinutes;

  const normalHours = Math.max(0, normalMinutes / 60);
  const nightHours = Math.max(0, nightMinutes / 60);

  const baseWage = shift.hourlyWage;
  const nightWage = baseWage * nightWageMultiplier;

  return Math.floor(normalHours * baseWage + nightHours * nightWage);
}

export function calculateMonthlySalary(shifts: Shift[], year: number, month: number, nightWageMultiplier: number = 1.25): number {
  return shifts
    .filter(shift => {
      const date = new Date(shift.date);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    })
    .reduce((total, shift) => total + calculateShiftSalary(shift, nightWageMultiplier), 0);
}
