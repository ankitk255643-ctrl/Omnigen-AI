import React, { useState } from 'react';
import { ShieldAlert, UserPlus, KeyRound } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  onNavigate: (page: string) => void;
  initialMode?: 'login' | 'signup';
}

export default function Auth({ onAuthSuccess, onNavigate, initialMode = 'login' }: AuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (activeTab === 'signup' && !name)) {
      setErrorText('Please fill in check parameters.');
      return;
    }

    setIsLoading(true);
    setErrorText(null);

    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = activeTab === 'login' ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server authorization failed');

      onAuthSuccess(data.user);
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center select-none bg-white">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl shadow-slate-200/30 text-left animate-fade-in">
        
        {/* Tab selector */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorText(null); }}
            className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-505 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setErrorText(null); }}
            className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorText && (
          <div className="mb-4 flex items-center space-x-2 rounded-xl border border-red-500/10 bg-red-50/50 p-3 text-xs font-semibold text-red-600">
            <ShieldAlert size={14} className="shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700">Display Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all mt-1 font-sans font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700">Email Address</label>
            <input
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all mt-1 font-sans font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all mt-1 font-sans font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 font-sans text-xs font-bold text-white shadow-sm hover:shadow-md transition-all cursor-pointer mt-6"
          >
            {activeTab === 'signup' ? <UserPlus size={14} /> : <KeyRound size={14} />}
            <span>
              {isLoading ? 'Processing credentials...' : activeTab === 'signup' ? 'Initialize Craftsman' : 'Access Dashboard'}
            </span>
          </button>
        </form>

        <p className="mt-5 font-sans text-[10px] text-slate-400 leading-normal text-center">
          By signing in, you consent fully to the automated TLS privacy compliance auto-deletions policies.
        </p>
      </div>
    </div>
  );
}
