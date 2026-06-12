import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Star, ArrowRight } from 'lucide-react';
import { PDF_TOOLS, TOOL_CATEGORIES } from '../toolsData';
import { PDFTool } from '../types';
import ToolCard from '../components/ToolCard';
import UploadBox from '../components/UploadBox';

interface HomeProps {
  onSelectTool: (toolId: string) => void;
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onQuickUpload: (files: File[]) => void;
}

export default function Home({ onSelectTool, favorites, onToggleFavorite, onQuickUpload }: HomeProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tools
  const filteredTools = useMemo(() => {
    return PDF_TOOLS.filter((tool) => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Favorite tools
  const favoriteTools = useMemo(() => {
    return PDF_TOOLS.filter((t) => favorites.includes(t.id));
  }, [favorites]);

  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-slate-50/50 border-b border-slate-100 py-16 sm:py-24">
        {/* Abstract vector backgrounds */}
        <div className="absolute right-0 top-0 -mr-40 -mt-40 h-[400px] w-[400px] rounded-full bg-blue-50 blur-3xl" />
        <div className="absolute left-0 bottom-0 -ml-40 -mb-40 h-[400px] w-[400px] rounded-full bg-slate-100 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex-1 text-left">
              <div className="flex justify-start mb-4">
                <span className="flex items-center space-x-1.5 px-3 py-1 bg-blue-50 rounded-full text-xs font-bold text-blue-700 uppercase tracking-wider border border-blue-100/50">
                  <Sparkles size={12} className="text-blue-600 stroke-[2.5]" />
                  <span>Next-Gen PDF Processor</span>
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-slate-900 mb-4">
                Every <span className="text-blue-600">PDF tool</span> you need <br />in one place.
              </h1>
              <p className="text-slate-500 max-w-lg mb-6 text-sm sm:text-base leading-relaxed">
                Merge, split, compress, convert, edit, and secure your files in seconds. Fast, online, and completely private.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    const el = document.getElementById('drag-drop-container');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all text-sm cursor-pointer"
                >
                  Choose PDF File
                </button>
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className="border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-white transition-colors text-sm cursor-pointer"
                >
                  View All Tools
                </button>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div className="w-full md:w-[440px] shrink-0 bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
              <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2.5 px-2">Launch with Quick upload</h3>
              <UploadBox 
                onFilesSelected={onQuickUpload}
                label="Drop your PDF here"
                helperText="or click to browse from device"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Favorites Bar (Staggered preview) */}
      {favoriteTools.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="flex items-center space-x-2 font-sans text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span>Starred Services ({favoriteTools.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {favoriteTools.map((tool) => (
              <ToolCard 
                key={tool.id} 
                tool={tool} 
                onClick={onSelectTool} 
                isFavorite={true}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Search and Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 mb-8 gap-4">
          
          {/* Categories Tabs & AI pill */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 max-w-full flex-1">
            <div className="flex flex-wrap gap-1">
              {TOOL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full font-sans text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-blue-600 bg-transparent'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => onSelectTool('/ai-summarizer')}
              className="px-4 py-1.5 text-red-500 bg-red-50 rounded-full text-xs font-semibold flex items-center gap-1.5 md:ml-auto cursor-pointer border border-red-100/50 hover:scale-105 transition-transform shrink-0"
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              New: AI Summarizer
            </button>
          </div>

          {/* Search Inputs */}
          <div className="relative w-full md:w-80 shadow-sm rounded-xl shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search through 32 tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
            />
          </div>
        </div>

        {/* 4. Beautiful Bento Layout Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredTools.map((tool) => {
              // Highlight Merge PDF and AI Summarizer with a wider colSpan inside the grid
              const isLarge = (tool.id === 'merge-pdf' || tool.id === 'ai-summarizer') && selectedCategory === 'all' && !searchQuery;
              return (
                <div key={tool.id} className={isLarge ? "sm:col-span-2" : "col-span-1"}>
                  <ToolCard
                    tool={tool}
                    onClick={onSelectTool}
                    isFavorite={favorites.includes(tool.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-slate-100 rounded-2xl text-center">
            <p className="font-sans text-sm text-slate-500 leading-normal">
              No specific tools found matching exactly <span className="font-bold text-slate-900">"{searchQuery}"</span>.
            </p>
            <button 
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Reset active search criteria
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
