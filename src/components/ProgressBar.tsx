'use client';

import type { CheckItem } from '@/types';

interface ProgressBarProps {
  items: CheckItem[];
  onFilterNonCompliant: () => void;
}

export function ProgressBar({ items, onFilterNonCompliant }: ProgressBarProps) {
  const total = items.length;
  const pass = items.filter((i) => i.status === 'pass').length;
  const fail = items.filter((i) => i.status === 'fail').length;
  const na = items.filter((i) => i.status === 'na').length;
  const outstanding = items.filter((i) => i.status === 'outstanding').length;
  const completed = total - outstanding;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-[57px] z-40">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${total > 0 ? (pass / total) * 100 : 0}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${total > 0 ? (fail / total) * 100 : 0}%` }}
            />
            <div
              className="bg-gray-400 transition-all"
              style={{ width: `${total > 0 ? (na / total) * 100 : 0}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-bold text-dark-grey w-12 text-right">{percent}%</span>
      </div>

      {/* Counts */}
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Pass: {pass}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Fail: {fail}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          N/A: {na}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-white border border-gray-300" />
          Outstanding: {outstanding}
        </span>
      </div>

      {/* Non-compliant banner */}
      {fail > 0 && (
        <button
          onClick={onFilterNonCompliant}
          className="mt-2 w-full text-left bg-red-50 border border-red-200 rounded px-3 py-2 text-xs text-red-700"
        >
          ⚠️ {fail} non-compliant item{fail !== 1 ? 's' : ''} — tap to view
        </button>
      )}
    </div>
  );
}
