'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Shift } from '@/types';
import { X } from 'lucide-react';
import styles from './ShiftForm.module.css';

interface ShiftFormProps {
  initialDate?: Date;
  existingShift?: Shift;
  onClose: () => void;
}

export default function ShiftForm({ initialDate, existingShift, onClose }: ShiftFormProps) {
  const { addShift, updateShift, deleteShift, userConfig, shiftProfiles, addShiftProfile } = useApp();

  const [date, setDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(existingShift?.startTime || '09:00');
  const [endTime, setEndTime] = useState(existingShift?.endTime || '17:00');
  const [breakTime, setBreakTime] = useState(existingShift?.breakTime || 60);
  const [profileName, setProfileName] = useState('');
  const [showProfileSave, setShowProfileSave] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const shiftData: Shift = {
      id: existingShift?.id || crypto.randomUUID(),
      date,
      startTime,
      endTime,
      breakTime,
      hourlyWage: existingShift?.hourlyWage || userConfig.hourlyWage,
    };

    if (existingShift) {
      updateShift(shiftData);
    } else {
      addShift(shiftData);
    }
    onClose();
  };

  const handleSaveProfile = () => {
    if (!profileName) return;
    addShiftProfile({
      id: crypto.randomUUID(),
      name: profileName,
      startTime,
      endTime,
      breakTime,
    });
    setShowProfileSave(false);
    setProfileName('');
  };

  const loadProfile = (profileId: string) => {
    const profile = shiftProfiles.find(p => p.id === profileId);
    if (profile) {
      setStartTime(profile.startTime);
      setEndTime(profile.endTime);
      setBreakTime(profile.breakTime);
    }
  };

  const handleDelete = () => {
    if (existingShift) {
      deleteShift(existingShift.id);
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>{existingShift ? 'シフト編集' : 'シフト追加'}</h3>
          <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {shiftProfiles.length > 0 && (
            <div className={styles.formGroup}>
              <label>履歴から入力</label>
              <select onChange={(e) => loadProfile(e.target.value)} className="input" defaultValue="">
                <option value="" disabled>選択してください</option>
                {shiftProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.startTime}-{p.endTime})</option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="input"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>開始時間</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="input"
              />
            </div>
            <div className={styles.formGroup}>
              <label>終了時間</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="input"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>休憩時間 (分)</label>
            <input
              type="number"
              value={breakTime}
              onChange={(e) => setBreakTime(Number(e.target.value))}
              min="0"
              className="input"
            />
          </div>

          {!showProfileSave ? (
            <button type="button" onClick={() => setShowProfileSave(true)} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem' }}>
              この時間をプロファイルに保存
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="プロファイル名 (例: 早番)"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="input"
                style={{ fontSize: '0.875rem' }}
              />
              <button type="button" onClick={handleSaveProfile} className="btn btn-primary" style={{ padding: '0.5rem' }}>保存</button>
            </div>
          )}

          <div className={styles.actions}>
            {existingShift && (
              <button type="button" onClick={handleDelete} className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                削除
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ marginRight: '0.5rem' }}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
