import React from 'react';

export type BookingsTabKey = 'all' | 'pending' | 'ongoing' | 'completed' | 'rejected';

export interface BookingsTab {
  key: BookingsTabKey;
  label: string;
}

interface BookingsTabsProps {
  tabs: BookingsTab[];
  activeKey: BookingsTabKey;
  onChange: (key: BookingsTabKey) => void;
}

const BookingsTabs = ({ tabs, activeKey, onChange }: BookingsTabsProps) => {
  return (
    <div className="border-b border-gray-200 mb-8">
      <div className="flex gap-8">
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`pb-4 text-[16px] font-medium relative transition-colors ${
                isActive
                  ? 'text-[#343226]'
                  : 'text-[#9D9D9D] hover:text-[#6C6C6C]'
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#4C9A2A]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BookingsTabs;

