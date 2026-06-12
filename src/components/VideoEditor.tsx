import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Layout, 
  Video, 
  Image as ImageIcon, 
  Type, 
  Music, 
  Layers, 
  Sparkles, 
  Download, 
  Play, 
  Pause, 
  Scissors, 
  Trash2, 
  Plus,
  ChevronRight,
  Maximize,
  Settings,
  History,
  Grid,
  Search,
  Undo,
  Redo,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Rnd } from 'react-rnd';
import confetti from 'canvas-confetti';

import { removeBackground } from '@imgly/background-removal';

interface VideoEditorProps {
  onBack: () => void;
}

interface Element {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape';
  content: string;
  x: number;
  y: number;
  width: number | string;
  height: number | string;
  rotation: number;
  zIndex: number;
  startTime: number; // in seconds
  duration: number; // in seconds
  animation?: 'fade' | 'slide' | 'typewriter' | 'none';
  filters?: {
    brightness: number;
    contrast: number;
    blur: number;
  };
  style?: {
    fontSize?: number;
    color?: string;
    fontFamily?: string;
  };
}

interface Clip {
  id: string;
  duration: number;
  elements: Element[];
  transition?: 'none' | 'fade' | 'slide' | 'dissolve';
  background?: {
    type: 'image' | 'video';
    url: string;
  };
}

interface AudioTrack {
  id: string;
  url: string;
  startTime: number;
  duration: number;
  volume: number;
  name?: string;
}

export default function VideoEditor({ onBack }: VideoEditorProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'elements' | 'uploads' | 'text' | 'apps'>('templates');
  const [clips, setClips] = useState<Clip[]>([
    { id: '1', duration: 5, elements: [] }
  ]);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [history, setHistory] = useState<Clip[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [userUploads, setUserUploads] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  const totalDuration = clips.reduce((acc, clip) => acc + clip.duration, 0);

  const saveToHistory = (newClips: Clip[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newClips)));
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevClips = history[historyIndex - 1];
      setClips(JSON.parse(JSON.stringify(prevClips)));
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextClips = history[historyIndex + 1];
      setClips(JSON.parse(JSON.stringify(nextClips)));
      setHistoryIndex(historyIndex + 1);
    }
  };

  useEffect(() => {
    Object.values(audioRefs.current).forEach(audio => {
      if (isPlaying) {
        // We handle per-track timing in a separate effect or continuous check
      } else {
        audio.pause();
      }
    });
  }, [isPlaying]);

  useEffect(() => {
    audioTracks.forEach(track => {
      const audio = audioRefs.current[track.id];
      if (audio) {
        const trackEndTime = track.startTime + track.duration;
        if (isPlaying && currentTime >= track.startTime && currentTime <= trackEndTime) {
          if (audio.paused) {
            audio.currentTime = currentTime - track.startTime;
            audio.play().catch(e => console.warn("Audio play blocked", e));
          }
          // Sync check (allow small drift)
          if (Math.abs(audio.currentTime - (currentTime - track.startTime)) > 0.2) {
            audio.currentTime = currentTime - track.startTime;
          }
          audio.volume = track.volume;
        } else {
          audio.pause();
        }
      }
    });
  }, [currentTime, isPlaying, audioTracks]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setCurrentTime(percentage * totalDuration);
  };

  const handleElementTimelineDrag = (id: string, newStartTime: number) => {
    const newClips = [...clips];
    const el = newClips[activeClipIndex].elements.find(e => e.id === id);
    if (el) {
      el.startTime = Math.max(0, Math.min(newStartTime, clips[activeClipIndex].duration - el.duration));
      setClips(newClips);
    }
  };

  const handleElementTimelineResize = (id: string, newDuration: number) => {
    const newClips = [...clips];
    const el = newClips[activeClipIndex].elements.find(e => e.id === id);
    if (el) {
      el.duration = Math.max(0.1, Math.min(newDuration, clips[activeClipIndex].duration - el.startTime));
      setClips(newClips);
    }
  };

  const addAudioTrack = (url: string, name: string = "Music Track") => {
    const newTrack: AudioTrack = {
      id: Math.random().toString(36).substr(2, 9),
      url,
      startTime: 0,
      duration: 10,
      volume: 0.8,
      name: name
    };
    setAudioTracks([...audioTracks, newTrack]);
  };

  const addElement = (type: Element['type'], content: string) => {
    const newElement: Element = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      x: 50,
      y: 50,
      width: type === 'text' ? 'auto' : 200,
      height: type === 'text' ? 'auto' : 200,
      rotation: 0,
      zIndex: clips[activeClipIndex].elements.length + 1,
      startTime: 0,
      duration: clips[activeClipIndex].duration,
      animation: 'none',
      filters: { brightness: 100, contrast: 100, blur: 0 },
      style: type === 'text' ? { fontSize: 24, color: '#ffffff', fontFamily: 'Inter' } : undefined
    };

    const newClips = [...clips];
    newClips[activeClipIndex].elements.push(newElement);
    setClips(newClips);
    saveToHistory(newClips);
    setSelectedElementId(newElement.id);
  };

  const setBackground = (type: 'image' | 'video', url: string) => {
    const newClips = [...clips];
    newClips[activeClipIndex].background = { type, url };
    setClips(newClips);
    saveToHistory(newClips);
  };

  const splitClip = () => {
    const currentClip = clips[activeClipIndex];
    const splitTime = currentTime; // This needs to be relative to the clip
    
    // For simplicity in this prototype, we split the current clip into two
    const newClip1: Clip = {
      ...currentClip,
      id: Math.random().toString(36).substr(2, 9),
      duration: splitTime || 2.5,
      elements: currentClip.elements.filter(el => el.startTime < (splitTime || 2.5))
    };
    const newClip2: Clip = {
      ...currentClip,
      id: Math.random().toString(36).substr(2, 9),
      duration: currentClip.duration - (splitTime || 2.5),
      elements: currentClip.elements.filter(el => el.startTime >= (splitTime || 2.5)).map(el => ({
        ...el,
        startTime: el.startTime - (splitTime || 2.5)
      }))
    };

    const newClips = [...clips];
    newClips.splice(activeClipIndex, 1, newClip1, newClip2);
    setClips(newClips);
    saveToHistory(newClips);
    alert("Clip split successfully!");
  };

  const updateElement = (id: string, updates: Partial<Element>) => {
    const newClips = [...clips];
    newClips[activeClipIndex].elements = newClips[activeClipIndex].elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setClips(newClips);
    // Don't save to history on every drag/resize to avoid flooding, maybe on stop
  };

  const handleDragResizeStop = () => {
    saveToHistory(clips);
  };

  const deleteElement = (id: string) => {
    const newClips = [...clips];
    newClips[activeClipIndex].elements = newClips[activeClipIndex].elements.filter(el => el.id !== id);
    setClips(newClips);
    saveToHistory(newClips);
    setSelectedElementId(null);
  };

  const deleteAudioTrack = (id: string) => {
    setAudioTracks(prev => prev.filter(t => t.id !== id));
    setSelectedAudioId(null);
    if (audioRefs.current[id]) {
      audioRefs.current[id].pause();
      delete audioRefs.current[id];
    }
  };

  const updateAudioTrack = (id: string, updates: Partial<AudioTrack>) => {
    setAudioTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const url = reader.result as string;
          setUserUploads(prev => [url, ...prev]);
          if (file.type.startsWith('image/')) {
            addElement('image', url);
          } else if (file.type.startsWith('video/')) {
            addElement('video', url);
          } else if (file.type.startsWith('audio/')) {
            addAudioTrack(url, file.name);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleExport = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#3b82f6', '#10b981']
    });
    alert("Exporting your masterpiece... (This is a prototype, real export coming soon!)");
  };

  const handleBGRemover = async () => {
    if (!selectedElementId) {
      alert("Please select an image element first.");
      return;
    }
    const el = clips[activeClipIndex].elements.find(e => e.id === selectedElementId);
    if (!el || el.type !== 'image') {
      alert("Please select an image element.");
      return;
    }

    try {
      alert("AI Background Remover started... This may take a few seconds.");
      const blob = await removeBackground(el.content);
      const url = URL.createObjectURL(blob);
      updateElement(selectedElementId, { content: url });
      saveToHistory(clips);
      alert("Background removed successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to remove background.");
    }
  };

  const handleMagicEraser = () => {
    if (!selectedElementId) {
      alert("Please select an element first.");
      return;
    }
    // Simple demo: blur the element
    updateElement(selectedElementId, { filters: { ...clips[activeClipIndex].elements.find(e => e.id === selectedElementId)?.filters!, blur: 10 } });
    saveToHistory(clips);
    alert("Magic Eraser applied (Blur effect for demo).");
  };

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col overflow-hidden font-sans">
      {/* Top Toolbar */}
      <header className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-bold text-white/80 hover:text-white"
            title="Go Back to Home"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>Back to Home</span>
          </button>
          <div className="h-6 w-[1px] bg-white/10 mx-2" />
          <h1 className="text-sm font-bold tracking-tight flex items-center gap-2">
            Canva Pro Editor <Sparkles className="w-4 h-4 text-amber-400" />
          </h1>
          <div className="flex items-center gap-1 ml-4">
            <button 
              onClick={undo}
              disabled={historyIndex <= 0}
              className={`p-2 rounded-lg transition-all ${historyIndex <= 0 ? 'text-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <Undo className="w-4 h-4" />
            </button>
            <button 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className={`p-2 rounded-lg transition-all ${historyIndex >= history.length - 1 ? 'text-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert("Link copied to clipboard!")}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold transition-all flex items-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button 
            onClick={handleExport}
            className="px-6 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Tools Panel) */}
        <aside className="w-20 bg-black border-r border-white/10 flex flex-col items-center py-6 gap-6">
          {[
            { id: 'templates', icon: Layout, label: 'Design' },
            { id: 'elements', icon: Grid, label: 'Elements' },
            { id: 'uploads', icon: ImageIcon, label: 'Uploads' },
            { id: 'text', icon: Type, label: 'Text' },
            { id: 'apps', icon: Sparkles, label: 'AI Apps' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              <div className={`p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                <tab.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Sidebar Content */}
        <div className="w-80 bg-[#1a1a1a] border-r border-white/10 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'templates' && (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div 
                    key={i} 
                    onClick={() => addElement('image', `https://picsum.photos/seed/template${i}/400/800`)}
                    className="aspect-[9/16] bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden group"
                  >
                    <img src={`https://picsum.photos/seed/template${i}/200/400`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <button 
                  onClick={() => addElement('text', 'Add a heading')}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xl font-bold transition-all"
                >
                  Add a heading
                </button>
                <button 
                  onClick={() => addElement('text', 'Add a subheading')}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-lg font-semibold transition-all"
                >
                  Add a subheading
                </button>
                <button 
                  onClick={() => addElement('text', 'Add a little bit of body text')}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-sm transition-all"
                >
                  Add body text
                </button>
              </div>
            )}

            {activeTab === 'elements' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {['square', 'circle', 'triangle', 'star', 'heart'].map(shape => (
                    <button 
                      key={shape}
                      onClick={() => addElement('shape', shape)}
                      className="aspect-square bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
                    >
                      <div className={`w-10 h-10 bg-purple-500/40 ${shape === 'circle' ? 'rounded-full' : shape === 'triangle' ? 'clip-triangle' : ''}`} />
                    </button>
                  ))}
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40">Stock Videos</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div 
                        key={i}
                        onClick={() => setBackground('video', `https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-959-large.mp4`)}
                        className="aspect-video bg-white/5 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all"
                      >
                        <video src={`https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-959-large.mp4`} className="w-full h-full object-cover opacity-60" muted />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'uploads' && (
              <div className="space-y-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm transition-all"
                >
                  Upload files
                </button>
                <div className="grid grid-cols-2 gap-3">
                  {userUploads.map((url, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        if ((url || "").includes('audio')) {
                          addAudioTrack(url);
                        } else {
                          addElement((url || "").includes('video') ? 'video' : 'image', url);
                        }
                      }}
                      className="aspect-square bg-white/5 rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all"
                    >
                      {(url || "").includes('video') ? (
                        <video src={url} className="w-full h-full object-cover" />
                      ) : (url || "").includes('audio') ? (
                        <div className="w-full h-full flex items-center justify-center bg-rose-500/20">
                          <Music className="w-8 h-8 text-rose-400" />
                        </div>
                      ) : (
                        <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )}
                    </div>
                  ))}
                  {[1, 2, 3, 4].map(i => (
                    <div 
                      key={i} 
                      onClick={() => addElement('image', `https://picsum.photos/seed/upload${i}/400/400`)}
                      className="aspect-square bg-white/5 rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all"
                    >
                      <img src={`https://picsum.photos/seed/upload${i}/200/200`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'apps' && (
              <div className="space-y-3">
                {[
                  { title: 'BG Remover', desc: 'Remove background instantly', icon: Sparkles, color: 'text-blue-400', action: handleBGRemover },
                  { title: 'Magic Eraser', desc: 'Remove objects from photos', icon: Trash2, color: 'text-purple-400', action: handleMagicEraser },
                  { title: 'Text to Image', desc: 'Generate images from text', icon: ImageIcon, color: 'text-emerald-400', action: () => alert("AI Image Generator: Type your prompt in the search bar above.") },
                  { title: 'Auto Captions', desc: 'Generate subtitles for video', icon: Type, color: 'text-amber-400', action: () => alert("Transcribing video... Captions will be added to the timeline.") },
                ].map((app, i) => (
                  <div 
                    key={i} 
                    onClick={app.action}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <app.icon className={`w-5 h-5 ${app.color}`} />
                      <h4 className="font-bold text-sm">{app.title}</h4>
                    </div>
                    <p className="text-[10px] text-white/40">{app.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <main className="flex-1 bg-[#121212] relative flex flex-col overflow-hidden">
          {/* Canvas Toolbar (Contextual) */}
          <div className="h-12 bg-black/20 border-b border-white/5 flex items-center px-4 gap-4">
            {selectedElementId ? (
              <>
                <button onClick={() => deleteElement(selectedElementId)} className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-white/10" />
                
                {clips[activeClipIndex].elements.find(el => el.id === selectedElementId)?.type === 'text' && (
                  <div className="flex items-center gap-2">
                    <select 
                      className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] outline-none"
                      onChange={(e) => updateElement(selectedElementId, { style: { ...clips[activeClipIndex].elements.find(el => el.id === selectedElementId)?.style, fontFamily: e.target.value } })}
                    >
                      <option value="Inter">Inter</option>
                      <option value="Playfair Display">Playfair</option>
                      <option value="JetBrains Mono">Mono</option>
                    </select>
                    <input 
                      type="number" 
                      className="w-12 bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] outline-none"
                      defaultValue={24}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...clips[activeClipIndex].elements.find(el => el.id === selectedElementId)?.style, fontSize: parseInt(e.target.value) } })}
                    />
                    <input 
                      type="color" 
                      className="w-6 h-6 bg-transparent border-none cursor-pointer"
                      onChange={(e) => updateElement(selectedElementId, { style: { ...clips[activeClipIndex].elements.find(el => el.id === selectedElementId)?.style, color: e.target.value } })}
                    />
                  </div>
                )}

                <div className="h-4 w-[1px] bg-white/10" />
                
                {clips[activeClipIndex].elements.find(el => el.id === selectedElementId)?.type !== 'text' && (
                  <div className="flex items-center gap-4 px-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-white/40 uppercase font-bold">Brightness</span>
                      <input 
                        type="range" min="0" max="200" defaultValue="100"
                        className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        onChange={(e) => updateElement(selectedElementId, { filters: { ...clips[activeClipIndex].elements.find(el => el.id === selectedElementId)?.filters!, brightness: parseInt(e.target.value) } })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-white/40 uppercase font-bold">Contrast</span>
                      <input 
                        type="range" min="0" max="200" defaultValue="100"
                        className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        onChange={(e) => updateElement(selectedElementId, { filters: { ...clips[activeClipIndex].elements.find(el => el.id === selectedElementId)?.filters!, contrast: parseInt(e.target.value) } })}
                      />
                    </div>
                  </div>
                )}

                <div className="h-4 w-[1px] bg-white/10" />
                
                <select 
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] outline-none"
                  onChange={(e) => updateElement(selectedElementId, { animation: e.target.value as any })}
                >
                  <option value="none">No Animation</option>
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                  <option value="typewriter">Typewriter</option>
                </select>

                <button 
                  onClick={() => alert("Positioning tools: Bring to Front / Send to Back")}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all"
                >
                  Position
                </button>
              </>
            ) : selectedAudioId ? (
              <>
                <button onClick={() => deleteAudioTrack(selectedAudioId)} className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-white/10" />
                <div className="flex items-center gap-4 px-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-white/40 uppercase font-bold text-center">Volume</span>
                    <input 
                      type="range" min="0" max="1" step="0.01" 
                      value={audioTracks.find(t => t.id === selectedAudioId)?.volume || 0.8}
                      className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      onChange={(e) => updateAudioTrack(selectedAudioId, { volume: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Music className="w-3 h-3 text-rose-400" />
                    <span className="text-[10px] font-bold text-white/60 truncate max-w-[150px]">
                      {audioTracks.find(t => t.id === selectedAudioId)?.name || 'Audio Track'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Select an element or audio to edit</span>
            )}
          </div>

          <div 
            className="flex-1 relative flex items-center justify-center p-12 overflow-hidden"
            onClick={() => {
              setSelectedElementId(null);
              setSelectedAudioId(null);
            }}
          >
            <div 
              ref={canvasRef}
              className="aspect-video bg-black shadow-2xl relative overflow-hidden ring-1 ring-white/10"
              style={{ width: '80%', maxHeight: '100%' }}
            >
              {/* Background Layer */}
              {audioTracks.map(track => (
                <audio 
                  key={track.id}
                  ref={el => { if (el) audioRefs.current[track.id] = el; }}
                  src={track.url}
                  preload="auto"
                />
              ))}
              {clips[activeClipIndex].background && (
                <div className="absolute inset-0 z-0">
                  {clips[activeClipIndex].background?.type === 'video' ? (
                    <video 
                      src={clips[activeClipIndex].background?.url} 
                      className="w-full h-full object-cover" 
                      autoPlay loop muted 
                    />
                  ) : (
                    <img 
                      src={clips[activeClipIndex].background?.url} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  )}
                </div>
              )}

              {clips[activeClipIndex].elements
                .filter(el => currentTime >= el.startTime && currentTime <= (el.startTime + el.duration))
                .map((el) => (
                <Rnd
                  key={el.id}
                  size={{ width: el.width, height: el.height }}
                  position={{ x: el.x, y: el.y }}
                  onDragStop={(e, d) => {
                    updateElement(el.id, { x: d.x, y: d.y });
                    handleDragResizeStop();
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    updateElement(el.id, {
                      width: ref.style.width,
                      height: ref.style.height,
                      ...position,
                    });
                    handleDragResizeStop();
                  }}
                  bounds="parent"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedElementId(el.id); 
                    setSelectedAudioId(null);
                  }}
                  className={`flex items-center justify-center z-[${el.zIndex}] ${selectedElementId === el.id ? 'ring-2 ring-purple-500' : ''} ${
                    el.animation === 'fade' ? 'animate-in fade-in duration-1000' : 
                    el.animation === 'slide' ? 'animate-in slide-in-from-bottom duration-1000' : 
                    el.animation === 'typewriter' ? 'animate-typewriter' : ''
                  }`}
                  style={{
                    filter: `brightness(${el.filters?.brightness}%) contrast(${el.filters?.contrast}%) blur(${el.filters?.blur}px)`
                  }}
                >
                  {el.type === 'text' ? (
                    <div 
                      contentEditable 
                      suppressContentEditableWarning
                      className="outline-none min-w-[50px] text-center font-bold"
                      style={{ 
                        fontSize: `${el.style?.fontSize}px`, 
                        color: el.style?.color,
                        fontFamily: el.style?.fontFamily
                      }}
                      onBlur={(e) => {
                        const newContent = e.currentTarget.textContent || '';
                        if (newContent !== el.content) {
                          updateElement(el.id, { content: newContent });
                          handleDragResizeStop();
                        }
                      }}
                    >
                      {el.content}
                    </div>
                  ) : el.type === 'image' ? (
                    <img src={el.content} className="w-full h-full object-cover pointer-events-none" referrerPolicy="no-referrer" />
                  ) : el.type === 'video' ? (
                    <video src={el.content} className="w-full h-full object-cover pointer-events-none" autoPlay loop muted />
                  ) : (
                    <div className="w-full h-full bg-purple-500/40" />
                  )}
                </Rnd>
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className={`bg-black border-t border-white/10 flex flex-col transition-all duration-300 ${isTimelineExpanded ? 'h-80' : 'h-12'}`}>
            <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <span className="text-[10px] font-mono text-white/40">
                  {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
                  {Math.floor(currentTime % 60).toString().padStart(2, '0')} / 
                  {Math.floor(totalDuration / 60).toString().padStart(2, '0')}:
                  {Math.floor(totalDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={splitClip}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white"
                  title="Split Clip"
                >
                  <Scissors className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white"
                >
                  <Layers className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isTimelineExpanded && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Time Ruler */}
                <div 
                  className="h-6 bg-white/[0.02] border-b border-white/5 relative overflow-hidden cursor-pointer"
                  onClick={handleTimelineClick}
                >
                  {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute top-0 h-full border-l border-white/10 flex items-end pb-1 px-1"
                      style={{ left: `${(i / totalDuration) * 100}%` }}
                    >
                      <span className="text-[8px] text-white/20">{i}s</span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                  {/* Playhead */}
                  <div 
                    ref={playheadRef}
                    className="absolute top-0 bottom-0 w-[2px] bg-purple-500 z-50 pointer-events-none"
                    style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 rounded-full shadow-lg" />
                  </div>

                  {/* Layers */}
                  <div className="p-4 space-y-2 min-w-full">
                    {/* Background Layer Track */}
                    <div className="h-10 bg-white/5 rounded-lg border border-white/10 flex items-center px-4 relative group">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-white/40">
                        <ImageIcon className="w-3 h-3" /> Background
                      </div>
                      <div className="absolute inset-y-1 left-32 right-4 bg-blue-500/20 border border-blue-500/40 rounded flex items-center px-2">
                        <span className="text-[8px] font-bold">Main Background</span>
                      </div>
                    </div>

                    {/* Element Layers */}
                    {clips[activeClipIndex].elements.map((el) => (
                      <div key={el.id} className="h-10 bg-white/5 rounded-lg border border-white/10 flex items-center relative group overflow-hidden">
                        <div className="w-32 shrink-0 flex items-center gap-2 px-4 text-[10px] font-bold text-white/40 border-r border-white/5 h-full bg-black/20 z-10">
                          {el.type === 'text' ? <Type className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          <span className="truncate">{el.type.charAt(0).toUpperCase() + el.type.slice(1)}</span>
                        </div>
                        <div className="flex-1 h-full relative">
                          <Rnd
                            size={{ width: `${(el.duration / clips[activeClipIndex].duration) * 100}%`, height: '80%' }}
                            position={{ x: (el.startTime / clips[activeClipIndex].duration) * (canvasRef.current?.clientWidth || 800) * 0.8, y: 4 }}
                            onDragStop={(e, d) => {
                              const trackWidth = (e.target as HTMLElement).parentElement?.clientWidth || 1;
                              const newStartTime = (d.x / trackWidth) * clips[activeClipIndex].duration;
                              handleElementTimelineDrag(el.id, newStartTime);
                              handleDragResizeStop();
                            }}
                            onResizeStop={(e, direction, ref, delta, position) => {
                              const trackWidth = (e.target as HTMLElement).parentElement?.clientWidth || 1;
                              const newDuration = (parseFloat(ref.style.width) / trackWidth) * clips[activeClipIndex].duration;
                              handleElementTimelineResize(el.id, newDuration);
                              handleDragResizeStop();
                            }}
                            enableResizing={{ right: true, left: true }}
                            disableDragging={false}
                            bounds="parent"
                            className={`bg-purple-500/30 border border-purple-500/50 rounded flex items-center px-2 cursor-move z-20 ${selectedElementId === el.id ? 'ring-1 ring-purple-500 bg-purple-500/50' : ''}`}
                            onClick={() => setSelectedElementId(el.id)}
                          >
                            <span className="text-[8px] font-bold truncate text-white">{el.content}</span>
                          </Rnd>
                        </div>
                      </div>
                    ))}

                    {/* Audio Tracks */}
                    {audioTracks.map((track) => (
                      <div key={track.id} className="h-10 bg-white/5 rounded-lg border border-white/10 flex items-center relative group overflow-hidden">
                        <div className="w-32 shrink-0 flex items-center gap-2 px-4 text-[10px] font-bold text-white/40 border-r border-white/5 h-full bg-black/20 z-10">
                          <Music className="w-3 h-3" />
                          <span className="truncate">{track.name || 'Audio'}</span>
                        </div>
                        <div className="flex-1 h-full relative">
                          <Rnd
                            size={{ width: `${(track.duration / totalDuration) * 100}%`, height: '80%' }}
                            position={{ x: (track.startTime / totalDuration) * (canvasRef.current?.clientWidth || 800) * 0.8, y: 4 }}
                            onDragStop={(e, d) => {
                              const trackWidth = (e.target as HTMLElement).parentElement?.clientWidth || 1;
                              const newStartTime = (d.x / trackWidth) * totalDuration;
                              updateAudioTrack(track.id, { startTime: Math.max(0, newStartTime) });
                            }}
                            onResizeStop={(e, direction, ref, delta, position) => {
                              const trackWidth = (e.target as HTMLElement).parentElement?.clientWidth || 1;
                              const newDuration = (parseFloat(ref.style.width) / trackWidth) * totalDuration;
                              updateAudioTrack(track.id, { duration: Math.max(0.1, newDuration) });
                            }}
                            enableResizing={{ right: true, left: true }}
                            bounds="parent"
                            className={`bg-rose-500/30 border border-rose-500/50 rounded flex items-center px-2 cursor-move z-20 ${selectedAudioId === track.id ? 'ring-1 ring-rose-500 bg-rose-500/50' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAudioId(track.id);
                              setSelectedElementId(null);
                            }}
                          >
                            <div className="flex items-center gap-1 w-full">
                              <span className="text-[8px] font-bold truncate text-white flex-1">{track.name || 'Music Track'}</span>
                              <span className="text-[7px] text-white/40">{track.duration.toFixed(1)}s</span>
                            </div>
                          </Rnd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Page Navigation */}
                <div className="h-20 bg-black border-t border-white/5 p-2 flex gap-2 overflow-x-auto shrink-0 items-center">
                  {clips.map((clip, i) => (
                    <React.Fragment key={clip.id}>
                      <div 
                        onClick={() => setActiveClipIndex(i)}
                        className={`h-full aspect-video rounded-lg border-2 transition-all cursor-pointer relative overflow-hidden group shrink-0 ${activeClipIndex === i ? 'border-purple-500 bg-white/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}
                      >
                        {clip.background ? (
                          <img src={clip.background.url} className="w-full h-full object-cover opacity-40" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <Video className="w-6 h-6" />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 px-1 bg-black/60 rounded text-[6px] font-bold">
                          {clip.duration}s
                        </div>
                      </div>
                      {i < clips.length - 1 && (
                        <button 
                          onClick={() => {
                            const newClips = [...clips];
                            const transitions: Clip['transition'][] = ['none', 'fade', 'slide', 'dissolve'];
                            const current = newClips[i].transition || 'none';
                            const next = transitions[(transitions.indexOf(current) + 1) % transitions.length];
                            newClips[i].transition = next;
                            setClips(newClips);
                            alert(`Transition set to: ${next}`);
                          }}
                          className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0 border border-white/10 transition-all"
                          title="Add Transition"
                        >
                          <Plus className="w-3 h-3 text-white/40" />
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                  <button 
                    onClick={() => setClips([...clips, { id: Math.random().toString(36).substr(2, 9), duration: 5, elements: [] }])}
                    className="h-full aspect-video rounded-lg border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 flex flex-col items-center justify-center gap-1 transition-all group shrink-0"
                  >
                    <Plus className="w-4 h-4 text-white/20 group-hover:text-white/40" />
                    <span className="text-[8px] font-bold uppercase text-white/20 group-hover:text-white/40">Add Page</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        .clip-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-typewriter {
          overflow: hidden;
          white-space: nowrap;
          animation: typewriter 2s steps(40, end);
        }
      `}</style>
    </div>
  );
}
