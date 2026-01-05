'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Shift } from '@/types';
import { format } from 'date-fns';
import { createPortal } from 'react-dom';
import { Clock, Briefcase, Calendar as CalendarIcon, Save, Trash2, X } from 'lucide-react'; // アイコン追加
import styles from './ShiftForm.module.css';

interface ShiftFormProps {
  initialDate?: Date;
  existingShift?: Shift;
  onClose: () => void;
}

// 簡易的なトーストコンポーネント（ファイル内に定義）
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#333',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '8px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {message}
    </div>,
    document.body
  );
};

export default function ShiftForm({ initialDate, existingShift, onClose }: ShiftFormProps) {
  const { addShift, updateShift, deleteShift, userConfig, shiftProfiles, addShiftProfile, jobs } = useApp();

  const [date, setDate] = useState(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(existingShift?.startTime || '09:00');
  const [endTime, setEndTime] = useState(existingShift?.endTime || '17:00');
  const [breakTime, setBreakTime] = useState(existingShift?.breakTime ?? 0);
  const [jobId, setJobId] = useState(existingShift?.jobId || '');
  const [profileName, setProfileName] = useState('');
  const [showProfileSave, setShowProfileSave] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showToast, setShowToast] = useState(false); // トースト表示用state

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let currentWage = userConfig.hourlyWage;
    if (jobId) {
      const job = jobs.find(j => j.id === jobId);
      if (job) currentWage = job.hourlyWage;
    }

    if (existingShift && existingShift.jobId === jobId) {
      currentWage = existingShift.hourlyWage;
    }

    const shiftData: Shift = {
      id: existingShift?.id || crypto.randomUUID(),
      date,
      startTime,
      endTime,
      breakTime,
      hourlyWage: currentWage,
      jobId: jobId || undefined,
    };

    if (existingShift) {
      updateShift(shiftData);
    } else {
      addShift(shiftData);
    }
    
    // トーストを表示して、少し待ってから閉じる
    setShowToast(true);
    setTimeout(() => {
      onClose();
    }, 1000); // 1秒後に閉じる（トーストは見えたままフェードアウトさせたい場合は調整）
  };

  const handleSaveProfile = () => {
    if (!profileName) return;
    addShiftProfile({
      id: crypto.randomUUID(),
      name: profileName,
      startTime,
      endTime,
      breakTime,
      jobId: jobId || undefined,
    });
    setShowProfileSave(false);
    setProfileName('');
    alert('テンプレートを保存しました'); // ここもトーストにしても良い
  };

  const loadProfile = (profileId: string) => {
    const profile = shiftProfiles.find(p => p.id === profileId);
    if (profile) {
      setStartTime(profile.startTime);
      setEndTime(profile.endTime);
      setBreakTime(profile.breakTime);
      if (profile.jobId) setJobId(profile.jobId);
    }
  };

  const handleDelete = () => {
    if (existingShift) {
      deleteShift(existingShift.id);
      onClose();
    }
  };

  if (!mounted) return null;

  return (
    <>
      {createPortal(
        <div className={styles.overlay} onPointerDown={(e) => e.stopPropagation()}>
          <div className={styles.modal}>
            <div className={styles.header}>
              <button type="button" onClick={onClose} className="btn btn-ghost" style={{ padding: 0 }}>
                <X size={24} />
              </button>
              <h3>{existingShift ? 'シフト編集' : 'シフト追加'}</h3>
              {/* ヘッダーの保存ボタンは削除し、下の大きなボタンに集約するか、残すならアイコンのみにする */}
              <div style={{ width: 24 }}></div> 
            </div>

            <form id="shift-form" onSubmit={handleSubmit} className={styles.form}>
              
              {/* テンプレート呼び出し（ドロップダウン改善） */}
              {shiftProfiles.length > 0 && (
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={16} /> よく使うシフトから入力
                  </label>
                  <select onChange={(e) => loadProfile(e.target.value)} className="input" defaultValue="" style={{ cursor: 'pointer' }}>
                    <option value="" disabled>テンプレートを選択...</option>
                    {shiftProfiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.startTime}-{p.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* バイト先選択 */}
              {jobs.length > 0 && (
                <div className={styles.formGroup}>
                  <label>バイト先</label>
                  <select
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    className="input"
                  >
                    <option value="">標準 (時給 ¥{userConfig.hourlyWage})</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>{job.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarIcon size={16} /> 日付
                </label>
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={16} /> 開始
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="input"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={16} /> 終了
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="input"
                  />
                </div>
              </div>

              {/* 休憩時間（トグル/チップUIへの変更） */}
              <div className={styles.formGroup}>
                <label>休憩時間</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0, 30, 60].map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`btn ${breakTime === time ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1, padding: '8px' }}
                      onClick={() => setBreakTime(time)}
                    >
                      {time === 0 ? 'なし' : `${time}分`}
                    </button>
                  ))}
                </div>
                {/* プリセット以外の数値を入れたい場合のフォールバック（目立たなく配置） */}
                <details style={{ marginTop: '8px' }}>
                  <summary style={{ fontSize: '0.8rem', color: '#666', cursor: 'pointer' }}>その他（手入力）</summary>
                  <input
                    type="number"
                    value={breakTime}
                    onChange={(e) => setBreakTime(Number(e.target.value))}
                    min="0"
                    className="input"
                    style={{ marginTop: '4px' }}
                  />
                </details>
              </div>

              {/* テンプレート保存機能 */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                {!showProfileSave ? (
                  <button type="button" onClick={() => setShowProfileSave(true)} className="btn btn-ghost" style={{ width: '100%', fontSize: '0.9rem', color: 'var(--primary)' }}>
                    + このシフト構成をテンプレート保存
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="例: 早番A"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="input"
                      style={{ fontSize: '0.875rem' }}
                    />
                    <button type="button" onClick={handleSaveProfile} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>保存</button>
                    <button type="button" onClick={() => setShowProfileSave(false)} className="btn btn-ghost">×</button>
                  </div>
                )}
              </div>

              <div className={styles.actions} style={{ flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Save size={20} /> 保存する
                </button>
                
                {existingShift && (
                  <button type="button" onClick={handleDelete} className="btn btn-ghost" style={{ width: '100%', color: 'var(--danger)', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Trash2 size={16} /> このシフトを削除
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 保存完了時のトースト表示 */}
      {showToast && <Toast message="シフトを保存しました！" onClose={() => setShowToast(false)} />}
    </>
  );
}