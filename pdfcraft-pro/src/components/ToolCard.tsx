import React from 'react';
import DynamicIcon from './DynamicIcon';
import { PDFTool } from '../types';

interface ToolCardProps {
  key?: React.Key;
  tool: PDFTool;
  onClick: (toolPath: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent, toolId: string) => void;
}

export default function ToolCard({ tool, onClick, isFavorite = false, onToggleFavorite }: ToolCardProps) {
  // Determine themed background & borders matching the Bento mockup specs
  let iconBgClass = 'bg-slate-50 text-slate-700';
  let hoverBorderClass = 'hover:border-blue-500';
  let badgeEl = null;

  if (tool.id === 'merge-pdf') {
    iconBgClass = 'bg-blue-50 text-blue-600';
    hoverBorderClass = 'hover:border-blue-500';
    badgeEl = <span className="bg-blue-100 text-blue-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full select-none shrink-0">Popular</span>;
  } else if (tool.id === 'split-pdf') {
    iconBgClass = 'bg-red-50 text-red-600';
    hoverBorderClass = 'hover:border-red-500';
  } else if (tool.id === 'compress-pdf') {
    iconBgClass = 'bg-green-50 text-green-600';
    hoverBorderClass = 'hover:border-green-500';
  } else if (tool.category === 'security') {
    iconBgClass = 'bg-slate-900 text-white';
    hoverBorderClass = 'hover:border-slate-800';
  } else if (tool.category === 'ai' || tool.isPremium) {
    iconBgClass = 'bg-purple-150/70 text-purple-700 bg-purple-50';
    hoverBorderClass = 'hover:border-purple-500';
    badgeEl = <span className="bg-purple-100 text-purple-700 text-[9px] uppercase font-bold px-2.5 py-0.5 rounded-full select-none shrink-0 border border-purple-100">AI / PRO</span>;
  } else if (tool.id === 'ai-summarizer') {
    iconBgClass = 'bg-orange-50 text-orange-600';
    hoverBorderClass = 'hover:border-orange-500';
    badgeEl = <span className="bg-orange-100 text-orange-700 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full select-none shrink-0">Hot</span>;
  }

  return (
    <div 
      onClick={() => onClick(tool.path)}
      id={`tool-${tool.id}`}
      className={`group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer ${hoverBorderClass}`}
    >
      <div>
        {/* Tool Header Icon & Badgification */}
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${iconBgClass}`}>
            <DynamicIcon name={tool.iconName} size={20} className="stroke-[2.5]" />
          </div>

          <div className="flex items-center space-x-2">
            {badgeEl}
            
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(e, tool.id);
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                  isFavorite 
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-500' 
                    : 'bg-white border-slate-100 text-slate-300 hover:text-yellow-400'
                }`}
              >
                ★
              </button>
            )}
          </div>
        </div>

        {/* Labels */}
        <h3 className="font-sans text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
          {tool.name}
        </h3>
        <p className="mt-2 font-sans text-xs text-slate-400 leading-relaxed">
          {tool.description}
        </p>
      </div>

      <div className="mt-5 flex items-center text-[11px] font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
        <span>Open Tool</span>
        <span className="ml-1 transform transition-transform group-hover:translate-x-1">→</span>
      </div>
    </div>
  );
}
