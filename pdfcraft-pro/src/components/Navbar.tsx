import React, { useState } from 'react';
import { ChevronDown, Grid, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  activePage: string;
}

export default function Navbar({ currentUser, onNavigate, onLogout, activePage }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex cursor-pointer items-center space-x-2 transition-opacity hover:opacity-90"
          id="logo-brand"
        >
          <div className="flex h-8 w-8 bg-blue-600 rounded items-center justify-center text-white font-bold text-xl shrink-0">
            P
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            PDFCraft <span className="text-blue-600">Pro</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-7">
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center space-x-1 font-sans text-sm font-medium transition-colors hover:text-blue-600 ${
                activePage === 'tools' || activePage === 'home' ? 'text-blue-600 font-bold' : 'text-slate-600'
              }`}
            >
              <span>All PDF Tools</span>
              <ChevronDown size={14} className={`transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-3 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-fade-in z-50">
                <button 
                  onClick={() => { onNavigate('tools'); setDropdownOpen(false); }}
                  className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all font-medium"
                >
                  <Grid size={16} className="text-slate-500" />
                  <span>Tools Directory</span>
                </button>
                <div className="my-1.5 border-t border-slate-100" />
                <div className="px-3 py-1 font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hot Solutions</div>
                <button 
                  onClick={() => { onNavigate('merge-pdf'); setDropdownOpen(false); }}
                  className="flex w-full rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-slate-600 hover:bg-blue-50/50 hover:text-blue-600 transition-all"
                >
                  Merge PDF
                </button>
                <button 
                  onClick={() => { onNavigate('split-pdf'); setDropdownOpen(false); }}
                  className="flex w-full rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-slate-600 hover:bg-blue-50/50 hover:text-blue-600 transition-all"
                >
                  Split PDF
                </button>
                <button 
                  onClick={() => { onNavigate('ai-summarizer'); setDropdownOpen(false); }}
                  className="flex w-full rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition-all"
                >
                  🤖 AI Summarizer
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => onNavigate('pricing')}
            className={`font-sans text-sm font-medium transition-colors hover:text-blue-600 ${
              activePage === 'pricing' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            Pricing
          </button>

          <button 
            onClick={() => onNavigate('api')}
            className={`font-sans text-sm font-medium transition-colors hover:text-blue-600 ${
              activePage === 'api' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            Developer API
          </button>
        </div>

        {/* Desktop Profile / Auth CTA */}
        <div className="flex items-center space-x-4">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div 
                onClick={() => onNavigate('dashboard')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-100 transition-all"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold">
                  <UserIcon size={14} className="stroke-[2.5]" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold leading-none text-slate-800">{currentUser.name}</span>
                  <span className="font-mono text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-normal mt-0.5">
                    {currentUser.plan} Plan
                  </span>
                </div>
              </div>

              <button 
                onClick={onLogout}
                title="Log Out"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate('login')}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Log in
              </button>
              <button 
                onClick={() => onNavigate('signup')}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
