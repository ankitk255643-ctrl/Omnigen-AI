import React, { useState } from 'react';
import { ArrowLeft, FileArchive } from 'lucide-react';

interface FileConverterProps {
  onBack: () => void;
}

export default function FileConverter({ onBack }: FileConverterProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="w-screen h-screen relative bg-black">
      <button
        onClick={() => {
          onBack();
          window.history.pushState({}, '', '/');
        }}
        className="absolute top-6 left-6 z-50 p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/80 text-white transition-all shadow-xl flex items-center justify-center group"
        title="Back to Home / AI Assistant"
      >
        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
      </button>

      {hasError ? (
        <div className="w-full h-full flex items-center justify-center text-white flex-col gap-4">
          <FileArchive className="w-12 h-12 text-amber-400" />
          <p className="text-xl font-medium">File Converter is temporarily unavailable. Please try again.</p>
        </div>
      ) : (
        <iframe
          src="https://modifio.vercel.app/"
          className="w-full h-full border-0 block"
          title="File Converter App"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
