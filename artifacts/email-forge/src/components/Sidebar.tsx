import React from 'react';
import { CATEGORIES, Category } from '../data/templates';
import { FolderOpen, FileCode } from 'lucide-react';

interface SidebarProps {
  activeCategory: Category | 'All';
  onCategoryChange: (category: Category | 'All') => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

export function Sidebar({ activeCategory, onCategoryChange, categoryCounts, totalCount }: SidebarProps) {
  return (
    <div className="w-64 h-full bg-[#0a0a0a] border-r border-[#262626] flex flex-col shrink-0 overflow-hidden">
      {/* Brand / Breadcrumb Area */}
      <div className="h-14 flex items-center px-4 border-b border-[#262626] shrink-0">
        <div className="font-mono text-xs text-[#a3a3a3]">
          <span className="text-[#525252]">~/emailforge/</span>
          <span className="text-white">
            {activeCategory === 'All' ? 'all-templates' : activeCategory.toLowerCase().replace(' ', '-')}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 flex flex-col gap-6">
        
        {/* Library Section */}
        <div>
          <h3 className="px-2 text-[10px] font-mono font-semibold text-[#525252] mb-2 uppercase tracking-wider">
            Library
          </h3>
          <button
            onClick={() => onCategoryChange('All')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
              activeCategory === 'All' 
                ? 'bg-[#1a1a1a] text-white' 
                : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 text-sm">
              <FolderOpen className="w-4 h-4" />
              <span>All templates</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              activeCategory === 'All' ? 'bg-[#262626] text-[#e5e5e5]' : 'bg-transparent text-[#737373]'
            }`}>
              {totalCount}
            </span>
          </button>
        </div>

        {/* Categories Section */}
        <div>
          <h3 className="px-2 text-[10px] font-mono font-semibold text-[#525252] mb-2 uppercase tracking-wider">
            Categories
          </h3>
          <div className="flex flex-col gap-0.5">
            {CATEGORIES.map(category => {
              const count = categoryCounts[category] || 0;
              if (count === 0) return null; // Don't show empty categories
              
              const isActive = activeCategory === category;
              
              return (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-[#1a1a1a] text-white' 
                      : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <FileCode className="w-4 h-4 opacity-70" />
                    <span className="truncate">{category}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-[#262626] text-[#e5e5e5]' : 'bg-transparent text-[#737373]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
