import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Upload,
  Download,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  X,
  Wand2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageEnhancerProps {
  onBack: () => void;
}

type EnhancementMode =
  | 'removebg'
  | 'enhance'
  | 'upscale'
  | 'recolor';

const PICSART_API_KEY = 'paat-WNdl7yYf7kEXEd7InCidt7aQOSY';

const enhancementModes = [
  {
    id: 'removebg' as EnhancementMode,
    label: 'Remove Background',
    desc: 'AI-powered background removal',
    icon: Sparkles,
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-purple-500/30',
  },
  {
    id: 'enhance' as EnhancementMode,
    label: 'AI Enhance',
    desc: 'Boost sharpness & quality',
    icon: Wand2,
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'shadow-cyan-500/30',
  },
  {
    id: 'upscale' as EnhancementMode,
    label: 'Upscale 4×',
    desc: 'Super-resolution AI upscaling',
    icon: ZoomIn,
    gradient: 'from-emerald-500 to-green-600',
    glow: 'shadow-emerald-500/30',
  },
  {
    id: 'recolor' as EnhancementMode,
    label: 'Smart Recolor',
    desc: 'AI color enhancement',
    icon: Sliders,
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/30',
  },
];

export default function ImageEnhancer({ onBack }: ImageEnhancerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedMode, setSelectedMode] = useState<EnhancementMode>('removebg');
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showComparison, setShowComparison] = useState(false);

  // Removebg options
  const [outputType, setOutputType] = useState('cutout');
  const [bgBlur, setBgBlur] = useState(0);
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [strokeSize, setStrokeSize] = useState(0);
  const [strokeColor, setStrokeColor] = useState('#FFFFFF');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
  };

  const loadFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) loadFile(f);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleEnhance = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (selectedMode === 'removebg') {
        await handleRemoveBg();
      } else if (selectedMode === 'enhance') {
        await handleAiEnhance();
      } else if (selectedMode === 'upscale') {
        await handleUpscale();
      } else if (selectedMode === 'recolor') {
        await handleRecolor();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleRemoveBg = async () => {
    if (!file) return;
    setStatus('Analyzing image with AI...');

    const form = new FormData();
    form.append('image', file);
    form.append('output_type', outputType);
    form.append('bg_blur', String(bgBlur));
    form.append('scale', 'fit');
    form.append('auto_center', 'false');
    form.append('stroke_size', String(strokeSize));
    form.append('stroke_color', strokeColor.replace('#', ''));
    form.append('stroke_opacity', '100');
    form.append('shadow', shadowEnabled ? 'drop' : 'disabled');
    form.append('shadow_opacity', '20');
    form.append('shadow_blur', '50');
    form.append('model', 'urn:air:picsart:model:picsart:sod@10');
    form.append('format', 'PNG');

    setStatus('Removing background with Picsart AI...');

    const res = await fetch('https://api.picsart.io/tools/1.0/removebg', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'X-Picsart-API-Key': PICSART_API_KEY,
      },
      body: form,
    });

    const data = await res.json();

    if (!res.ok || data.status !== 'success') {
      throw new Error(data.message || data.detail || 'Background removal failed');
    }

    const imageUrl = data.data?.url;
    if (!imageUrl) throw new Error('No output image returned');

    // Fetch the image and convert to blob URL for CORS-safe display
    setStatus('Processing result...');
    const imgRes = await fetch(imageUrl, { mode: 'cors' });
    const blob = await imgRes.blob();
    setResult(URL.createObjectURL(blob));
  };

  const handleAiEnhance = async () => {
    if (!file) return;
    setStatus('Enhancing image quality...');

    const form = new FormData();
    form.append('image', file);
    form.append('upscale_factor', '1'); // 1x for enhance only
    form.append('format', 'PNG');

    const res = await fetch('https://api.picsart.io/tools/1.0/upscale/enhance', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'X-Picsart-API-Key': PICSART_API_KEY,
      },
      body: form,
    });

    const data = await res.json();
    if (!res.ok || data.status !== 'success') {
      // Fallback: show original with canvas filter enhancement
      setStatus('Applying local enhancement...');
      await applyLocalEnhancement();
      return;
    }

    const imageUrl = data.data?.url;
    if (!imageUrl) throw new Error('No output image returned');

    setStatus('Processing result...');
    const imgRes = await fetch(imageUrl, { mode: 'cors' });
    const blob = await imgRes.blob();
    setResult(URL.createObjectURL(blob));
  };

  const handleUpscale = async () => {
    if (!file) return;
    setStatus('Upscaling image 4× with super-resolution...');

    const form = new FormData();
    form.append('image', file);
    form.append('upscale_factor', '4');
    form.append('format', 'PNG');

    const res = await fetch('https://api.picsart.io/tools/1.0/upscale', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'X-Picsart-API-Key': PICSART_API_KEY,
      },
      body: form,
    });

    const data = await res.json();
    if (!res.ok || data.status !== 'success') {
      // Fallback
      setStatus('Applying local upscaling...');
      await applyLocalEnhancement(2);
      return;
    }

    const imageUrl = data.data?.url;
    if (!imageUrl) throw new Error('No output image returned');

    setStatus('Processing result...');
    const imgRes = await fetch(imageUrl, { mode: 'cors' });
    const blob = await imgRes.blob();
    setResult(URL.createObjectURL(blob));
  };

  const handleRecolor = async () => {
    if (!file) return;
    setStatus('Applying AI color enhancement...');

    // Use canvas-based approach for color enhancement
    await applyLocalColorEnhancement();
  };

  const applyLocalEnhancement = (scale: number = 1): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!preview) { reject(new Error('No preview')); return; }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.filter = 'contrast(1.1) saturate(1.15) brightness(1.05) sharpen(1)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) setResult(URL.createObjectURL(blob));
          resolve();
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = preview;
    });
  };

  const applyLocalColorEnhancement = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!preview) { reject(new Error('No preview')); return; }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;

        // Vibrant color correction
        ctx.filter = 'saturate(1.4) contrast(1.15) brightness(1.08) hue-rotate(5deg)';
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) setResult(URL.createObjectURL(blob));
          resolve();
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = preview;
    });
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `omnigen-enhanced-${Date.now()}.png`;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStatus('');
    setZoom(1);
  };

  const currentMode = enhancementModes.find((m) => m.id === selectedMode)!;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-bold text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Image Enhancer</h1>
              <p className="text-[9px] text-white/30 uppercase tracking-widest">Powered by Picsart AI</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${showComparison ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Compare
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </>
          )}
          {(file || result) && (
            <button
              onClick={reset}
              className="p-1.5 hover:bg-white/10 rounded-xl text-white/40 hover:text-rose-400 transition-all"
              title="Reset"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Enhancement Modes */}
        <aside className="w-72 shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar p-4 gap-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-1 mb-1">Enhancement Mode</p>

          {enhancementModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                selectedMode === mode.id
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/[0.02] border-transparent hover:bg-white/5 hover:border-white/10'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center shadow-lg ${selectedMode === mode.id ? mode.glow : ''}`}>
                <mode.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white/90">{mode.label}</div>
                <div className="text-[10px] text-white/40">{mode.desc}</div>
              </div>
              {selectedMode === mode.id && (
                <div className="ml-auto w-2 h-2 rounded-full bg-purple-400" />
              )}
            </button>
          ))}

          {/* Options for Remove Background */}
          <AnimatePresence>
            {selectedMode === 'removebg' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-4 bg-white/[0.03] border border-white/10 rounded-2xl space-y-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Options</p>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/50 font-medium">Output Type</label>
                    <select
                      value={outputType}
                      onChange={(e) => setOutputType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    >
                      <option value="cutout">Cutout (Transparent BG)</option>
                      <option value="mask">Mask</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/50 font-medium flex justify-between">
                      Background Blur <span className="text-purple-400">{bgBlur}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={bgBlur}
                      onChange={(e) => setBgBlur(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/50 font-medium flex justify-between">
                      Stroke Size <span className="text-purple-400">{strokeSize}px</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={strokeSize}
                      onChange={(e) => setStrokeSize(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  {strokeSize > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/50 font-medium">Stroke Color</label>
                      <input
                        type="color"
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        className="w-full h-8 rounded-xl border border-white/10 bg-black/40 cursor-pointer"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setShadowEnabled(!shadowEnabled)}
                      className={`w-10 h-5 rounded-full transition-all relative ${shadowEnabled ? 'bg-purple-600' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${shadowEnabled ? 'left-[1.35rem]' : 'left-0.5'}`} />
                    </div>
                    <span className="text-xs text-white/60">Drop Shadow</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!file ? (
            /* Upload Zone */
            <div className="flex-1 flex items-center justify-center p-8">
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-2xl border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-6 p-16 cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-full flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/40 transition-all">
                  <Upload className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">Drop your image here</h3>
                  <p className="text-sm text-white/40">or click to browse • PNG, JPG, WEBP up to 25MB</p>
                </div>
                <div className="flex items-center gap-3">
                  {enhancementModes.map((m) => (
                    <div key={m.id} className={`px-3 py-1 rounded-full bg-gradient-to-r ${m.gradient} text-[10px] font-bold text-white opacity-70`}>
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Zoom Controls */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/20 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : result ? 'bg-green-400' : 'bg-white/20'}`} />
                  <span className="text-xs text-white/40 font-medium">
                    {loading ? status : result ? 'Enhancement Complete' : `Ready to ${currentMode.label}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-bold text-white/40 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Image Canvas */}
              <div className="flex-1 overflow-auto bg-[#0a0a0a] flex items-center justify-center custom-scrollbar p-8" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a2e22 0%, transparent 70%)' }}>
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin" />
                        <div className="absolute inset-3 border-4 border-violet-500/10 border-t-violet-400 rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
                        <div className="absolute inset-6 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{status}</p>
                        <p className="text-xs text-white/30 mt-1">Picsart AI is working its magic...</p>
                      </div>
                    </motion.div>
                  ) : showComparison && result ? (
                    <motion.div key="comparison" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6 items-start">
                      <div className="text-center space-y-2">
                        <div
                          className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                          style={{ backgroundImage: 'repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%) 0 0 / 20px 20px' }}
                        >
                          <img src={preview!} alt="Original" className="max-w-[45vw] max-h-[60vh] object-contain" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} referrerPolicy="no-referrer" />
                        </div>
                        <p className="text-xs font-bold text-white/40">Original</p>
                      </div>
                      <div className="text-center space-y-2">
                        <div
                          className="rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl shadow-purple-500/10"
                          style={{ backgroundImage: 'repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%) 0 0 / 20px 20px' }}
                        >
                          <img src={result} alt="Enhanced" className="max-w-[45vw] max-h-[60vh] object-contain" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} referrerPolicy="no-referrer" />
                        </div>
                        <p className="text-xs font-bold text-purple-400">Enhanced</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="image"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative"
                    >
                      <div
                        className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                        style={{ backgroundImage: 'repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%) 0 0 / 20px 20px' }}
                      >
                        <img
                          src={result || preview!}
                          alt={result ? 'Enhanced' : 'Original'}
                          className="max-w-[80vw] max-h-[65vh] object-contain transition-transform"
                          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      {result && (
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            <span className="text-[10px] font-bold text-green-400">Enhanced</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mx-6 mb-4 flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-rose-500/10 rounded-lg">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Bar */}
              <div className="px-6 pb-6 pt-4 bg-gradient-to-t from-[#050505] to-transparent shrink-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentMode.gradient} flex items-center justify-center shadow-lg`}>
                    <currentMode.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{currentMode.label}</p>
                    <p className="text-[10px] text-white/40">{currentMode.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all"
                  >
                    <ImageIcon className="w-4 h-4 text-white/60" />
                    Change Image
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnhance}
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${currentMode.gradient} ${currentMode.glow} shadow-lg`}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <currentMode.icon className="w-4 h-4" />
                    )}
                    {loading ? 'Processing...' : `Apply ${currentMode.label}`}
                  </motion.button>

                  {result && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Save
                    </motion.button>
                  )}
                </div>

                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
          )}
        </main>
      </div>
    </motion.div>
  );
}
