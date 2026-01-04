'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './HelpModal.module.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
}

export default function HelpModal({ isOpen, onClose, activeTab }: HelpModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;

  const getContent = () => {
    switch (activeTab) {
      case 'shift':
        return (
          <>
            <h4>シフト管理の使い方</h4>
            <ul>
              <li><strong>シフト追加:</strong> 日付をタップするか、右下の「+」ボタンを押すとシフトを追加できます。</li>
              <li><strong>シフト編集・削除:</strong> カレンダー上のシフトをタップすると編集や削除ができます。</li>
              <li><strong>コピー機能:</strong> 右上の共有アイコンを押すと、その月のシフト一覧をテキスト形式でコピーできます。</li>
              <li><strong>月移動:</strong> 左右のスワイプ、または上部の矢印ボタンで月を移動できます。</li>
            </ul>
          </>
        );
      case 'salary':
        return (
          <>
            <h4>給与管理の使い方</h4>
            <ul>
              <li><strong>給与確認:</strong> 月ごとの給与見込み額、勤務時間、扶養控除内の残枠を確認できます。</li>
              <li><strong>時給設定:</strong> 「概要」タブの設定から、基本時給や深夜手当の倍率を設定できます。</li>
              <li><strong>バイト先管理:</strong> 複数のバイト先を登録し、それぞれの時給を設定できます。</li>
            </ul>
          </>
        );
      case 'budget':
        return (
          <>
            <h4>家計簿の使い方</h4>
            <ul>
              <li><strong>収支入力:</strong> 日付をタップして、収入や支出を入力できます。</li>
              <li><strong>タグ管理:</strong> 支出入力時にタグを選択・追加できます。タグごとの色分けも可能です。</li>
              <li><strong>履歴確認:</strong> 下部のリストでその月の入出金履歴を確認できます。</li>
              <li><strong>グラフ表示:</strong> 上部の円グラフで、支出の割合を視覚的に確認できます。</li>
            </ul>
          </>
        );
      case 'summary':
        return (
          <>
            <h4>概要・設定の使い方</h4>
            <ul>
              <li><strong>ダッシュボード:</strong> 今月の収支バランスや、年間の貯金目標への進捗を確認できます。</li>
              <li><strong>設定:</strong> 右上の歯車アイコンから、アプリのテーマカラーやダークモードの切り替えができます。</li>
              <li><strong>データ管理:</strong> バイト先やタグの編集・削除もここから行えます。</li>
            </ul>
          </>
        );
      default:
        return <p>ヘルプ情報がありません。</p>;
    }
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>ヘルプ</h3>
          <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
        </div>
        <div className={styles.content}>
          {getContent()}
        </div>
      </div>
    </div>,
    document.body
  );
}
