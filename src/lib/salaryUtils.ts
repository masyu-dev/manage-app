import { Shift, Job } from '@/types';
import { calculateShiftSalary } from './calculations';
import { startOfDay, endOfDay, isBefore, isAfter, addMonths, subMonths, setDate, getDate, getMonth, getYear, setMonth } from 'date-fns';

export interface SalaryResult {
    periodString: string;
    workDays: number;
    totalHours: number;
    basePay: number;
    nightPay: number;
    totalPay: number;
}

/**
 * Calculate the pay period for a given pay date and closing date.
 */
export function calculatePayPeriod(payDate: Date, closingDay: number): { start: Date, end: Date } {
    // Convert payDate to purely YYYY-MM-DD logic
    const y = getYear(payDate);
    const m = getMonth(payDate);
    const d = getDate(payDate);

    // Determine the END date of the period (The closing date that triggered this payment)
    let endDate: Date;

    if (d > closingDay) {
        // If PayDay is AFTER the ClosingDay in the same month, 
        // it pays for the period ending in THIS month.
        // e.g. Pay 25th, Close 15th. Pay Jan 25 pays for period ending Jan 15.
        endDate = new Date(y, m, closingDay);
    } else {
        // If PayDay is BEFORE or ON the ClosingDay, 
        // it pays for the period ending in the PREVIOUS month.
        // e.g. Pay 10th, Close 25th. Pay Feb 10 pays for period ending Jan 25.
        // e.g. Pay 25th, Close 25th? Usually same month pay is rare on same day processing,
        // but if Pay <= Close, strict "Previous Month" logic applies usually.
        // Example: Pay 25, Close 25. If today is Jan 25, do I get paid for Dec 26-Jan 25 immediately?
        // Unlikely. Usually "Next Month Payment".
        // But let's assume if d <= closingDay, it's previous month.
        endDate = new Date(y, m - 1, closingDay);
    }

    // Handle month rollover issues (e.g. Feb 30 -> Mar 1/2) behavior of JS Date
    // We want strictly the closing day.
    // If closingDay is 31 and month has 30 days, we should probably cap it to 30.
    const checkDate = new Date(endDate);
    if (checkDate.getDate() !== closingDay) {
        // It rolled over. Set to last day of previous month(which is the intended month).
        // Actually new Date(y, m, 0) is last day of prev month.
        // Let's re-construct carefully.
        const targetMonth = d > closingDay ? m : m - 1;
        const daysInTargetMonth = new Date(y, targetMonth + 1, 0).getDate();
        const actualClosingDay = Math.min(closingDay, daysInTargetMonth);
        endDate = new Date(y, targetMonth, actualClosingDay);
    }

    // Start Date is (End Date - 1 Month) + 1 Day
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(startDate.getDate() + 1);

    // Fix start date rollover logic too if needed, but adding 1 day usually fine unless...
    // Wait. If Close Jan 15. Start Dec 16.
    // If Close Mar 31. Start Feb 29/28 + 1 -> Mar 1? No.
    // Period means "Previous Closing Day + 1".
    // Previous Closing Day for Mar 31 is Feb 28/29. So Start is Mar 1. Correct.

    return {
        start: startOfDay(startDate),
        end: endOfDay(endDate)
    };
}

export function calculatePeriodSalary(
    shifts: Shift[],
    start: Date,
    end: Date,
    jobId: string,
    nightWageMultiplier: number
): SalaryResult {

    const targetShifts = shifts.filter(s => {
        if (s.jobId !== jobId) return false;
        const sDate = new Date(s.date);
        return sDate >= start && sDate <= end;
    });

    let totalBasePay = 0;
    let totalNightAllowance = 0;
    let totalMinutes = 0;

    targetShifts.forEach(shift => {
        const hourlyWage = shift.hourlyWage;

        // Parse time
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);

        let startMin = startH * 60 + startM;
        let endMin = endH * 60 + endM;
        if (endMin < startMin) endMin += 24 * 60; // Overnight

        let duration = endMin - startMin; // Raw duration

        // Calculate Night Minutes (22:00 - 05:00)
        // 22:00 = 1320, 05:00 (next day) = 29:00 = 1740 or 05:00 = 300
        // Windows: 0-300 (00:00-05:00), 1320-1740 (22:00-29:00)
        const getOverlap = (s: number, e: number, ws: number, we: number) =>
            Math.max(0, Math.min(e, we) - Math.max(s, ws));

        let nightMinutes =
            getOverlap(startMin, endMin, 0, 300) +
            getOverlap(startMin, endMin, 1320, 1740) +
            getOverlap(startMin, endMin, 2760, 3180); // 46:00-53:00 just in case

        // Break Time Adjustment
        // If break exists, we distribute it proportionally or just subtract from total?
        // Standard varies. Simple approach from `calculations.ts`: Proportional.
        if (duration > 0 && shift.breakTime > 0) {
            const nightRatio = nightMinutes / duration;
            nightMinutes = Math.max(0, nightMinutes - (shift.breakTime * nightRatio));
            duration -= shift.breakTime; // Net work time
        }

        if (duration <= 0) return;

        const netNightHours = nightMinutes / 60;
        const netTotalHours = duration / 60;
        // const netBaseHours = netTotalHours - netNightHours; // Not needed for calculation if base is total * wage

        // Base Pay = All Work Hours * Hourly Wage
        const basePay = netTotalHours * hourlyWage;

        // Night Allowance = Night Hours * Hourly Wage * (Multiplier - 1)
        // e.g. Multiplier 1.25 -> Pay 0.25 extra
        const nightAllowance = netNightHours * hourlyWage * (nightWageMultiplier - 1);

        totalBasePay += basePay;
        totalNightAllowance += nightAllowance;
        totalMinutes += duration;
    });

    return {
        periodString: `${start.getMonth() + 1}/${start.getDate()} 〜 ${end.getMonth() + 1}/${end.getDate()}`,
        workDays: targetShifts.length,
        totalHours: totalMinutes / 60, // Keep decimal for now, allow UI to format
        basePay: Math.floor(totalBasePay),
        nightPay: Math.floor(totalNightAllowance),
        totalPay: Math.floor(totalBasePay + totalNightAllowance)
    };
}
