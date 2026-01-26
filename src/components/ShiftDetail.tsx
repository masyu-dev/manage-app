'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, PanInfo } from 'framer-motion';
import { Shift, Job } from '@/types'; // Adjust import path as needed
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Clock, Wallet, Edit2, Briefcase } from 'lucide-react';
import styles from './ShiftDetail.module.css';

import { useApp } from '@/lib/store';
import { calculateShiftSalary } from '@/lib/calculations';

interface ShiftDetailProps {
  shift: Shift;
  job?: Job;
  onClose: () => void;
  onEdit: () => void;
}

export default function ShiftDetail({ shift, job, onClose, onEdit }: ShiftDetailProps) {
  // ▼ 修正1: jobs を追加で取得
  const { userConfig, jobs } = useApp();

  // Calculate duration
  const start = new Date(`2000-01-01T${shift.startTime}`);
  let end = new Date(`2000-01-01T${shift.endTime}`);

  // 日またぎ対応: 終了時間が開始時間より前の場合は翌日扱いにする
  if (end < start) {
    end = new Date(`2000-01-02T${shift.endTime}`);
  }

  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  const workHours = Math.max(0, durationHours - (shift.breakTime / 60));

  // ▼ 修正2: 引数を4つ渡すように変更 (shift, jobs, defaultWage, multiplier)
  const estimatedWage = calculateShiftSalary(
    shift,
    jobs,
    userConfig.hourlyWage,
    userConfig.nightWageMultiplier
  );

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
              <span className={styles.wageLabel}>概算給与</span>
              <span className={styles.wageValue} style={{ fontSize: '1.5rem', color: 'hsl(var(--primary))' }}>
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
    document.body
  );
}