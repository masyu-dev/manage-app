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

  // Calculate night minutes (22:00 - 05:00)
  // We check three windows to handle shifts spanning midnight or starting early morning:
  // 1. 00:00 - 05:00 (0 to 300)
  // 2. 22:00 - 29:00 (1320 to 1740)
  // 3. 46:00 - 53:00 (2760 to 3180) - Extra window just in case of very long shifts

  const getOverlap = (start: number, end: number, winStart: number, winEnd: number) => {
    return Math.max(0, Math.min(end, winEnd) - Math.max(start, winStart));
  };

  let nightMinutes = getOverlap(startMin, endMin, 0, 300) +
    getOverlap(startMin, endMin, 1320, 1740) +
    getOverlap(startMin, endMin, 2760, 3180);

  // Adjust break time from normal/night hours proportionally
  const totalDurationRaw = endMin - startMin;
  if (totalDurationRaw > 0 && shift.breakTime > 0) {
    const nightRatio = nightMinutes / totalDurationRaw;
    const nightBreak = shift.breakTime * nightRatio;
    nightMinutes = Math.max(0, nightMinutes - nightBreak);
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
