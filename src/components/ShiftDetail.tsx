'use client';

import React from 'react';
import { createPortal } from 'react-dom';
<<<<<<< Updated upstream
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Edit, Clock, Briefcase, Calculator, X } from 'lucide-react';
import { Shift, Job } from '@/types';
=======
import { motion, PanInfo } from 'framer-motion';
import { Shift, Job } from '@/types'; // Adjust import path as needed
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Clock, Wallet, Edit2, Briefcase } from 'lucide-react';
>>>>>>> Stashed changes
import styles from './ShiftDetail.module.css';

interface ShiftDetailProps {
    shift: Shift;
    job?: Job;
<<<<<<< Updated upstream
    isOpen: boolean;
=======
>>>>>>> Stashed changes
    onClose: () => void;
    onEdit: () => void;
}

<<<<<<< Updated upstream
export default function ShiftDetail({ shift, job, isOpen, onClose, onEdit }: ShiftDetailProps) {
    if (!isOpen) return null;

    // Calculate estimated salary for this shift
    const calculateSalary = () => {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);

        let durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight

        const workingMinutes = durationMinutes - shift.breakTime;
        const workingHours = workingMinutes / 60;

        return Math.floor(workingHours * shift.hourlyWage);
    };

    const estimatedSalary = calculateSalary();

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.backdrop}
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 500 }} // Limit drag upwards
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            // If dragged down more than 100px or fast velocity, close
                            if (info.offset.y > 100 || info.velocity.y > 500) {
                                onClose();
                            }
                        }}
                        className={styles.sheet}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
                    >
                        <div className={styles.handle} />

                        <div className={styles.header}>
                            <h2 className={styles.dateTitle}>
                                {format(new Date(shift.date), 'M月d日(E)', { locale: ja })}
                            </h2>
                            <button onClick={onClose} className="btn btn-ghost btn-circle">
                                <X size={24} />
                            </button>
                        </div>

                        <div className={styles.content}>
                            <div className={styles.row}>
                                <Clock className={styles.icon} size={20} />
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {shift.startTime} <span style={{ color: '#aaa', fontSize: '1rem' }}>〜</span> {shift.endTime}
                                </span>
                                {shift.breakTime > 0 && (
                                    <span style={{ fontSize: '0.875rem', color: '#666', marginLeft: 'auto' }}>
                                        (休 {shift.breakTime}分)
                                    </span>
                                )}
                            </div>

                            <div className={styles.row}>
                                <Briefcase className={styles.icon} size={20} />
                                {job ? (
                                    <span
                                        className={styles.jobChip}
                                        style={{ backgroundColor: job.color }}
                                    >
                                        {job.name}
                                    </span>
                                ) : (
                                    <span style={{ color: '#666' }}>未設定</span>
                                )}
                            </div>

                            <div className={styles.wageInfo}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calculator size={18} className={styles.icon} />
                                    <div>
                                        <div className={styles.wageLabel}>時給</div>
                                        {/* Using class for color now */}
                                        <div className={styles.wageAmount}>¥{shift.hourlyWage.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className={styles.wageLabel} style={{ textAlign: 'right' }}>概算給与</div>
                                    <div className={styles.wageAmount}>¥{estimatedSalary.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <button
                                    onClick={() => {
                                        onClose();
                                        // Slight delay to allow sheet to close smoothly before opening modal? 
                                        // Or just direct. Direct feels faster.
                                        onEdit();
                                    }}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '1rem', fontSize: '1.1rem' }}
                                >
                                    <Edit size={20} />
                                    編集する
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
=======
export default function ShiftDetail({ shift, job, onClose, onEdit }: ShiftDetailProps) {
    // Calculate duration
    const start = new Date(`2000-01-01T${shift.startTime}`);
    const end = new Date(`2000-01-01T${shift.endTime}`);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const workHours = Math.max(0, durationHours - (shift.breakTime / 60));

    // Calculate wage
    const estimatedWage = Math.floor(workHours * shift.hourlyWage);

    // Animation variants
    const variants = {
        hidden: { y: '100%' },
        visible: { y: 0 },
        exit: { y: '100%' }
    };

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
        }
    };

    return createPortal(
        <motion.div
            className={styles.shiftDetailOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.shiftDetailSheet}
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()} // Prevent click from closing when tapping content
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
            >
                <div className={styles.dragHandleArea}>
                    <div className={styles.dragHandle} />
                </div>

                <div className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.dateTitle}>
                            {format(new Date(shift.date), 'M月d日(E)', { locale: ja })}
                        </div>
                        <button onClick={onClose} className={styles.closeButton}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className={styles.infoRow}>
                        <div className={styles.iconWrapper}>
                            <Clock size={16} />
                        </div>
                        <div>
                            <div className={styles.infoLabel}>時間</div>
                            <div className={styles.infoValue}>
                                {shift.startTime} - {shift.endTime}
                                <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '8px' }}>
                                    (休憩 {shift.breakTime}分)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.infoRow}>
                        <div className={styles.iconWrapper} style={{ backgroundColor: '#fdf4ff', color: '#d946ef' }}>
                            <Briefcase size={16} />
                        </div>
                        <div>
                            <div className={styles.infoLabel}>勤務先</div>
                            <div className={styles.infoValue}>
                                {job ? job.name : '標準'}
                            </div>
                        </div>
                    </div>

                    <div className={styles.wageInfo}>
                        <div className={styles.wageRow}>
                            <span className={styles.wageLabel}>時給</span>
                            <span className={styles.wageValue}>¥{shift.hourlyWage.toLocaleString()}</span>
                        </div>
                        <div className={styles.wageRow}>
                            <span className={styles.wageLabel}>実働時間</span>
                            <span className={styles.wageValue}>{workHours.toFixed(2)}時間</span>
                        </div>
                        <div style={{ borderTop: '1px dashed #e2e8f0', margin: '8px 0' }} />
                        <div className={styles.wageRow}>
                            <span className={styles.wageLabel} style={{ color: '#64748b' }}>概算給与</span>
                            <span className={styles.wageValue} style={{ color: '#0f172a', fontSize: '1.1rem' }}>
                                ¥{estimatedWage.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <button onClick={onEdit} className={styles.actionButton}>
                        <Edit2 size={18} />
                        シフトを編集する
                    </button>
                </div>
            </motion.div>
        </motion.div>,
>>>>>>> Stashed changes
        document.body
    );
}
