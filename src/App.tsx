import { useState, useRef, useEffect } from 'react';
import {
  Video,
  FileText,
  Image as ImageIcon,
  Type,
  ArrowRightLeft,
  Sparkles,
  Download,
  Loader2,
  Upload,
  Play,
  RefreshCw,
  ChevronRight,
  Zap,
  Layout,
  Grid,
  Trash2,
  Music,
  Send,
  Plus,
  ArrowLeft,
  Mic,
  FileArchive,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import * as mammoth from 'mammoth';
import { generateText, generateImage, generateVideo, analyzeMedia, generateAssistantResponse, detectIntent } from './lib/gemini';
import { generateGemmaResponse } from './lib/bytez';
import { generateTextToVideoPicsart, generateImageToVideoPicsart, generateTextToAudioPicsart } from './lib/picsart';
import AIAssistant from './components/AIAssistant';
import VideoEditor from './components/VideoEditor';
import VoiceCommand from './components/VoiceCommand';
import VideoStream from './components/VideoStream';
import FileConverter from './components/FileConverter';
import { removeBackground } from '@imgly/background-removal';
import PdfCraftApp from '../pdfcraft-pro/src/App';
import AuthModal from './components/AuthModal';
import { onAuthStateChange, logoutUser } from './services/authService';
import { getUserProfile, UserProfile } from './services/profileService';

type Mode = 'text-to-video' | 'text-to-script' | 'text-to-prompt' | 'text-to-image' | 'image-to-text' | 'video-to-text' | 'image-to-video' | 'settings' | 'text-to-code' | 'ai-assistant' | 'gemma-chat' | 'text-to-pdf' | 'word-to-pdf' | 'image-merger' | 'bg-remover' | 'text-to-song' | 'watermark-remover' | 'pdf-editor' | 'text-to-video-picsart' | 'image-to-video-picsart' | 'text-to-audio-picsart';

interface HistoryItem {
  id: string;
  mode: Mode;
  input: string;
  output: string;
  timestamp: number;
  type: 'text' | 'image' | 'video' | 'pdf';
}

export default function App() {
  const [mode, setMode] = useState<Mode>('ai-assistant');
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'text' | 'image' | 'video' | 'pdf'>('text');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [status, setStatus] = useState('');
  const [manualKey, setManualKey] = useState(localStorage.getItem('OMNIGEN_CUSTOM_KEY') || '');
  const [aimlKey, setAimlKey] = useState(localStorage.getItem('OMNIGEN_AIML_KEY') || '');
  const [json2videoKey, setJson2videoKey] = useState(localStorage.getItem('OMNIGEN_JSON2VIDEO_KEY') || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aimlSaveSuccess, setAimlSaveSuccess] = useState(false);
  const [json2videoSaveSuccess, setJson2videoSaveSuccess] = useState(false);
  const [previewTab, setPreviewTab] = useState<'code' | 'preview'>('code');
  const [personality, setPersonality] = useState('rational');
  const [showAssistantPage, setShowAssistantPage] = useState(false);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [showVoiceCommand, setShowVoiceCommand] = useState(false);
  const [showVideoStream, setShowVideoStream] = useState(false);
  const [showFileConverter, setShowFileConverter] = useState(false);
  const [showPdfConverter, setShowPdfConverter] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [mergedImages, setMergedImages] = useState<string[]>([]);
  
  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const subscription = onAuthStateChange(async (sessionUser) => {
      setUser(sessionUser);
      if (sessionUser) {
        try {
          const userProfile = await getUserProfile(sessionUser.id);
          setProfile(userProfile);
        } catch (err) {
          console.error("Failed to fetch profile", err);
        }
      } else {
        setProfile(null);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/pdf-converter') {
        setShowPdfConverter(true);
        setShowAssistantPage(false);
        setShowVideoEditor(false);
        setShowVoiceCommand(false);
        setShowVideoStream(false);
        setShowFileConverter(false);
      } else if (path === '/file-converter') {
        setShowFileConverter(true);
        setShowPdfConverter(false);
        setShowAssistantPage(false);
        setShowVideoEditor(false);
        setShowVoiceCommand(false);
        setShowVideoStream(false);
      } else {
        setShowPdfConverter(false);
        setShowFileConverter(false);
      }
    };

    if (window.location.pathname === '/pdf-converter') {
      setShowPdfConverter(true);
      setShowAssistantPage(false);
      setShowVideoEditor(false);
      setShowVoiceCommand(false);
      setShowVideoStream(false);
      setShowFileConverter(false);
    } else if (window.location.pathname === '/file-converter') {
      setShowFileConverter(true);
      setShowPdfConverter(false);
      setShowAssistantPage(false);
      setShowVideoEditor(false);
      setShowVoiceCommand(false);
      setShowVideoStream(false);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [steps, setSteps] = useState<{ label: string, status: 'pending' | 'completed' | 'current' }[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [intent, setIntent] = useState<any>(null);

  const handleSaveManualKey = () => {
    localStorage.setItem('OMNIGEN_CUSTOM_KEY', manualKey);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveAimlKey = () => {
    localStorage.setItem('OMNIGEN_AIML_KEY', aimlKey);
    setAimlSaveSuccess(true);
    setTimeout(() => setAimlSaveSuccess(false), 3000);
  };

  const handleSaveJson2videoKey = () => {
    localStorage.setItem('OMNIGEN_JSON2VIDEO_KEY', json2videoKey);
    setJson2videoSaveSuccess(true);
    setTimeout(() => setJson2videoSaveSuccess(false), 3000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractCode = (markdown: string) => {
    const match = markdown.match(/```(?:[\w]*\n)?([\s\S]*?)```/);
    return match ? match[1].trim() : markdown;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      if (mode === 'image-merger') {
        const newFiles = Array.from(selectedFiles);
        const newPreviews: string[] = [];
        newFiles.forEach(f => {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews.push(reader.result as string);
            if (newPreviews.length === newFiles.length) {
              setMergedImages(newPreviews);
            }
          };
          reader.readAsDataURL(f);
        });
      } else {
        const selectedFile = selectedFiles[0];
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleGenerate = async (overrideInput?: string, overrideMode?: Mode) => {
    const currentInput = overrideInput || input;
    if (!currentInput && !file) return;

    setLoading(true);
    setResult(null);
    setResultType('text');
    setSteps([]);

    try {
      let activeMode = overrideMode || mode;

      // Intent Detection
      setStatus('Detecting intent...');
      const detected = await detectIntent(currentInput, file ? { name: file.name, type: file.type } : undefined);
      setIntent(detected);

      if (!overrideMode && detected.confidence > 0.7) {
        activeMode = detected.tool as Mode;
        setMode(activeMode);
      }

      setSteps([
        { label: 'Intent Detected', status: 'completed' },
        { label: `Activating ${activeMode}`, status: 'current' }
      ]);

      let output = '';
      let outputType: 'text' | 'image' | 'video' | 'pdf' = 'text';

      switch (activeMode) {
        case 'text-to-image':
          setStatus('Painting your imagination...');
          output = await generateImage(input, preview || undefined);
          outputType = 'image';
          break;
        case 'text-to-video':
          setStatus('Directing your scene (this may take a minute)...');
          output = await generateVideo(input);
          outputType = 'video';
          break;
        case 'text-to-script':
          setStatus('Writing the screenplay...');
          output = await generateText(input, "You are a professional screenwriter. Write a detailed script based on the following prompt. Include scene headings, character names, dialogue, and parentheticals.");
          outputType = 'text';
          break;
        case 'text-to-prompt':
          setStatus('Enhancing your vision...');
          output = await generateText(input, "You are a prompt engineering expert. Take the user's simple idea and turn it into a highly detailed, descriptive prompt for a high-end generative AI model. Focus on lighting, composition, style, and atmosphere.");
          outputType = 'text';
          break;
        case 'text-to-code':
          setStatus('Architecting the solution...');
          output = await generateText(input, "You are an expert software engineer. Write clean, efficient, and well-documented code based on the user's request. Include explanations and usage examples where appropriate. Wrap code in markdown blocks.");
          outputType = 'text';
          break;
        case 'image-to-text':
          setStatus('Analyzing the visual...');
          if (preview) {
            output = await analyzeMedia(input || "Describe this image in detail.", preview, file?.type || 'image/jpeg');
          }
          outputType = 'text';
          break;
        case 'video-to-text':
          setStatus('Watching and transcribing...');
          if (preview) {
            output = await analyzeMedia(input || "Describe what happens in this video.", preview, file?.type || 'video/mp4');
          }
          outputType = 'text';
          break;
        case 'image-to-video':
          setStatus('Bringing the image to life...');
          output = await generateVideo(input || "Animate this scene naturally", preview || undefined);
          outputType = 'video';
          break;
        case 'ai-assistant':
          setStatus('Assistant is thinking...');
          output = await generateAssistantResponse(input, personality, preview || undefined, file?.type);
          outputType = 'text';
          break;
        case 'gemma-chat':
          setStatus('Gemma is thinking...');
          output = await generateGemmaResponse(input);
          outputType = 'text';
          break;
        case 'text-to-pdf':
          setStatus('Generating PDF document...');
          const doc = new jsPDF();
          const splitText = doc.splitTextToSize(input, 180);
          doc.text(splitText, 10, 10);
          const pdfBlob = doc.output('blob');
          output = URL.createObjectURL(pdfBlob);
          outputType = 'pdf';
          break;
        case 'word-to-pdf':
          setStatus('Converting Word to PDF...');
          if (!file) throw new Error("Please upload a .docx file");
          const arrayBuffer = await file.arrayBuffer();
          const { value: text } = await mammoth.extractRawText({ arrayBuffer });
          const wordDoc = new jsPDF();
          const wordSplitText = wordDoc.splitTextToSize(text, 180);
          wordDoc.text(wordSplitText, 10, 10);
          const wordPdfBlob = wordDoc.output('blob');
          output = URL.createObjectURL(wordPdfBlob);
          outputType = 'pdf';
          break;
        case 'image-merger':
          setStatus('Merging your images...');
          if (mergedImages.length < 2) throw new Error("Please upload at least 2 images");
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const loadedImages = await Promise.all(mergedImages.map(src => {
            return new Promise<HTMLImageElement>((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => resolve(img);
              img.src = src;
            });
          }));
          canvas.width = loadedImages.reduce((acc, img) => acc + img.width, 0);
          canvas.height = Math.max(...loadedImages.map(img => img.height));
          let currentX = 0;
          loadedImages.forEach(img => {
            ctx?.drawImage(img, currentX, 0);
            currentX += img.width;
          });
          output = canvas.toDataURL('image/png');
          outputType = 'image';
          break;
        case 'bg-remover':
          setStatus('Removing background (AI-powered)...');
          if (!preview) throw new Error("Please upload an image");
          const bgRemovedBlob = await removeBackground(preview);
          output = URL.createObjectURL(bgRemovedBlob);
          outputType = 'image';
          break;
        case 'text-to-song':
          setStatus('Composing AI melody...');
          // Basic Web Audio API melody generation
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const duration = 5;
          const sampleRate = audioCtx.sampleRate;
          const frameCount = sampleRate * duration;
          const audioBuffer = audioCtx.createBuffer(1, frameCount, sampleRate);
          const channelData = audioBuffer.getChannelData(0);
          for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            // Simple FM synthesis based on input
            const freq = 220 + (input.length % 440);
            channelData[i] = Math.sin(2 * Math.PI * freq * t + Math.sin(2 * Math.PI * 5 * t));
          }
          // Convert AudioBuffer to WAV blob
          const wavBlob = await new Promise<Blob>((resolve) => {
            const worker = new Worker(URL.createObjectURL(new Blob([`
              self.onmessage = function(e) {
                const buffer = e.data;
                const length = buffer.length * 2 + 44;
                const view = new DataView(new ArrayBuffer(length));
                function writeString(s, offset) {
                  for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
                }
                writeString('RIFF', 0);
                view.setUint32(4, length - 8, true);
                writeString('WAVE', 8);
                writeString('fmt ', 12);
                view.setUint32(16, 16, true);
                view.setUint16(20, 1, true);
                view.setUint16(22, 1, true);
                view.setUint32(24, 44100, true);
                view.setUint32(28, 44100 * 2, true);
                view.setUint16(32, 2, true);
                view.setUint16(34, 16, true);
                writeString('data', 36);
                view.setUint32(40, length - 44, true);
                for (let i = 0; i < buffer.length; i++) {
                  const s = Math.max(-1, Math.min(1, buffer[i]));
                  view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                }
                self.postMessage(new Blob([view], { type: 'audio/wav' }));
              };
            `], { type: 'application/javascript' })));
            worker.onmessage = (e) => resolve(e.data);
            worker.postMessage(channelData);
          });
          output = URL.createObjectURL(wavBlob);
          outputType = 'video'; // Use video type for audio playback in the video tag
          break;
        case 'watermark-remover':
          setStatus('Removing watermark (AI Inpainting)...');
          if (!preview) throw new Error("Please upload a file");
          // Simple demo: blur the center area where watermarks usually are
          const wmCanvas = document.createElement('canvas');
          const wmCtx = wmCanvas.getContext('2d');
          const wmImg = new Image();
          wmImg.crossOrigin = "anonymous";
          await new Promise((resolve) => {
            wmImg.onload = resolve;
            wmImg.src = preview;
          });
          wmCanvas.width = wmImg.width;
          wmCanvas.height = wmImg.height;
          wmCtx?.drawImage(wmImg, 0, 0);
          wmCtx!.filter = 'blur(10px)';
          wmCtx?.drawImage(wmImg, wmImg.width * 0.7, wmImg.height * 0.8, wmImg.width * 0.3, wmImg.height * 0.2, wmImg.width * 0.7, wmImg.height * 0.8, wmImg.width * 0.3, wmImg.height * 0.2);
          output = wmCanvas.toDataURL('image/png');
          outputType = 'image';
          break;
        case 'pdf-editor':
          setStatus('Opening PDF Editor...');
          // For now, we'll just show the PDF and allow adding text via input
          if (!file) throw new Error("Please upload a PDF");
          output = URL.createObjectURL(file);
          outputType = 'pdf';
          break;
        case 'text-to-video-picsart':
          setStatus('Generating Video with Picsart...');
          const t2vResult = await generateTextToVideoPicsart(input);
          output = `\`\`\`json\n${t2vResult}\n\`\`\``;
          outputType = 'text';
          break;
        case 'image-to-video-picsart':
          setStatus('Animating Image with Picsart...');
          if (!file) throw new Error("Please upload an image file");
          const i2vResult = await generateImageToVideoPicsart(file, input);
          output = `\`\`\`json\n${i2vResult}\n\`\`\``;
          outputType = 'text';
          break;
        case 'text-to-audio-picsart':
          setStatus('Generating Audio with Picsart...');
          const t2aResult = await generateTextToAudioPicsart(input);
          if (t2aResult?.data?.url) {
            output = t2aResult.data.url;
            outputType = 'video';
          } else {
            output = `\`\`\`json\n${JSON.stringify(t2aResult, null, 2)}\n\`\`\``;
            outputType = 'text';
          }
          break;
      }

      setResult(output);
      setResultType(outputType);
      setHistory(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        mode: activeMode,
        input: currentInput || (file ? file.name : ''),
        output,
        timestamp: Date.now(),
        type: outputType
      }, ...prev]);
    } catch (error) {
      console.error(error);
      setResult("Error: " + (error instanceof Error ? error.message : "Something went wrong"));
      setResultType('text');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const modes = [
    { id: 'text-to-image', label: 'Text to Image', icon: ImageIcon, color: 'bg-purple-500' },
    { id: 'text-to-video', label: 'Text to Video', icon: Video, color: 'bg-blue-500' },
    { id: 'text-to-script', label: 'Text to Script', icon: FileText, color: 'bg-emerald-500' },
    { id: 'text-to-prompt', label: 'Text to Prompt', icon: Sparkles, color: 'bg-amber-500' },
    { id: 'text-to-code', label: 'Text to Code', icon: FileText, color: 'bg-cyan-500' },
    { id: 'image-to-text', label: 'Image to Text', icon: ArrowRightLeft, color: 'bg-rose-500' },
    { id: 'video-to-text', label: 'Video to Text', icon: Zap, color: 'bg-indigo-500' },
    { id: 'image-to-video', label: 'Image to Video', icon: Video, color: 'bg-orange-500' },
    { id: 'gemma-chat', label: 'Gemma-4 Chat (Bytez)', icon: Zap, color: 'bg-yellow-500' },
    { id: 'text-to-pdf', label: 'Text to PDF', icon: FileText, color: 'bg-red-500' },
    { id: 'word-to-pdf', label: 'Word to PDF', icon: FileText, color: 'bg-blue-600' },
    { id: 'video-editor', label: 'Video Editor (Canva Style)', icon: Video, color: 'bg-purple-600', action: () => setShowVideoEditor(true) },
    { id: 'image-merger', label: 'Image Merger', icon: Grid, color: 'bg-cyan-600' },
    { id: 'bg-remover', label: 'Background Remover', icon: Sparkles, color: 'bg-indigo-600' },
    { id: 'text-to-song', label: 'Text to Song', icon: Play, color: 'bg-rose-600' },
    { id: 'watermark-remover', label: 'Watermark Remover', icon: Trash2, color: 'bg-red-600' },
    { id: 'pdf-editor', label: 'PDF Editor', icon: FileText, color: 'bg-amber-600' },
    { id: 'video-stream', label: 'Video Stream', icon: Video, color: 'bg-teal-500', action: () => setShowVideoStream(true) },
    { id: 'ai-assistant', label: 'OmniGen AI (Assistant)', icon: Sparkles, color: 'bg-pink-500', action: () => setShowAssistantPage(true) },
    { id: 'settings', label: 'Settings & API', icon: RefreshCw, color: 'bg-gray-500' },
  ];

  if (showAssistantPage) {
    return <AIAssistant onBack={() => setShowAssistantPage(false)} />;
  }

  if (showVideoEditor) {
    return <VideoEditor onBack={() => setShowVideoEditor(false)} />;
  }

  if (showVoiceCommand) {
    return <VoiceCommand onBack={() => setShowVoiceCommand(false)} />;
  }

  if (showVideoStream) {
    return <VideoStream onBack={() => setShowVideoStream(false)} />;
  }



  if (showPdfConverter) {
    return (
      <div className="relative h-screen w-full bg-white overflow-hidden flex flex-col">
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[60] fixed">
          <button
            onClick={() => {
              setShowPdfConverter(false);
              window.history.pushState({}, '', '/');
            }}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-full transition-all text-sm font-bold shadow-2xl"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to OmniGen AI
          </button>
        </div>
        <div className="flex-1 overflow-y-auto h-full w-full">
          <PdfCraftApp />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer border border-transparent hover:border-purple-500/20 px-2 py-1 rounded-xl transition-all" onClick={() => { setShowAssistantPage(false); setShowVideoEditor(false); setShowVoiceCommand(false); setShowVideoStream(false); setShowFileConverter(false); setShowPdfConverter(false); setMode('ai-assistant'); window.history.pushState({}, '', '/'); }}>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">OmniGen AI</span>
            </div>

            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl transition-all text-xs font-bold ${showSidebar
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
                }`}
              title="Toggle History"
            >
              <Layout className="w-4 h-4" />
              <span>{showSidebar ? 'Hide History' : 'Show History'}</span>
            </button>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium text-white/60">
            <button
              onClick={() => setShowAssistantPage(true)}
              className="hover:text-purple-400 transition-colors flex items-center gap-2 font-semibold text-purple-400/90"
            >
              <Sparkles className="w-4 h-4 animate-pulse text-purple-400" /> AI Assistant
            </button>

            <div className="relative group">
              <button className="hover:text-white transition-colors flex items-center gap-2 text-white/60">
                <Grid className="w-4 h-4" /> Tools <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-0 mt-4 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-2 gap-1 z-50">
                <button
                  onClick={() => setShowVideoEditor(true)}
                  className="hover:bg-white/10 transition-colors flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                >
                  <Video className="w-4 h-4 text-purple-400" /> Video Editor
                </button>
                <button
                  onClick={() => setShowVoiceCommand(true)}
                  className="hover:bg-white/10 transition-colors flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                >
                  <Mic className="w-4 h-4 text-blue-400" /> Voice Command
                </button>
                <button
                  onClick={() => setShowVideoStream(true)}
                  className="hover:bg-white/10 transition-colors flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                >
                  <Video className="w-4 h-4 text-emerald-400" /> Video Stream
                </button>
                <button
                  onClick={() => {
                    setShowFileConverter(true);
                    setShowAssistantPage(false);
                    setShowVideoEditor(false);
                    setShowVoiceCommand(false);
                    setShowVideoStream(false);
                    setShowPdfConverter(false);
                    window.history.pushState({}, '', '/file-converter');
                  }}
                  className="hover:bg-white/10 transition-colors flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                >
                  <FileArchive className="w-4 h-4 text-amber-400" /> File Converter
                </button>
                <button
                  onClick={() => {
                    setShowPdfConverter(true);
                    setShowAssistantPage(false);
                    setShowVideoEditor(false);
                    setShowVoiceCommand(false);
                    setShowVideoStream(false);
                    setShowFileConverter(false);
                    window.history.pushState({}, '', '/pdf-converter');
                  }}
                  className="hover:bg-white/10 transition-colors flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                >
                  <FileText className="w-4 h-4 text-rose-400" /> PDF Converter
                </button>
              </div>
            </div>

            <button
              onClick={() => setMode('settings')}
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Settings
            </button>
            <button
              onClick={() => setMode('settings')}
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <Grid className="w-4 h-4" /> API
            </button>
            {user ? (
              <div className="relative group">
                <button className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-full text-xs font-bold hover:bg-white/20 transition-colors flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-[10px] text-white">
                    {profile?.full_name ? profile.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                  {profile?.full_name || user.email.split('@')[0]}
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-2 gap-1 z-50">
                  <button
                    onClick={async () => {
                      await logoutUser();
                    }}
                    className="hover:bg-red-500/20 text-red-400 transition-colors flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold hover:bg-white/90 transition-colors"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat History Sidebar */}
        <aside className={`border-r border-white/10 bg-black/40 transition-all duration-300 flex flex-col overflow-hidden ${showSidebar ? 'w-72 opacity-100 border-r border-white/10' : 'w-0 opacity-0 border-r-transparent border-r-0'
          }`}>
          <div className="w-72 flex flex-col h-full shrink-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Recent History</h2>
              <button
                onClick={() => { setResult(null); setInput(''); setFile(null); setPreview(null); }}
                className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-purple-400 transition-all border border-white/5"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="px-3 py-10 text-center">
                  <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">No history yet</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => { setResult(item.output); setResultType(item.type); setMode(item.mode); }}
                    className={`p-3 rounded-xl transition-all cursor-pointer group border ${result === item.output
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded bg-purple-500/20 flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                      </div>
                      <span className="text-[9px] font-bold text-white/30 truncate uppercase tracking-tighter">{item.mode}</span>
                    </div>
                    <p className="text-xs font-medium truncate group-hover:text-purple-400 transition-colors">{item.input}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Modals */}
        {showAuthModal && (
          <AuthModal 
            onClose={() => setShowAuthModal(false)} 
            onSuccess={() => setShowAuthModal(false)} 
          />
        )}

        {/* Main Interface */}
        <main className="flex-1 flex flex-col w-full relative overflow-hidden h-full">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto w-full p-6 pb-72">

              {showFileConverter ? (
                <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden flex flex-col relative group h-full min-h-[600px]">
                  <FileConverter onBack={() => { setShowFileConverter(false); window.history.pushState({}, '', '/'); }} />
                </div>
              ) : mode === 'settings' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">Settings & API</h2>
                        <p className="text-white/40 text-xs">Manage your API keys and application preferences.</p>
                      </div>
                      <button
                        onClick={() => setMode('ai-assistant')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-bold text-white/80 hover:text-white pb-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Home</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Manual Key Entry</h3>
                            <p className="text-xs text-white/40">Paste your own Gemini API key</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <input
                            type="password"
                            value={manualKey}
                            onChange={(e) => setManualKey(e.target.value)}
                            placeholder="Enter your API key here..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                          />
                          <button
                            onClick={handleSaveManualKey}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${saveSuccess ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                          >
                            {saveSuccess ? 'Key Saved Successfully!' : 'Save Key to Local Storage'}
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">AIML API Key</h3>
                            <p className="text-xs text-white/40">For Claude Opus & other models via AIML API</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <input
                            type="password"
                            value={aimlKey}
                            onChange={(e) => setAimlKey(e.target.value)}
                            placeholder="Enter your AIML API key here..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                          />
                          <button
                            onClick={handleSaveAimlKey}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${aimlSaveSuccess ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                          >
                            {aimlSaveSuccess ? 'AIML Key Saved!' : 'Save AIML Key'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                </div>
              ) : (
                <>
                  {/* Output Area */}
                  <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden flex flex-col relative group">
                    <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-black/20">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                            {loading ? status : intent ? `Intent: ${intent.action}` : 'System Ready'}
                          </span>
                        </div>
                      </div>

                      {result && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = result;
                              link.download = `omnigen-${Date.now()}`;
                              link.click();
                            }}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
                          >
                            <Download className="w-3 h-3" /> Download
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {!result && !loading && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-6 max-w-md"
                          >
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto border border-white/5">
                              <Sparkles className="w-10 h-10 text-purple-400" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold">What can I do for you?</h3>
                              <p className="text-sm text-white/40 mt-3 leading-relaxed">
                                Upload a file or type a command. I'll automatically detect the best tool to handle your request.
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {['Remove background', 'Convert to PDF', 'Generate Image', 'Write Code', 'Convert File'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => {
                                    if (s === 'Convert File') {
                                      setShowFileConverter(true);
                                    } else {
                                      setInput(s);
                                    }
                                  }}
                                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold transition-all"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {loading && (
                          <div className="flex flex-col items-center gap-8">
                            <div className="relative">
                              <div className="w-32 h-32 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-purple-500 animate-pulse" />
                              </div>
                            </div>
                            <div className="space-y-4 text-center">
                              <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                {status}
                              </p>
                              <div className="flex gap-2 justify-center">
                                {steps.map((s, i) => (
                                  <div key={i} className={`h-1 w-8 rounded-full ${s.status === 'completed' ? 'bg-purple-500' : s.status === 'current' ? 'bg-purple-500/40 animate-pulse' : 'bg-white/10'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {result && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full h-full flex flex-col items-center justify-center"
                          >
                            {resultType === 'image' && <img src={result} className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10" referrerPolicy="no-referrer" />}
                            {resultType === 'video' && <video src={result} className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10" controls autoPlay loop />}
                            {resultType === 'pdf' && <iframe src={result} className="w-full h-full rounded-2xl border border-white/10 bg-white" title="PDF Preview" />}
                            {resultType === 'text' && (
                              <div className="w-full max-w-3xl prose prose-invert prose-purple overflow-y-auto custom-scrollbar pr-4">
                                <Markdown>{result}</Markdown>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Fixed Input Area */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-10 pb-6 px-6 pointer-events-none z-30">
                    <div className="max-w-4xl mx-auto w-full space-y-4 pointer-events-auto">
                      {preview && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-4 p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl w-fit"
                        >
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                            {file?.type?.includes('image') ? <img src={preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center bg-black"><FileText className="w-6 h-6 text-blue-400" /></div>}
                            <button onClick={() => { setPreview(null); setFile(null); }} className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full hover:bg-black"><Trash2 className="w-3 h-3 text-white" /></button>
                          </div>
                          <div className="flex flex-col justify-center pr-4">
                            <p className="text-[10px] font-bold truncate max-w-[150px]">{file?.name}</p>
                            <p className="text-[9px] text-white/40">Ready to process</p>
                          </div>
                        </motion.div>
                      )}

                      <div className="relative flex items-end gap-3">
                        <div className="flex-1 relative">
                          <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
                            placeholder="Message OmniGen AI..."
                            className="w-full bg-[#121212] border border-white/10 rounded-3xl px-6 py-4 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none min-h-[60px] max-h-[200px] shadow-2xl backdrop-blur-3xl pointer-events-auto custom-scrollbar"
                          />
                          <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            <button
                              onClick={() => setMode('text-to-video-picsart')}
                              title="Text to Video (Picsart)"
                              className={`p-2 hover:bg-white/10 rounded-xl transition-all ${mode === 'text-to-video-picsart' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white'}`}
                            >
                              <Video className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setMode('image-to-video-picsart')}
                              title="Image to Video (Picsart)"
                              className={`p-2 hover:bg-white/10 rounded-xl transition-all ${mode === 'image-to-video-picsart' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white'}`}
                            >
                              <ImageIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setMode('text-to-audio-picsart')}
                              title="Text to Audio (Picsart)"
                              className={`p-2 hover:bg-white/10 rounded-xl transition-all ${mode === 'text-to-audio-picsart' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white'}`}
                            >
                              <Music className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setShowFileConverter(true)}
                              title="File Converter"
                              className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                            >
                              <FileArchive className="w-5 h-5 text-amber-400" />
                            </button>
                            <button
                              onClick={() => {
                                setShowPdfConverter(true);
                                setShowAssistantPage(false);
                                setShowVideoEditor(false);
                                setShowVoiceCommand(false);
                                setShowVideoStream(false);
                                setShowFileConverter(false);
                                window.history.pushState({}, '', '/pdf-converter');
                              }}
                              title="PDF Converter"
                              className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                            >
                              <FileText className="w-5 h-5 text-rose-400" />
                            </button>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                            >
                              <Upload className="w-5 h-5" />
                            </button>
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        </div>
                        <button
                          onClick={() => handleGenerate()}
                          disabled={loading || (!input && !file)}
                          className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl font-bold hover:opacity-90 disabled:opacity-30 transition-all shadow-xl shadow-purple-500/20"
                        >
                          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-center text-white/20">OmniGen can make mistakes. Consider checking important information.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white/60" />
            </div>
            <span className="text-sm font-bold text-white/60">OmniGen AI</span>
          </div>
          <p className="text-[10px] text-white/30">© 2026 OmniGen AI. Powered by Google Gemini & Veo.</p>
          <div className="flex items-center gap-4 text-[10px] font-medium text-white/40">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
