'use client';

import React, { useState } from 'react';
import Calendar from '@/components/Calendar';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import SettingsModal from '@/components/SettingsModal';
import SalaryView from '@/components/SalaryView';
import BudgetView from '@/components/BudgetView';
import SummaryView from '@/components/SummaryView';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = ['shift', 'salary', 'budget', 'summary'];

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 300 : -300,
      opacity: 0
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    };
  }
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('shift');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [[page, direction], setPage] = useState([0, 0]);

  // Keep activeTab and page synced. activeTab is the source of truth for index.
  const activeIndex = tabs.indexOf(activeTab);

  const paginate = (newDirection: number) => {
    const nextIndex = activeIndex + newDirection;
    if (nextIndex >= 0 && nextIndex < tabs.length) {
      setPage([nextIndex, newDirection]);
      setActiveTab(tabs[nextIndex]);
    }
  };

  const handleTabChange = (newTab: string) => {
    const newIndex = tabs.indexOf(newTab);
    const newDirection = newIndex > activeIndex ? 1 : -1;
    setPage([newIndex, newDirection]);
    setActiveTab(newTab);
  };

  return (
    <main style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', minHeight: '100vh', overflowX: 'hidden' }}>
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      <div className="container" style={{ position: 'relative' }}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={activeTab}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            style={{ width: '100%' }}
          >
            {activeTab === 'shift' && <Calendar />}
            {activeTab === 'salary' && <SalaryView />}
            {activeTab === 'budget' && <BudgetView />}
            {activeTab === 'summary' && <SummaryView />}
          </motion.div>
        </AnimatePresence>
      </div>
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </main>
  );
}
