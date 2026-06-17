import React, { useState, useRef } from 'react';
import { 
  Video, Upload, Download, Sparkles, RefreshCw, ArrowLeft, History, Loader2, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HiggsfieldVideoGenProps {
  onBack: () => void;
}

interface HistoryItem {
  id: string;
  prompt: string;
  videoUrl: string;
  timestamp: number;
}

const durations = ['5 sec', '10 sec', '15 sec', '30 sec', '60 sec'];
const cameraMovements = ['zoom in', 'zoom out', 'cinematic pan', 'drone shot', 'handheld', 'orbit', 'tracking shot'];
const styles = ['realistic', 'cinematic', 'anime', 'product ad', 'fashion reel', '3D animation', 'game trailer'];
const aspectRatios = ['9:16', '16:9', '1:1'];
const motionStrengths = ['low', 'medium', 'high'];
const audioMoods = ['soft', 'energetic', 'cinematic', 'suspense', 'emotional', 'no music'];

export default function HiggsfieldVideoGen({ onBack }: HiggsfieldVideoGenProps) {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  const [selectedDuration, setSelectedDuration] = useState('5 sec');
  const [selectedCamera, setSelectedCamera] = useState('cinematic pan');
  const [selectedStyle, setSelectedStyle] = useState('cinematic');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedMotion, setSelectedMotion] = useState('medium');
  const [selectedMood, setSelectedMood] = useState('cinematic');

  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!prompt && !referenceImage) return;
    
    setLoading(true);
    setError(null);
    setGeneratedVideo(null);

    try {
      const response = await fetch('/api/higgsfield/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          duration: selectedDuration,
          cameraMovement: selectedCamera,
          style: selectedStyle,
          aspectRatio: selectedRatio,
          motionStrength: selectedMotion,
          audioMood: selectedMood,
          hasReferenceImage: !!referenceImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video');
      }

      setGeneratedVideo(data.url);
      
      setHistory(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        prompt,
        videoUrl: data.url,
        timestamp: Date.now()
      }, ...prev]);
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedVideo) return;
    try {
      const response = await fetch(generatedVideo);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `higgsfield-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download video', err);
    }
  };

  return (
    <div className="h-full w-full bg-[#0a0a0a] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-emerald-900/20 z-0"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0"></div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl h-16 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Video className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Higgsfield Video Studio
            </h1>
          </div>
        </div>
        
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium border ${
            showHistory ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 relative z-10 flex overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <div className="w-[420px] border-r border-white/10 bg-black/40 backdrop-blur-md overflow-y-auto custom-scrollbar flex flex-col shrink-0">
          <div className="p-6 space-y-6">
            
            {/* Prompt */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                Video Prompt
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video scene, camera movements, and lighting..."
                className="w-full h-28 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none shadow-inner"
              ></textarea>
            </div>

            {/* Reference Image */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/90">Starting Image (Optional)</label>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
              />
              {referenceImage ? (
                <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-white/5 h-24">
                  <img src={referenceImage} alt="Reference" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => setReferenceImage(null)}
                      className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl text-sm font-medium backdrop-blur-md transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 border-2 border-dashed border-white/10 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <Upload className="w-5 h-5 text-white/60 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-sm text-white/60 group-hover:text-emerald-400 font-medium transition-colors">Upload Starting Image</span>
                </button>
              )}
            </div>

            {/* Duration & Ratio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white/90">Duration</label>
                <select 
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white [&>option]:bg-zinc-900"
                >
                  {durations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white/90">Aspect Ratio</label>
                <select 
                  value={selectedRatio}
                  onChange={(e) => setSelectedRatio(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white [&>option]:bg-zinc-900"
                >
                  {aspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Camera & Style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white/90">Camera</label>
                <select 
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white [&>option]:bg-zinc-900 capitalize"
                >
                  {cameraMovements.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white/90">Style</label>
                <select 
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white [&>option]:bg-zinc-900 capitalize"
                >
                  {styles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Motion Strength */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/90">Motion Strength</label>
              <div className="flex gap-2">
                {motionStrengths.map(strength => (
                  <button
                    key={strength}
                    onClick={() => setSelectedMotion(strength)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                      selectedMotion === strength 
                        ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20' 
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {strength}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Mood */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/90">Music Mood</label>
              <div className="flex flex-wrap gap-2">
                {audioMoods.map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                      selectedMood === mood 
                        ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20' 
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
            
          </div>
          
          {/* Action Button sticky bottom */}
          <div className="p-6 mt-auto border-t border-white/10 bg-black/60 backdrop-blur-xl sticky bottom-0">
            <button
              onClick={generateVideo}
              disabled={loading || (!prompt && !referenceImage)}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-2xl ${
                loading || (!prompt && !referenceImage) 
                  ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Rendering Timeline...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Generate Video
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto custom-scrollbar">
          
          {error && (
            <div className="w-full max-w-2xl bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <span className="text-red-400 font-bold">!</span>
              </div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="w-full max-w-4xl aspect-video sm:h-[70vh] sm:aspect-auto sm:w-auto rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden shadow-2xl group transition-all">
            
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-20">
                <div className="relative w-32 h-2 mb-8 bg-white/10 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-emerald-500 w-full origin-left animate-progress"></div>
                </div>
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 animate-pulse">
                  Rendering Frames...
                </h3>
                <p className="text-sm text-white/50 mt-2">Applying motion and lighting passes</p>
              </div>
            ) : generatedVideo ? (
              <>
                <video 
                  ref={videoRef}
                  src={generatedVideo} 
                  className="w-full h-full object-contain bg-black"
                  autoPlay
                  loop
                  controls
                  playsInline
                />
                
                {/* Overlay Controls */}
                <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex justify-between items-start pointer-events-none">
                  <div>
                    <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md rounded-full text-[10px] uppercase font-bold text-emerald-300">
                      {selectedDuration} • {selectedRatio}
                    </span>
                  </div>
                  <div className="flex gap-3 pointer-events-auto">
                    <button 
                      onClick={generateVideo}
                      className="p-3 bg-black/50 hover:bg-black/80 backdrop-blur-xl rounded-full text-white transition-all hover:scale-110 border border-white/10 tooltip-trigger"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="p-3 bg-white hover:bg-gray-200 text-black rounded-full transition-all hover:scale-110 shadow-xl shadow-white/10 tooltip-trigger"
                      title="Download MP4"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-8 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-white/5">
                  <Video className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-2xl font-bold text-white/40 mb-2">Director's Chair</h3>
                <p className="text-white/30 text-sm max-w-sm">Set up your shot parameters on the left and start rendering your cinematic vision.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden flex flex-col shrink-0"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  Video History
                </h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-1 hover:bg-white/10 rounded-md text-white/60 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {history.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-8">No history yet in this session.</p>
                ) : (
                  history.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => setGeneratedVideo(item.videoUrl)}
                      className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer hover:border-emerald-500/50 transition-all aspect-video"
                    >
                      <video src={item.videoUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <Play className="w-8 h-8 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end">
                        <p className="text-xs text-white font-medium line-clamp-1">{item.prompt}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { transform: scaleX(0); }
          20% { transform: scaleX(0.2); }
          40% { transform: scaleX(0.5); }
          60% { transform: scaleX(0.6); }
          80% { transform: scaleX(0.9); }
          100% { transform: scaleX(0.95); }
        }
        .animate-progress {
          animation: progress 5s ease-in-out infinite alternate;
        }
      `}} />
    </div>
  );
}
