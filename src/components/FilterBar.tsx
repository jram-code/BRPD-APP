'use client';

import type { FilterMode } from '@/types';

interface FilterBarProps {
  filter: FilterMode;
  onFilterChange: (f: FilterMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const filters: { key: FilterMode; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'non-compliant', label: 'Failed' },
  { key: 'has-photos', label: 'Photos' },
  { key: 'flagged', label: 'Flagged' },
];

export function FilterBar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 sticky top-[120px] z-30">
      {/* Search */}
      <input
        type="text"
        placeholder="Search items..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-orange"
      />

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`tap-target px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
