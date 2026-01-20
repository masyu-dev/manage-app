'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { Shift } from '@/types';
import { format } from 'date-fns';
import { createPortal } from 'react-dom';
import { calculateShiftSalary } from '@/lib/calculations';
import { Clock, Briefcase, Calendar as CalendarIcon, Save, Trash2, X, Watch, ChevronDown, Coins } from 'lucide-react';
import styles from './ShiftForm.module.css';

interface ShiftFormProps {
  initialDate?: Date;
  existingShift?: Shift;
  onClose: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  // onToastの型定義を拡張（第2引数でタイプを受け取れるように）
  onToast?: (msg: string, type?: 'success' | 'error') => void;
}

export default function ShiftForm({ initialDate, existingShift, onClose, onSave, onDelete, onToast }: ShiftFormProps) {
  const { addShift, updateShift, deleteShift, userConfig, shiftProfiles, addShiftProfile, jobs } = useApp();

  const [date, setDate] = useState(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(existingShift?.startTime || '09:00');
  const [endTime, setEndTime] = useState(existingShift?.endTime || '17:00');
  const [breakTime, setBreakTime] = useState(existingShift?.breakTime ?? 0);
  const [jobId, setJobId] = useState(existingShift?.jobId || '');
  const [profileName, setProfileName] = useState('');
  const [showProfileSave, setShowProfileSave] = useState(false);
  const [mounted, setMounted] = useState(false);

  // シェイクアニメーション用State
  const [isShaking, setIsShaking] = useState(false);

  const [isBreakPickerOpen, setIsBreakPickerOpen] = useState(false);
  const breakHours = Math.floor(breakTime / 60);
  const breakMinutes = breakTime % 60;
  const hourOptions = [0, 1, 2];
  const minuteOptions = [0, 15, 30, 45];

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isBreakPickerOpen) {
      if (hoursRef.current) {
        const selectedEl = hoursRef.current.querySelector(`[data-value="${breakHours}"]`) as HTMLElement;
        if (selectedEl) {
          hoursRef.current.scrollTop = selectedEl.offsetTop - hoursRef.current.offsetHeight / 2 + selectedEl.offsetHeight / 2;
        }
      }
      if (minutesRef.current) {
        const selectedEl = minutesRef.current.querySelector(`[data-value="${breakMinutes}"]`) as HTMLElement;
        if (selectedEl) {
          minutesRef.current.scrollTop = selectedEl.offsetTop - minutesRef.current.offsetHeight / 2 + selectedEl.offsetHeight / 2;
        }
      }
    }
  }, [isBreakPickerOpen]);

  // エラー時の演出実行関数
  const triggerErrorEffect = (msg: string) => {
    // 1. 赤色トースト表示
    if (onToast) {
      onToast(msg, 'error');
    } else {
      alert(msg);
    }

    // 2. フォームを揺らす
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500); // 0.5秒後に揺れを止める

    // 3. スマホを振動させる（Android等対応機種のみ）
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(200); // 200ms振動
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 日をまたぐシフト（例：22:00〜05:00）を許容するためバリデーションを削除します

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

    if (onSave) onSave();
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
      jobId: jobId || undefined,
    });
    setShowProfileSave(false);
    setProfileName('');

    if (onToast) onToast('テンプレートを保存しました', 'success');
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
      if (onDelete) onDelete();
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className={styles.overlay} onPointerDown={(e) => e.stopPropagation()}>
      <div
        className={`${styles.modal} ${isShaking ? styles.shake : ''}`} // シェイク用のクラスを適用
        style={{
          // シェイクアニメーションの定義（インラインスタイルで簡易実装）
          animation: isShaking ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none',
          transform: 'translate3d(0, 0, 0)'
        }}
      >
        {/* CSSアニメーション用のstyleタグ埋め込み */}
        <style>{`
          @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
          }
        `}</style>

        <div className={styles.header}>
          <button type="button" onClick={onClose} className="btn btn-ghost" style={{ padding: 0 }}>
            <X size={24} />
          </button>
          <h3>{existingShift ? 'シフト編集' : 'シフト追加'}</h3>
          <div style={{ width: 24 }}></div>
        </div>

        <form id="shift-form" onSubmit={handleSubmit} className={styles.form}>

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

          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Watch size={16} /> 休憩時間
            </label>

            <div
              className="input"
              onClick={() => setIsBreakPickerOpen(!isBreakPickerOpen)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                backgroundColor: isBreakPickerOpen ? '#f0f9ff' : '#fff',
                borderColor: isBreakPickerOpen ? 'hsl(var(--primary))' : 'var(--border)',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '1rem' }}>
                {breakTime === 0 ? 'なし' : `${breakHours}時間 ${breakMinutes}分`}
              </span>
              <ChevronDown size={16} style={{
                transform: isBreakPickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: '#666'
              }} />
            </div>

            {isBreakPickerOpen && (
              <div style={{
                marginTop: '0px',
                border: '1px solid var(--border)',
                borderTop: 'none',
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#fff',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                animation: 'slideDown 0.2s ease-out',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '40px',
                  marginTop: '-20px',
                  backgroundColor: '#f0f9ff',
                  borderTop: '1px solid #e0f2fe',
                  borderBottom: '1px solid #e0f2fe',
                  pointerEvents: 'none',
                  zIndex: 0
                }}></div>

                <div style={{ display: 'flex', height: '180px' }}>
                  <div
                    ref={hoursRef}
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      position: 'relative',
                      zIndex: 1,
                      scrollSnapType: 'y mandatory'
                    }}
                  >
                    <div style={{ height: '70px' }}></div>
                    {hourOptions.map(h => (
                      <div
                        key={h}
                        data-value={h}
                        onClick={() => setBreakTime(h * 60 + breakMinutes)}
                        style={{
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: breakHours === h ? 'hsl(var(--primary))' : '#999',
                          fontWeight: breakHours === h ? 'bold' : 'normal',
                          fontSize: breakHours === h ? '1.1rem' : '1rem',
                          transition: 'all 0.2s',
                          scrollSnapAlign: 'center'
                        }}
                      >
                        {h}時間
                      </div>
                    ))}
                    <div style={{ height: '70px' }}></div>
                  </div>

                  <div
                    ref={minutesRef}
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      position: 'relative',
                      zIndex: 1,
                      scrollSnapType: 'y mandatory',
                      borderLeft: '1px solid #f0f0f0'
                    }}
                  >
                    <div style={{ height: '70px' }}></div>
                    {minuteOptions.map(m => (
                      <div
                        key={m}
                        data-value={m}
                        onClick={() => setBreakTime(breakHours * 60 + m)}
                        style={{
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: breakMinutes === m ? 'hsl(var(--primary))' : '#999',
                          fontWeight: breakMinutes === m ? 'bold' : 'normal',
                          fontSize: breakMinutes === m ? '1.1rem' : '1rem',
                          transition: 'all 0.2s',
                          scrollSnapAlign: 'center'
                        }}
                      >
                        {m}分
                      </div>
                    ))}
                    <div style={{ height: '70px' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Salary Preview */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'hsl(var(--primary) / 0.05)',
            borderRadius: '12px',
            border: '1px dashed hsl(var(--primary) / 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Coins size={14} /> 概算給与
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>
              ¥{(() => {
                let currentWage = userConfig.hourlyWage;
                if (jobId) {
                  const job = jobs.find(j => j.id === jobId);
                  if (job) currentWage = job.hourlyWage;
                }
                const tempShift: Shift = {
                  id: 'preview',
                  date,
                  startTime,
                  endTime,
                  breakTime,
                  hourlyWage: currentWage,
                  jobId: jobId || undefined,
                };
                return calculateShiftSalary(tempShift, userConfig.nightWageMultiplier).toLocaleString();
              })()}
              <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#999', marginLeft: '0.5rem' }}>
                (時給: ¥{(() => {
                  let currentWage = userConfig.hourlyWage;
                  if (jobId) {
                    const job = jobs.find(j => j.id === jobId);
                    if (job) currentWage = job.hourlyWage;
                  }
                  return currentWage.toLocaleString();
                })()})
              </span>
            </div>
          </div>

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
  );
}