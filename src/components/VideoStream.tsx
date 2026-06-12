import React from 'react';
import { ArrowLeft, Video } from 'lucide-react';

interface VideoStreamProps {
  onBack: () => void;
}

export default function VideoStream({ onBack }: VideoStreamProps) {
  return (
    <div className="w-screen h-screen relative bg-black">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-50 p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/80 text-white transition-all shadow-xl flex items-center justify-center group"
        title="Back to Home / AI Assistant"
      >
        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* We assume the Video Stream (Vite) runs on port 5173 */}
      <iframe
        src="http://localhost:5173"
        className="w-full h-full border-0 block"
        title="Video Stream App"
      />
    </div>
  );
}
