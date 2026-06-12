import { Shield, Lock, FileCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="w-full bg-slate-50/50 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Logo Brand / Privacy pitch */}
          <div className="sm:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600">
                <span className="font-sans text-sm font-bold text-white">P</span>
              </div>
              <span className="font-sans text-lg font-bold tracking-tight text-slate-900">PDFCraft <span className="text-blue-600">Pro</span></span>
            </div>
            <p className="max-w-xs font-sans text-xs text-slate-500 leading-relaxed">
              Your elite browser and server environment for lightning-fast PDF compiling, optimizing, secure locker tools, and next-generation Gemini AI document reading.
            </p>
            {/* Certifications badges */}
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="flex items-center space-x-1.5 rounded-lg bg-white border border-slate-100 px-2 py-1 select-none shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
                <Shield size={12} className="text-blue-600" />
                <span className="font-mono text-[9px] font-bold text-slate-600 uppercase tracking-widest">TLS SECURE</span>
              </div>
              <div className="flex items-center space-x-1.5 rounded-lg bg-white border border-slate-100 px-2 py-1 select-none shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
                <Lock size={12} className="text-blue-600" />
                <span className="font-mono text-[9px] font-bold text-slate-600 uppercase tracking-widest">256-BIT AES RES</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Features</h3>
            <ul className="space-y-2">
              {['Merge PDF', 'Split PDF', 'Compress PDF', 'AI Summarizer', 'Translate PDF'].map((item) => (
                <li key={item}>
                  <button 
                    onClick={() => {
                      if (item === 'Merge PDF') onNavigate('merge-pdf');
                      else if (item === 'Split PDF') onNavigate('split-pdf');
                      else if (item === 'Compress PDF') onNavigate('compress-pdf');
                      else if (item === 'AI Summarizer') onNavigate('ai-summarizer');
                      else if (item === 'Translate PDF') onNavigate('translate-pdf');
                    }}
                    className="font-sans text-xs text-slate-500 hover:text-blue-600 transition-colors text-left"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Policies */}
          <div>
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Privacy Framework</h3>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onNavigate('privacy')} className="font-sans text-xs text-slate-500 hover:text-blue-600 transition-colors text-left">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="font-sans text-xs text-slate-500 hover:text-blue-600 transition-colors text-left">
                  Terms of Service
                </button>
              </li>
              <li className="flex items-center space-x-1 text-[10px] text-green-600 font-medium">
                <FileCheck size={12} />
                <span>Auto-deletes enabled</span>
              </li>
            </ul>
          </div>

          {/* Contact / Help */}
          <div>
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Global Suite</h3>
            <p className="font-sans text-xs text-slate-500 leading-relaxed mb-1.5">
              Need assistance? Support desk is ready.
            </p>
            <span className="font-mono text-[10px] font-bold text-blue-600 uppercase tracking-widest">support@pdfcraftpro.com</span>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between">
          <p className="font-sans text-xs text-slate-400">
            © 2026 PDFCraft Pro. Integrated with Gemini 3 Series. All rights reserved.
          </p>
          <div className="mt-3 sm:mt-0 flex space-x-5 font-sans text-xs text-slate-400 font-medium">
            <span className="text-green-500 font-bold flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse inline-block"></span>
              Servers Active
            </span>
            <span>·</span>
            <span>Files are deleted automatically after 1 hour for privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
