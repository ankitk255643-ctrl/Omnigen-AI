import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, Upload, Download, Sparkles, RefreshCw, ArrowLeft, History, Loader2, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HiggsfieldImageGenProps {
  onBack: () => void;
}

interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
}

const styles = ['Realistic', 'Cinematic', 'Anime', 'Product Shoot', 'Fashion', '3D', 'Cartoon', 'Logo', 'Poster'];
const aspectRatios = ['1:1', '9:16', '16:9', '3:4', '4:5'];
const qualities = ['Standard', 'HD', 'Ultra HD'];

export default function HiggsfieldImageGen({ onBack }: HiggsfieldImageGenProps) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Realistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedQuality, setSelectedQuality] = useState('HD');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const generateImage = async () => {
    if (!prompt) return;
    
    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/higgsfield/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          style: selectedStyle,
          aspectRatio: selectedRatio,
          quality: selectedQuality,
          referenceImage: referenceImage ? true : false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImage(data.url);
      
      setHistory(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        prompt,
        imageUrl: data.url,
        timestamp: Date.now()
      }, ...prev]);
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `higgsfield-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  return (
    <div className="h-full w-full bg-[#0a0a0a] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 z-0"></div>
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Higgsfield Image Studio
            </h1>
          </div>
        </div>
        
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium border ${
            showHistory ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 relative z-10 flex overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <div className="w-[400px] border-r border-white/10 bg-black/40 backdrop-blur-md overflow-y-auto custom-scrollbar flex flex-col shrink-0">
          <div className="p-6 space-y-8">
            
            {/* Prompt */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                Prompt
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none shadow-inner"
              ></textarea>
            </div>

            {/* Negative Prompt */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/90">Negative Prompt (Optional)</label>
              <textarea 
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to exclude from the image..."
                className="w-full h-20 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all resize-none shadow-inner"
              ></textarea>
            </div>

            {/* Reference Image */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/90">Reference Image</label>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
              />
              {referenceImage ? (
                <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <img src={referenceImage} alt="Reference" className="w-full h-32 object-cover opacity-80" />
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
                  className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-all">
                    <Upload className="w-5 h-5 text-white/60 group-hover:text-purple-400" />
                  </div>
                  <span className="text-sm text-white/60 group-hover:text-purple-400 font-medium">Upload Image Reference</span>
                </button>
              )}
            </div>

            {/* Style Selector */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/90">Style</label>
              <div className="flex flex-wrap gap-2">
                {styles.map(style => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedStyle === style 
                        ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20' 
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/90">Aspect Ratio</label>
              <div className="grid grid-cols-5 gap-2">
                {aspectRatios.map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setSelectedRatio(ratio)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedRatio === ratio 
                        ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20' 
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className={`border-2 ${selectedRatio === ratio ? 'border-white' : 'border-white/40'} rounded-sm opacity-80 ${
                      ratio === '1:1' ? 'w-4 h-4' : 
                      ratio === '16:9' ? 'w-5 h-3' : 
                      ratio === '9:16' ? 'w-3 h-5' : 
                      ratio === '3:4' ? 'w-3 h-4' : 'w-4 h-5'
                    }`}></div>
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/90">Quality</label>
              <div className="flex gap-2">
                {qualities.map(quality => (
                  <button
                    key={quality}
                    onClick={() => setSelectedQuality(quality)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      selectedQuality === quality 
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20' 
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>
            
          </div>
          
          {/* Action Button sticky bottom */}
          <div className="p-6 mt-auto border-t border-white/10 bg-black/60 backdrop-blur-xl sticky bottom-0">
            <button
              onClick={generateImage}
              disabled={loading || !prompt}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-2xl ${
                loading || !prompt 
                  ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Image
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

          <div className="w-full max-w-3xl aspect-square sm:aspect-auto sm:h-[70vh] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden shadow-2xl group transition-all">
            
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-20">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-purple-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 animate-pulse">
                  Synthesizing Pixels...
                </h3>
                <p className="text-sm text-white/50 mt-2">Running through neural networks</p>
              </div>
            ) : generatedImage ? (
              <>
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-full object-contain"
                />
                
                {/* Image Overlay Controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium line-clamp-1 max-w-md drop-shadow-md">{prompt}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-[10px] uppercase font-bold text-white/80">{selectedStyle}</span>
                        <span className="px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-[10px] uppercase font-bold text-white/80">{selectedRatio}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={generateImage}
                        className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all hover:scale-110 tooltip-trigger"
                        title="Regenerate"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleDownload}
                        className="p-3 bg-white hover:bg-gray-200 text-black rounded-full transition-all hover:scale-110 shadow-xl shadow-white/10"
                        title="Download HD"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-8 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-white/5">
                  <ImageIcon className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-2xl font-bold text-white/40 mb-2">Ready to Create</h3>
                <p className="text-white/30 text-sm max-w-sm">Enter a prompt on the left and hit generate to see your imagination come to life.</p>
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
                  <History className="w-4 h-4 text-purple-400" />
                  Generation History
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
                      onClick={() => setGeneratedImage(item.imageUrl)}
                      className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer hover:border-purple-500/50 transition-all"
                    >
                      <img src={item.imageUrl} alt="history item" className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                        <p className="text-xs text-white font-medium line-clamp-2">{item.prompt}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
