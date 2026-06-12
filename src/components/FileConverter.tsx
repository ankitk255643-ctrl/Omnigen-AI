import React, { useState } from 'react';
import { ArrowLeft, FileArchive } from 'lucide-react';

interface FileConverterProps {
  onBack: () => void;
}

export default function FileConverter({ onBack }: FileConverterProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <FileArchive className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">File Converter</h2>
        </div>
        <button
          onClick={() => {
            onBack();
            window.history.pushState({}, '', '/');
          }}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Close Converter
        </button>
      </div>

      <div className="flex-1 relative">
        {hasError ? (
          <div className="w-full h-full flex items-center justify-center text-white flex-col gap-4">
            <FileArchive className="w-12 h-12 text-amber-400" />
            <p className="text-xl font-medium">File Converter is temporarily unavailable. Please try again.</p>
          </div>
        ) : (
          <iframe
            src="https://modifio.vercel.app/"
            className="w-full border-none block"
            style={{ height: 'calc(100vh - 120px)' }}
            title="File Converter App"
            onError={() => setHasError(true)}
          />
        )}
      </div>
    </div>
  );
}
