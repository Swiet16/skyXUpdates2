import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';

interface TopBarProps {
  stats: {
    designs: number;
    categories: number;
    layouts: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'large' | 'compact';
  onViewModeChange: (mode: 'large' | 'compact') => void;
}

export function TopBar({ stats, searchQuery, onSearchChange, viewMode, onViewModeChange }: TopBarProps) {
  return (
    <div className="sticky top-0 z-20 w-full h-14 bg-[#0d0d0d]/80 backdrop-blur-md border-b border-[#262626] flex items-center justify-between px-6">
      
      {/* Stats */}
      <div className="flex items-center gap-2 text-xs font-mono text-[#737373]">
        <span className="text-[#a3a3a3]">{stats.designs}</span> designs
        <span className="mx-1">·</span>
        <span className="text-[#a3a3a3]">{stats.categories}</span> categories
        <span className="mx-1">·</span>
        <span className="text-[#a3a3a3]">{stats.layouts}</span> layouts
      </div>

      {/* Search & View Mode */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-white transition-colors" />
          <input 
            type="search" 
            placeholder="Search subject, category, file..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-[280px] h-8 bg-[#141414] border border-[#262626] rounded-md pl-9 pr-3 text-sm text-white placeholder:text-[#525252] focus:outline-none focus:border-[#525252] focus:ring-1 focus:ring-[#525252] transition-all font-sans"
          />
        </div>

        <div className="flex items-center bg-[#141414] border border-[#262626] rounded-md p-0.5">
          <button
            onClick={() => onViewModeChange('large')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'large' ? 'bg-[#262626] text-white' : 'text-[#737373] hover:text-white'}`}
            title="Large Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('compact')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'compact' ? 'bg-[#262626] text-white' : 'text-[#737373] hover:text-white'}`}
            title="Compact Grid"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
