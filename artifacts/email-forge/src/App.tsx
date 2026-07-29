import React, { useState, useMemo, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { TEMPLATES, Category, LAYOUTS } from './data/templates';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TemplateCard } from './components/TemplateCard';

const queryClient = new QueryClient();

function Dashboard() {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'large' | 'compact'>('large');
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  const handleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(tpl => {
      const matchesCategory = activeCategory === 'All' || tpl.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        tpl.subjectLine.toLowerCase().includes(q) ||
        tpl.companyName.toLowerCase().includes(q) ||
        tpl.filename.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q);
      
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TEMPLATES.forEach(tpl => {
      counts[tpl.category] = (counts[tpl.category] || 0) + 1;
    });
    return counts;
  }, []);

  const stats = {
    designs: TEMPLATES.length,
    categories: Object.keys(categoryCounts).length,
    layouts: LAYOUTS.length
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-[#e5e5e5] overflow-hidden selection:bg-[#262626] selection:text-white">
      {/* Sidebar */}
      <Sidebar 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory} 
        categoryCounts={categoryCounts}
        totalCount={TEMPLATES.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <TopBar 
          stats={stats}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {filteredTemplates.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === 'large' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' 
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6'
            }`}>
              {filteredTemplates.map(tpl => (
                <TemplateCard 
                  key={tpl.id} 
                  template={tpl} 
                  viewMode={viewMode}
                  isBookmarked={bookmarks.has(tpl.id)}
                  onBookmark={handleBookmark}
                />
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#737373]">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-lg font-medium text-[#a3a3a3]">No templates found</p>
              <p className="text-sm mt-1">Try adjusting your search or category filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Ensure we have a dark mode class just in case some shadcn components rely on it
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
