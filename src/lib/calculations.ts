import { Shift, Job } from '@/types';

/**
 * 時間文字列 (HH:mm) を分単位の数値に変換
 */
export const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * 勤務時間（休憩除く）を計算して時間単位（1.5hなど）で返す
 */
export const calculateDuration = (startTime: string, endTime: string, breakTime: number = 0): number => {
  let start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);

  // 日またぎ対応
  if (end < start) end += 1440;

  const durationMin = end - start;
  const effectiveDuration = Math.max(0, durationMin - breakTime);

  return effectiveDuration / 60;
};

/**
 * 1つのシフトの給与を計算（深夜手当対応）
 * 引数に jobs と defaultWage を追加して、常に最新の時給を参照できるようにしています
 */
export const calculateShiftSalary = (
  shift: Shift, 
  jobs: Job[], 
  defaultWage: number, 
  nightMultiplier: number
): number => {
  // 1. 時給の特定: 
  // Job設定の時給 > シフトに保存された時給 > デフォルト時給 の優先順位
  const job = jobs.find(j => j.id === shift.jobId);
  const hourlyWage = job ? job.hourlyWage : (shift.hourlyWage || defaultWage);

  // 2. 時間の計算（分単位）
  let startMin = timeToMinutes(shift.startTime);
  let endMin = timeToMinutes(shift.endTime);
  
  if (endMin < startMin) endMin += 1440; // 日またぎ

  const totalDuration = endMin - startMin;
  const breakMins = shift.breakTime || 0;
  
  // 実労働時間（分）
  const effectiveDuration = Math.max(0, totalDuration - breakMins);

  // 3. 深夜時間の計算 (22:00-05:00)
  const getOverlap = (s: number, e: number, rS: number, rE: number) => {
    return Math.max(0, Math.min(e, rE) - Math.max(s, rS));
  };

  // 深夜帯の定義: 
  // 当日 00:00〜05:00 (0分〜300分)
  // 当日 22:00〜29:00 (1320分〜1740分) ※翌05:00
  const earlyMorningOverlap = getOverlap(startMin, endMin, 0, 300);
  const lateNightOverlap = getOverlap(startMin, endMin, 1320, 1740);

  // 深夜労働時間（休憩時間を考慮せず単純に重複している時間）
  let rawNightMinutes = earlyMorningOverlap + lateNightOverlap;

  // 休憩時間が深夜にかぶっている可能性を考慮し、
  // 計算された深夜時間が「実労働時間」を超えないように補正する
  const effectiveNightMinutes = Math.min(rawNightMinutes, effectiveDuration);

  // 4. 給与計算
  // 基本給 = 実労働時間 * 時給
  const baseSalary = (effectiveDuration / 60) * hourlyWage;
  
  // 深夜割増 = 深夜時間 * 時給 * (倍率 - 1)
  // ※基本給の中に1.0倍分は既に入っているため、0.25倍分だけ足す計算
  const multiplier = nightMultiplier || 1.25;
  const nightAllowance = (effectiveNightMinutes / 60) * hourlyWage * (multiplier - 1);

  return Math.floor(baseSalary + nightAllowance);
};

/**
 * 月間の予想給与合計を計算
 */
export const calculateMonthlySalary = (
  shifts: Shift[], 
  jobs: Job[],
  year: number, 
  month: number, 
  defaultWage: number,
  nightMultiplier: number
): number => {
  // 対象月のシフトを抽出
  const targetShifts = shifts.filter(shift => {
    const d = new Date(shift.date);
    return d.getFullYear() === year && (d.getMonth() + 1) === month;
  });

  // 合計計算
  return targetShifts.reduce((total, shift) => {
    return total + calculateShiftSalary(shift, jobs, defaultWage, nightMultiplier);
  }, 0);
};