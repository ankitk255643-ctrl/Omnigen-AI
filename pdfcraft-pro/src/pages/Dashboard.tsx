import React, { useState, useEffect } from 'react';
import { 
  File, 
  Trash2, 
  Download, 
  ShieldCheck, 
  Grid, 
  User as UserIcon, 
  Database,
  Star
} from 'lucide-react';
import { User, FileRecord } from '../types';
import { PDF_TOOLS } from '../toolsData';

interface DashboardProps {
  currentUser: User;
  onNavigate: (page: string) => void;
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelectTool: (id: string) => void;
}

export default function Dashboard({ 
  currentUser, 
  onNavigate, 
  favorites, 
  onToggleFavorite,
  onSelectTool
}: DashboardProps) {
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recent uploaded or processed files from Express API
  const fetchRecentFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/files/recent', {
        headers: {
          'x-user-id': currentUser.id
        }
      });
      const data = await res.json();
      if (res.ok) {
        setRecentFiles(data.files || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentFiles();
  }, [currentUser]);

  // Handle delete call
  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this file? This operation cannot be undone.')) return;
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecentFiles((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      alert('Failed to delete file');
    }
  };

  const favoriteTools = PDF_TOOLS.filter((t) => favorites.includes(t.id));

  // Dynamic storage calculatables
  const usedStorageBytes = recentFiles.reduce((acc, f) => acc + (f.fileSize || 0), 0);
  const totalLimitBytes = currentUser.plan === 'business' ? 10 * 1024 * 1024 * 1024 : currentUser.plan === 'premium' ? 2 * 1024 * 1024 * 1024 : 100 * 1024 * 1024; // 10GB, 2GB, 100MB
  const storagePercentage = Math.min(100, Math.round((usedStorageBytes / totalLimitBytes) * 100));

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      
      {/* 1. Header cockpit panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-6 mb-8 gap-4">
        <div className="text-left">
          <span className="font-sans text-xs font-bold text-red-500 uppercase tracking-widest">Workspace Dashboard</span>
          <h1 className="font-sans text-2xl sm:text-3xl font-black text-gray-900 leading-none mt-1">
            Welcome back, {currentUser.name}!
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <span className="rounded-full bg-blue-50 border border-blue-100 px-3.5 py-1 text-xs font-bold text-blue-700 capitalize">
            Active: {currentUser.plan} Plan
          </span>
          <button 
            onClick={() => onNavigate('pricing')} 
            className="px-3.5 py-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* 2. Top grid section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Storage card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans text-xs font-extrabold text-gray-400 uppercase tracking-wider">Cloud Storage Allocations</h3>
            <Database size={16} className="text-gray-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900 leading-none">{formatSize(usedStorageBytes)}</span>
            <span className="text-xs text-gray-400 font-medium"> of {formatSize(totalLimitBytes)} limit</span>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  storagePercentage > 85 ? 'bg-red-500' : 'bg-blue-600'
                }`}
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total files processed */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans text-xs font-extrabold text-gray-400 uppercase tracking-wider">Processed Actions</h3>
            <File size={16} className="text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 leading-none">{recentFiles.length} Documents</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Staged and customized inside current segment</p>
          </div>
        </div>

        {/* Security / System clearance status */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans text-xs font-extrabold text-gray-400 uppercase tracking-wider">Locker security status</h3>
            <ShieldCheck size={16} className="text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-700">AES 256 Active Protection</p>
            <p className="text-xs text-gray-450 mt-1 leading-relaxed">
              Staged nodes auto-wipe regularly. Compliance verified.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Split-panel of Files and Starred services */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Files log table column */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 text-left shadow-sm">
          <h3 className="font-sans text-sm font-extrabold text-gray-950 mb-4 border-b border-gray-50 pb-2">
            History Ledger and Downloads
          </h3>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              <span className="text-xs text-gray-450">Loading operations log...</span>
            </div>
          ) : recentFiles.length > 0 ? (
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center justify-between border border-gray-100 bg-gray-50/50 p-4 rounded-xl shadow-sm transition-all hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3.5 overflow-hidden">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-50 to-blue-50 text-gray-500 shrink-0">
                      <File size={16} className="text-gray-500" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="truncate font-sans text-xs font-bold text-gray-800 leading-none">{file.originalName}</p>
                      <div className="flex items-center space-x-2 mt-1.5 font-mono text-[9px] text-gray-400 font-semibold uppercase leading-none">
                        <span>Size: {formatSize(file.fileSize)}</span>
                        <span>•</span>
                        <span className="text-blue-600 font-bold">{file.toolUsed}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <a 
                      href={`/api/files/download/${file.id}`}
                      title="Download File"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-100 hover:border-gray-200 text-gray-500 hover:text-blue-600 transition-colors shadow-sm"
                    >
                      <Download size={13} />
                    </a>
                    <button 
                      onClick={() => handleDeleteFile(file.id)}
                      title="Delete Permanently"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-100 hover:border-red-100 text-gray-300 hover:text-red-600 transition-colors shadow-sm cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-gray-450 border-2 border-dashed border-gray-100 rounded-xl">
              <p className="font-sans text-xs text-gray-500 leading-normal">
                No custom staged documents found in this workspace yet.
              </p>
              <button 
                onClick={() => onNavigate('home')} 
                className="mt-3.5 text-xs font-bold text-blue-600 hover:text-red-500 transition-colors cursor-pointer"
              >
                Go tool select
              </button>
            </div>
          )}
        </div>

        {/* Favorite tools column */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-left shadow-sm">
          <h3 className="flex items-center space-x-1.5 font-sans text-sm font-extrabold text-gray-950 mb-4 border-b border-gray-50 pb-2">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span>Pinned shortcuts</span>
          </h3>

          {favoriteTools.length > 0 ? (
            <div className="space-y-2.5">
              {favoriteTools.map((tool) => (
                <div 
                  key={tool.id}
                  onClick={() => onSelectTool(tool.id)}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/20 hover:bg-gray-50 hover:border-red-100 transition-all cursor-pointer group"
                >
                  <span className="font-sans text-xs font-bold text-gray-800 group-hover:text-red-500 transition-colors">
                    {tool.name}
                  </span>
                  <span className="text-[10px] text-gray-300 group-hover:text-red-500 transition-colors shrink-0">
                    Open →
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 border border-dashed border-gray-100 rounded-xl">
              <p className="font-sans text-[11px] text-gray-500 leading-relaxed px-4">
                Star tool cards directly on the grid to save quick sidebar bookmarks.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
