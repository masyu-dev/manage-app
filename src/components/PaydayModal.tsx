import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Job, Shift } from '@/types';
import { calculatePayPeriod, calculatePeriodSalary } from '@/lib/salaryUtils';
import { X, Calendar as CalendarIcon, Clock, Coins, Briefcase } from 'lucide-react';
import styles from './PaydayModal.module.css';

interface PaydayModalProps {
    isOpen: boolean;
    onClose: () => void;
    payDate: Date;
    job: Job;
    shifts: Shift[];
    nightWageMultiplier?: number;
}

export default function PaydayModal({
    isOpen,
    onClose,
    payDate,
    job,
    shifts,
    nightWageMultiplier = 1.25
}: PaydayModalProps) {

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const salaryData = useMemo(() => {
        const closingDate = job.closingDate || 31;
        const { start, end } = calculatePayPeriod(payDate, closingDate);
        return calculatePeriodSalary(shifts, start, end, job.id, nightWageMultiplier);
    }, [payDate, job, shifts, nightWageMultiplier]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className={styles.overlay} onPointerDown={(e) => e.stopPropagation()}>
            <div
                className={styles.modal}
                style={{ borderTopColor: job.color }}
            >
                <div className={styles.header}>
                    <div>
                        <h3>給与明細</h3>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                            支給日: {payDate.toLocaleDateString()}
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className={styles.closeButton}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.content}>

                    {/* Job Name */}
                    <div className={styles.formGroup}>
                        <label><Briefcase size={16} /> バイト先</label>
                        <div className="input" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                            {job.name}
                        </div>
                    </div>

                    {/* Period */}
                    <div className={styles.formGroup}>
                        <label><CalendarIcon size={16} /> 集計期間</label>
                        <div className="input" style={{ backgroundColor: 'hsl(var(--muted))', fontSize: '0.9rem' }}>
                            {salaryData.periodString}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label><Clock size={16} /> 勤務日数</label>
                            <div className="input" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                                {salaryData.workDays}日
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label><Clock size={16} /> 総時間</label>
                            <div className="input" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                                {salaryData.totalHours.toFixed(1)}h
                            </div>
                        </div>
                    </div>

                    {/* Total Salary Preview Card */}
                    <div style={{
                        marginTop: '0.5rem',
                        padding: '1rem',
                        backgroundColor: 'hsl(var(--primary) / 0.05)',
                        borderRadius: '12px',
                        border: '1px dashed hsl(var(--primary) / 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Coins size={14} /> 概算支給額
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>
                            ¥{salaryData.totalPay.toLocaleString()}
                        </div>

                        {/* Breakdown */}
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', fontSize: '0.75rem', color: '#666' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>基本給</span>
                                <span>¥{salaryData.basePay.toLocaleString()}</span>
                            </div>
                            {salaryData.nightPay > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                    <span>深夜手当</span>
                                    <span>¥{salaryData.nightPay.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
}
