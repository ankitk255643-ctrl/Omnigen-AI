import { Check } from 'lucide-react';
import { User } from '../types';

interface PricingProps {
  currentUser: User | null;
  onUpgradeSuccess: (updatedUser: User) => void;
  onNavigate: (page: string) => void;
}

export default function Pricing({ currentUser, onUpgradeSuccess, onNavigate }: PricingProps) {
  const PLANS = [
    {
      id: 'free' as const,
      name: 'Free Studio',
      price: '$0',
      period: 'forever',
      desc: 'Fundamental suite for individuals looking for quick tool runs.',
      features: [
        'Secure 1-Hour file auto-deletions',
        'Staged file limits up to 100MB',
        'Standard Merge, Split, and Rotator',
        'Watermark and secure protect tools',
        'Singular file uploads'
      ],
      limitations: [
        'No OCR selectable regeneration',
        'No Google Gemini document analysis',
        'Priority queues disabled'
      ]
    },
    {
      id: 'premium' as const,
      name: 'Premium Craftsman',
      price: '$12',
      period: 'per month',
      desc: 'The complete toolkit for professionals executing deep work.',
      features: [
        'Secure 24-Hour file cloud retention',
        'Staged file limits up to 1GB (1000MB)',
        'Full Google OCR document generation',
        'Unlocks entire Gemini AI Summary & Translators',
        'Unlimited batch uploads',
        'Priority high-speed thread queues'
      ],
      limitations: [
        'No developer API access locks'
      ],
      popular: true
    },
    {
      id: 'business' as const,
      name: 'Enterprise Foundry',
      price: '$36',
      period: 'per month',
      desc: 'Heavy-machinery platform for corporate files and development.',
      features: [
        'Unlimited cloud retention controls',
        'Max files size limit: up to 10GB',
        'Dedicated server queue priority',
        'Full developer API access & credentials panel',
        'Collaborative shared team workspaces',
        'Premium 24/7 dedicated desk support'
      ],
      limitations: []
    }
  ];

  const handlePlanSelection = async (planId: 'free' | 'premium' | 'business') => {
    if (!currentUser) {
      alert('You must sign in or register a free profile before subscribing to active operational plans!');
      onNavigate('signup');
      return;
    }

    try {
      const res = await fetch('/api/auth/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, plan: planId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onUpgradeSuccess(data.user);
      alert(`Plan successfully updated to ${planId.toUpperCase()}! Your permissions have been scaled.`);
      onNavigate('dashboard');
    } catch (err: any) {
      alert(`Plan selection failed: ${err.message}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center bg-white">
      <div className="mb-12 text-center">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">SaaS Plans Structure</span>
        <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mt-1 animate-fade-in">
          Simple, transparent rates.
        </h1>
        <p className="mt-3.5 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Unlock high-performance OCR parsing and Google Gemini AI insights under optimized pipelines.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col justify-between rounded-3xl border p-8 text-left transition-all duration-300 hover:shadow-xl ${
              plan.popular 
                ? 'border-blue-500 bg-white ring-1 ring-blue-500 shadow-md shadow-blue-500/5' 
                : 'border-slate-100 bg-white'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3.5 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-white shadow-md">
                Highly Recommended
              </span>
            )}

            <div>
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="font-sans text-base font-extrabold text-slate-950">{plan.name}</h3>
              </div>

              <div className="flex items-baseline mb-4">
                <span className="font-sans text-3xl sm:text-4xl font-black text-slate-950">{plan.price}</span>
                <span className="font-sans text-xs font-semibold text-slate-500 ml-1.5">/ {plan.period}</span>
              </div>

              <p className="font-sans text-xs text-slate-500 leading-relaxed mb-6 border-b border-slate-100 pb-5">
                {plan.desc}
              </p>

              <ul className="space-y-3 font-sans text-xs leading-none mb-6">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start space-x-2.5">
                    <Check size={14} className="text-green-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 leading-normal">{feat}</span>
                  </li>
                ))}

                {plan.limitations.map((lim) => (
                  <li key={lim} className="flex items-start space-x-2.5 opacity-40">
                    <span className="text-red-500 shrink-0 select-none mt-0.5">•</span>
                    <span className="text-slate-400 line-through leading-normal">{lim}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handlePlanSelection(plan.id)}
              className={`w-full py-3.5 rounded-xl font-sans text-xs font-bold transition-all duration-300 cursor-pointer text-center ${
                currentUser?.plan === plan.id
                  ? 'bg-green-50 border border-green-200 text-green-700 font-bold select-none cursor-default'
                  : plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              {currentUser?.plan === plan.id ? 'Your active pricing plan' : 'Select details'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
