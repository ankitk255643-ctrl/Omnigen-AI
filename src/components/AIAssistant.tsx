import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Send,
  Image as ImageIcon,
  X,
  Sparkles,
  Loader2,
  ArrowLeft,
  Volume2,
  Brain,
  Heart,
  Flame,
  Star,
  MoreVertical,
  Plus,
  Search,
  Download,
  Copy,
  Share2 as ShareIcon,
  Trash2,
  MessageSquare,
  MessageCircle,
  History as HistoryIcon,
  BookOpen,
  Box,
  Cpu,
  Layers,
  Microscope,
  FileOutput,
  Edit2,
  Eye,
  Code2,
  Play as PlayIcon,
  Square,
  Maximize2,
  FileText,
  FileArchive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { generateAssistantResponse } from '../lib/gemini';
import VideoStream from './VideoStream';
import ImageEnhancer from './ImageEnhancer';

const getRenderableCode = (markdown: string) => {
  const htmlMatch = markdown.match(/```html\n([\s\S]*?)```/i);
  const cssMatch = markdown.match(/```css\n([\s\S]*?)```/i);
  const jsMatch = markdown.match(/```(?:javascript|js)\n([\s\S]*?)```/i);

  let html = htmlMatch ? htmlMatch[1] : '';
  let css = cssMatch ? cssMatch[1] : '';
  let js = jsMatch ? jsMatch[1] : '';

  if (!html) {
    const genericMatch = markdown.match(/```\n([\s\S]*?)```/);
    if (genericMatch && genericMatch[1].trim().startsWith('<')) {
      html = genericMatch[1];
    } else if (markdown.trim().startsWith('<html') || markdown.trim().startsWith('<!DOCTYPE')) {
      html = markdown;
    }
  }

  // If html contains a full document and we also extracted css/js, we might inject them, 
  // but simpler to just wrap it if it doesn't look like a full document.
  if (html && html.toLowerCase().includes('<html')) {
    // If it's already a full HTML document, just return it directly (maybe append CSS/JS)
    // Actually, best to just return the whole thing and let the browser parse it.
    // We'll just replace </head> to inject css, and </body> to inject js if needed.
    let fullDoc = html;
    if (css) fullDoc = fullDoc.replace('</head>', `<style>${css}</style></head>`);
    if (js) fullDoc = fullDoc.replace('</body>', `<script>${js}</script></body>`);
    return fullDoc;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; }
          ${css}
        </style>
      </head>
      <body>
        ${html || '<div style="color: #666;">Waiting for valid HTML/CSS/JS code blocks...<br>Try asking: "Write a complete HTML application with snake game"</div>'}
        <script>${js}</script>
      </body>
    </html>
  `;
};

interface AIAssistantProps {
  onBack: () => void;
}

type Personality = 'emotional' | 'rational' | 'roaster' | 'flaunt';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  file?: { name: string, type: string, preview: string };
  tool?: string;
  isEdited?: boolean;
}

interface SelectedTool {
  id: string;
  label: string;
  icon: any;
  color: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  personality: Personality;
  lastUpdated: number;
}

export default function AIAssistant({ onBack }: AIAssistantProps) {
  const [input, setInput] = useState('');
  const [personality, setPersonality] = useState<Personality>('rational');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [selectedTools, setSelectedTools] = useState<SelectedTool[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<{ active: boolean; content: string; type: 'code' | 'simulation' }>({ active: false, content: '', type: 'code' });
  const [isRunning, setIsRunning] = useState(false);
  const [showVideoStream, setShowVideoStream] = useState(false);
  const [showImageEnhancer, setShowImageEnhancer] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('OMNIGEN_CHAT_SESSIONS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
          setPersonality(parsed[0].personality);
        } else {
          createNewChat();
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('OMNIGEN_CHAT_SESSIONS', JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Chat',
      messages: [],
      personality: 'rational',
      lastUpdated: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setPersonality('rational');
    setShowHistory(false);
    setShowMenu(false);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const handleToolAction = (toolId: string) => {
    // Open the file converter overlay directly
    if (toolId === 'converter') {
      setShowVideoStream(true);
      setShowToolsMenu(false);
      return;
    }

    // Open Image Enhancer overlay
    if (toolId === 'image-enhancer') {
      setShowImageEnhancer(true);
      setShowToolsMenu(false);
      return;
    }

    const tool = [
      { id: 'image', label: 'Image', icon: ImageIcon, color: 'text-blue-400' },
      { id: 'research', label: 'Research', icon: Microscope, color: 'text-purple-400' },
      { id: 'learning', label: 'Learning', icon: BookOpen, color: 'text-emerald-400' },
      { id: 'lab', label: 'Lab', icon: Box, color: 'text-amber-400' },
      { id: 'converter', label: 'Converter', icon: FileOutput, color: 'text-blue-400' },
      { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-400' },
    ].find(t => t.id === toolId);

    if (tool && !selectedTools.find(t => t.id === toolId)) {
      setSelectedTools(prev => [...prev, tool]);
    }
    setShowToolsMenu(false);
  };

  const removeTool = (id: string) => {
    setSelectedTools(prev => prev.filter(t => t.id !== id));
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      if (newSessions.length > 0) {
        setActiveSessionId(newSessions[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const downloadChat = (session: ChatSession) => {
    const content = session.messages.map(m => `[${m.role.toUpperCase()}] (${new Date(m.timestamp).toLocaleString()})\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/\s+/g, '_')}_chat.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareChat = async (session: ChatSession) => {
    const text = session.messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    if (navigator.share) {
      try {
        await navigator.share({
          title: session.title,
          text: text,
        });
      } catch (e) {
        console.error("Error sharing", e);
      }
    } else {
      copyToClipboard(text);
      alert("Sharing not supported on this browser. Chat copied to clipboard instead.");
    }
  };

  const speakResponse = (text: string) => {
    if (!text || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    setIsPaused(false);

    // Strip emojis and markdown characters before speaking
    const cleanText = text
      .replace(/[#*`]/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F093}\u{1F191}-\u{1F251}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}]/gu, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    // Find suitable voice based on personality
    const voices = window.speechSynthesis.getVoices();
    const isMale = personality === 'rational' || personality === 'roaster';

    // Try to find a hi-IN voice first
    let selectedVoice = voices.find(v => (v.lang || "").includes('hi-IN') &&
      (isMale ? ((v.name || "").toLowerCase().includes('male') || (v.name || "").toLowerCase().includes('google')) : (v.name || "").toLowerCase().includes('female')));

    // Fallback to any hi-IN voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => (v.lang || "").includes('hi-IN'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      utterance.lang = 'hi-IN';
    }

    // Adjust pitch and rate for simulated personality
    if (personality === 'roaster') {
      utterance.pitch = 0.7; // Deep, slightly aggressive
      utterance.rate = 1.1; // Fast
    } else if (personality === 'rational') {
      utterance.pitch = 0.9; // Serious
      utterance.rate = 1.0;
    } else if (personality === 'emotional') {
      utterance.pitch = 1.1; // Soft, high
      utterance.rate = 0.9; // Slow, caring
    } else if (personality === 'flaunt') {
      utterance.pitch = 1.3; // Very high, dramatic
      utterance.rate = 0.8; // Slow, "sensual" style
    }

    window.speechSynthesis.speak(utterance);
  };

  const togglePlayback = () => {
    if (typeof window === 'undefined') return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  useEffect(() => {
    // Cleanup: Stop speaking when leaving the page
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const lastMessage = activeSession?.messages[activeSession.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && !loading) {
      // Only auto-speak if it's a fresh message (within last 2 seconds)
      if (Date.now() - lastMessage.timestamp < 2000) {
        speakResponse(lastMessage.content);
      }
    }
  }, [activeSession?.messages.length, loading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN'; // Hinglish friendly

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleGenerate(transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [personality, preview, file, input]); // Added input to dependencies just in case, though overrideInput is used

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleGenerate = async (overrideInput?: string) => {
    const currentInput = overrideInput || input;
    if (!currentInput && !file) return;

    // Handle "stop" command
    if ((currentInput || "").toLowerCase().trim() === 'stop') {
      window.speechSynthesis.cancel();
      setLoading(false);
      setIsRunning(false);
      setInput('');
      return;
    }

    const userMessageData = {
      file: file ? { name: file.name, type: file.type, preview: preview || '' } : undefined,
      tool: selectedTools.map(t => t.id).join(',')
    };

    if (editingMessageId) {
      // Logic to resend edited prompt - truncate history after this message
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const msgIndex = s.messages.findIndex(m => m.id === editingMessageId);
          if (msgIndex === -1) return s;

          const newMessages = s.messages.slice(0, msgIndex);
          const editedMsg = { ...s.messages[msgIndex], content: currentInput, isEdited: true, ...userMessageData };

          return {
            ...s,
            messages: [...newMessages, editedMsg],
            lastUpdated: Date.now()
          };
        }
        return s;
      }));
      setEditingMessageId(null);
    } else {
      const userMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'user',
        content: currentInput,
        timestamp: Date.now(),
        ...userMessageData,
        isEdited: false
      };

      // Update session with new user message
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const newMessages = [...s.messages, userMessage];
          return {
            ...s,
            messages: newMessages,
            title: s.messages.length === 0 ? (currentInput.slice(0, 30) + (currentInput.length > 30 ? '...' : '')) : s.title,
            lastUpdated: Date.now()
          };
        }
        return s;
      }));
    }

    // Reset selected tools
    setSelectedTools([]);

    setLoading(true);
    setInput('');
    const currentFile = file;
    setFile(null);
    setPreview(null);

    try {
      const toolHint = selectedTools.length > 0 ? ` (SYSTEM: Active tools: ${selectedTools.map(t => t.id).join(', ')})` : '';
      const output = await generateAssistantResponse(currentInput + toolHint, personality, userMessageData.file?.preview, userMessageData.file?.type);

      if (output.startsWith("TOOL_CALL:generate_image:")) {
        try {
          const { imageUrl, prompt } = JSON.parse(output.replace("TOOL_CALL:generate_image:", ""));
          const assistantMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            role: 'assistant',
            content: `I've generated a new image for you based on: **${prompt}**\n\n![Generated Image](${imageUrl})`,
            timestamp: Date.now(),
            tool: 'image'
          };
          setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessage], lastUpdated: Date.now() } : s));
          return;
        } catch (e) {
          console.error("Failed to parse image tool call", e);
        }
      }

      if (output.startsWith("TOOL_CALL:convert_file:")) {
        const targetFormat = output.split(":")[2];
        if (!currentFile) {
          addAssistantMessage("Please upload a file first to convert it to " + targetFormat);
          return;
        }
        await handleFileConversion(currentFile, targetFormat);
        return;
      }

      const assistantMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: output,
        timestamp: Date.now(),
        tool: userMessageData.tool
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, assistantMessage],
            lastUpdated: Date.now()
          };
        }
        return s;
      }));
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: "Error: " + (error instanceof Error ? error.message : "Something went wrong"),
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, errorMessage] };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = (msg: Message) => {
    setInput(msg.content);
    setEditingMessageId(msg.id);
  };

  const handlePreview = (content: string) => {
    setPreviewMode({ active: true, content, type: 'code' });
  };

  const addAssistantMessage = (content: string) => {
    const msg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content,
      timestamp: Date.now()
    };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, msg], lastUpdated: Date.now() } : s));
  };

  const handleFileConversion = async (file: File, targetFormat: string) => {
    setLoading(true);
    addAssistantMessage(`Converting **${file.name}** to **${targetFormat.toUpperCase()}**... 🔄`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFormat', targetFormat);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Conversion failed");

      addAssistantMessage(`✅ Conversion successful! 
      
Your file is ready: [${data.filename}](${data.url})

Click the link above to download your converted file.`);
    } catch (error: any) {
      console.error(error);
      addAssistantMessage(`❌ Error during conversion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const personalities = [
    { id: 'emotional', label: 'Emotional 💕', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    { id: 'rational', label: 'Rational 🧠', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'roaster', label: 'Roaster 😈', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { id: 'flaunt', label: 'Flaunt 💅', icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
  ];

  // If the file converter is open, render it as a full overlay
  if (showVideoStream) {
    return <VideoStream onBack={() => setShowVideoStream(false)} />;
  }

  // If Image Enhancer is open, render it as a full overlay
  if (showImageEnhancer) {
    return <ImageEnhancer onBack={() => setShowImageEnhancer(false)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden"
    >
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent History Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 border-r border-white/5 bg-[#080808]/95 backdrop-blur-xl transition-all duration-300 md:relative md:bg-black/40 flex flex-col overflow-hidden ${showHistory
            ? 'w-72 translate-x-0 opacity-100'
            : 'w-0 -translate-x-full opacity-0'
          }`}>
          <div className="w-72 flex flex-col h-full shrink-0">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-purple-400" /> History
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={createNewChat}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-purple-400 transition-all border border-white/5"
                  title="New Chat"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 border border-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
              {sessions
                .filter(s => (s.title || "").toLowerCase().includes((searchQuery || "").toLowerCase()) || s.messages.some(m => (m.content || "").toLowerCase().includes((searchQuery || "").toLowerCase())))
                .map(session => (
                  <div
                    key={session.id}
                    onClick={() => { setActiveSessionId(session.id); setPersonality(session.personality); }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group flex items-center justify-between ${activeSessionId === session.id
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeSessionId === session.id ? 'text-purple-400' : 'text-white/20'}`} />
                      <div className="min-w-0">
                        <h3 className="text-xs font-medium truncate text-white/80">{session.title}</h3>
                        <p className="text-[9px] text-white/30">{new Date(session.lastUpdated).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-rose-400 rounded-md transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden h-full">
          {/* Header */}
          <header className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl z-20">
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-bold text-white/80 hover:text-white shrink-0"
                title="Go Back to Home"
              >
                <ArrowLeft className="w-4 h-4 text-purple-400 " />
                <span className="hidden xs:inline">Back to Home</span>
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl transition-all text-xs font-bold shrink-0 ${showHistory
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                    : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
                  }`}
                title="Toggle History"
              >
                <HistoryIcon className="w-4 h-4" />
                <span>{showHistory ? 'Hide History' : 'Show History'}</span>
              </button>
              <div className="truncate pl-2 border-l border-white/10 hidden sm:block">
                <h1 className="text-sm font-bold flex items-center gap-2 text-white/90">
                  Assistant <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex gap-2">
                {personalities.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPersonality(p.id as Personality);
                      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, personality: p.id as Personality } : s));
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1.5 ${personality === p.id
                        ? `${p.bg} ${p.border} ${p.color}`
                        : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                      }`}
                  >
                    <p.icon className="w-3 h-3" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-white/60" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden"
                    >
                      <div className="p-2">
                        <button
                          onClick={createNewChat}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
                        >
                          <Plus className="w-4 h-4 text-purple-400" /> New Chat
                        </button>
                        <button
                          onClick={() => { setShowHistory(true); setShowMenu(false); }}
                          className="md:hidden w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
                        >
                          <HistoryIcon className="w-4 h-4 text-blue-400" /> Chat History
                        </button>
                        {activeSession && activeSession.messages.length > 0 && (
                          <>
                            <div className="h-[1px] bg-white/5 my-1" />
                            <button
                              onClick={() => { downloadChat(activeSession); setShowMenu(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
                            >
                              <Download className="w-4 h-4 text-emerald-400" /> Download Chat
                            </button>
                            <button
                              onClick={() => { shareChat(activeSession); setShowMenu(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
                            >
                              <ShareIcon className="w-4 h-4 text-amber-400" /> Share Chat
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative">
            <AnimatePresence>
              {previewMode.active && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-4 z-40 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                >
                  <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setPreviewMode({ ...previewMode, active: false })}
                        className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to Chat
                      </button>
                      <div className="h-4 w-[1px] bg-white/10" />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewMode({ ...previewMode, type: 'code' })}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${previewMode.type === 'code' ? 'bg-purple-500 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                          Code
                        </button>
                        <button
                          onClick={() => setPreviewMode({ ...previewMode, type: 'simulation' })}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${previewMode.type === 'simulation' ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`p-2 rounded-xl transition-all ${isRunning ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}
                        title={isRunning ? 'Stop Execution' : 'Run Code'}
                      >
                        {isRunning ? <Square className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                      </button>
                      <button
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 transition-all"
                        title="Toggle Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden bg-white">
                    {previewMode.type === 'code' ? (
                      <pre className="p-6 text-xs text-purple-300 font-mono overflow-auto h-full custom-scrollbar bg-[#0a0a0a]">
                        <code>{previewMode.content}</code>
                      </pre>
                    ) : (
                      <iframe
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-scripts allow-modals allow-forms allow-popups"
                        srcDoc={isRunning ? getRenderableCode(previewMode.content) : `
                          <div style="font-family: sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #666;">
                            <div style="margin-bottom: 10px;">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </div>
                            <p style="font-weight: bold; font-size: 18px; color: #333; margin: 0;">Code is Ready</p>
                            <p style="font-size: 14px; margin-top: 8px;">Click the <strong>Run Code</strong> button to start the simulation</p>
                          </div>
                        `}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {(!activeSession || activeSession.messages.length === 0) && !loading ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center border border-white/10">
                    <Sparkles className="w-12 h-12 text-purple-400 animate-pulse" />
                  </div>
                  <div className="max-w-md">
                    <h2 className="text-2xl font-bold mb-2">Kaise help karoon aapki?</h2>
                    <p className="text-white/40">Main aapka personal assistant hoon. Aap mujhse Hinglish mein kuch bhi pooch sakte hain, ya image upload karke solve karwa sakte hain.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <button
                      onClick={() => handleGenerate("Bhai, yeh math problem solve kar de")}
                      className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white/60 hover:bg-white/10 transition-all text-left"
                    >
                      "Bhai, yeh math problem solve kar de"
                    </button>
                    <button
                      onClick={() => handleGenerate("Suggest some cool movies to watch")}
                      className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white/60 hover:bg-white/10 transition-all text-left"
                    >
                      "Suggest some cool movies to watch"
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="chat-content" className="space-y-6">
                  {activeSession?.messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
                        }`}>
                        {msg.role === 'user' ? <Heart className="w-5 h-5 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
                      </div>
                      <div className={`flex-1 max-w-[85%] space-y-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
                        {msg.file && (
                          <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className="relative w-48 aspect-square rounded-2xl overflow-hidden border border-white/10">
                              <img src={msg.file.preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          </div>
                        )}
                        <div className={`relative group inline-block text-left p-6 rounded-3xl shadow-2xl border ${msg.role === 'user'
                            ? 'bg-blue-500/10 border-blue-500/20 rounded-tr-none'
                            : 'bg-white/5 border-white/10 rounded-tl-none'
                          } ${msg.tool && msg.role === 'assistant' ? 'max-w-md' : ''}`}>
                          {msg.isEdited && (
                            <div className="text-[8px] uppercase tracking-widest text-white/20 mb-1 font-bold">Edited</div>
                          )}
                          {msg.tool && msg.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
                              {msg.tool?.includes('image') && <ImageIcon className="w-4 h-4 text-blue-400" />}
                              {msg.tool?.includes('research') && <Microscope className="w-4 h-4 text-purple-400" />}
                              {msg.tool?.includes('learning') && <BookOpen className="w-4 h-4 text-emerald-400" />}
                              {msg.tool?.includes('lab') && <Box className="w-4 h-4 text-amber-400" />}
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                                AI Assisted Action
                              </span>
                            </div>
                          )}
                          <div className="prose prose-invert prose-sm prose-purple max-w-none">
                            <Markdown
                              components={{
                                img: ({ ...props }) => (
                                  <img
                                    {...props}
                                    referrerPolicy="no-referrer"
                                    className="rounded-2xl shadow-2xl border border-white/10 max-h-[500px] w-auto my-4 hover:scale-[1.02] transition-transform cursor-zoom-in"
                                  />
                                )
                              }}
                            >
                              {msg.content}
                            </Markdown>
                          </div>

                          {/* Message Actions */}
                          <div className={`absolute -bottom-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all ${msg.role === 'user' ? 'right-0' : 'left-0'}`}>
                            {msg.role === 'user' && (
                              <button
                                onClick={() => handleEditMessage(msg)}
                                className="p-2 bg-black/40 border border-white/10 rounded-full hover:bg-black transition-colors"
                                title="Edit Prompt"
                              >
                                <Edit2 className="w-3 h-3 text-white/60" />
                              </button>
                            )}
                            <button
                              onClick={() => copyToClipboard(msg.content)}
                              className="p-2 bg-black/40 border border-white/10 rounded-full hover:bg-black transition-colors"
                              title="Copy"
                            >
                              <Copy className="w-3 h-3 text-white/60" />
                            </button>
                            {msg.role === 'assistant' && (
                              <>
                                <button
                                  onClick={() => speakResponse(msg.content)}
                                  className="p-2 bg-black/40 border border-white/10 rounded-full hover:bg-black transition-colors"
                                  title="Speak"
                                >
                                  <Volume2 className="w-3 h-3 text-white/60" />
                                </button>
                                <button
                                  onClick={() => downloadChat(activeSession!)}
                                  className="p-2 bg-black/40 border border-white/10 rounded-full hover:bg-black transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-3 h-3 text-white/60" />
                                </button>
                                <button
                                  onClick={() => shareChat(activeSession!)}
                                  className="p-2 bg-black/40 border border-white/10 rounded-full hover:bg-black transition-colors"
                                  title="Share"
                                >
                                  <ShareIcon className="w-3 h-3 text-white/60" />
                                </button>
                                {(msg.content || "").includes('```') && (
                                  <button
                                    onClick={() => handlePreview(msg.content)}
                                    className="p-2 bg-purple-500/20 border border-purple-500/40 rounded-full hover:bg-purple-500/30 transition-colors"
                                    title="Preview App/Simulation"
                                  >
                                    <Eye className="w-3 h-3 text-purple-400" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-3 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                          <span className="text-xs font-medium text-white/40">
                            {selectedTools.some(t => t.id === 'image') ? 'Generating your masterpiece...' :
                              selectedTools.some(t => t.id === 'whatsapp') ? 'Searching contacts...' :
                                'Assistant is thinking...'}
                          </span>
                        </div>
                        {selectedTools.some(t => t.id === 'image') && (
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ x: '-100%' }}
                              animate={{ x: '100%' }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                              className="w-1/2 h-full bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {isSpeaking && (
                    <div className="flex justify-center sticky bottom-0 py-4 z-10">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl"
                      >
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`w-1 h-4 bg-purple-500 rounded-full animate-pulse`} style={{ animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-white/80">Assistant is speaking...</span>
                        <button
                          onClick={togglePlayback}
                          className="p-2 hover:bg-white/10 rounded-full transition-all"
                        >
                          {isPaused ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                        </button>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Section */}
          <div className="p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-30">
            <div className="max-w-4xl mx-auto space-y-4">
              {preview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-32 h-32 rounded-xl overflow-hidden border border-white/20 shadow-xl"
                >
                  <img src={preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button
                    onClick={() => { setPreview(null); setFile(null); }}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}

              <div className="flex items-end gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                    className={`p-4 rounded-2xl transition-all ${showToolsMenu ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    <Plus className={`w-6 h-6 transition-transform ${showToolsMenu ? 'rotate-45' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showToolsMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-4 w-64 bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl z-[60] overflow-hidden p-2"
                      >
                        {[
                          { id: 'image', label: 'Generate Image', icon: ImageIcon, color: 'text-blue-400', desc: 'AI Image creation' },
                          { id: 'image-enhancer', label: 'Image Enhancer', icon: Sparkles, color: 'text-violet-400', desc: 'Remove BG, Upscale, Enhance' },
                          { id: 'research', label: 'Deep Research', icon: Microscope, color: 'text-purple-400', desc: 'In-depth analysis' },
                          { id: 'learning', label: 'Guided Learning', icon: BookOpen, color: 'text-emerald-400', desc: 'Step-by-step tutor' },
                          { id: 'lab', label: 'Dynamic Lab', icon: Box, color: 'text-amber-400', desc: '3D Simulation' },
                          { id: 'converter', label: 'File Converter', icon: FileOutput, color: 'text-blue-400', desc: 'Convert PDF, Images, etc.' },
                          { id: 'whatsapp', label: 'WhatsApp Agent', icon: MessageCircle, color: 'text-green-400', desc: 'Send messages via AI' },
                        ].map((tool) => (
                          <button
                            key={tool.id}
                            onClick={() => handleToolAction(tool.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-2xl transition-all text-left group"
                          >
                            <div className={`p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors ${tool.color}`}>
                              <tool.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-bold">{tool.label}</div>
                              <div className="text-[10px] text-white/40">{tool.desc}</div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-1 relative group">
                  <div className="w-full bg-[#121212] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/50 transition-all flex flex-col">
                    {selectedTools.length > 0 && (
                      <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-white/5 bg-white/[0.02]">
                        {selectedTools.map(tool => (
                          <div
                            key={tool.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-black/40 ${tool.color} text-[10px] font-bold group/chip`}
                          >
                            <tool.icon className="w-3 h-3" />
                            <span>{tool.label}</span>
                            <button
                              onClick={() => removeTool(tool.id)}
                              className="p-1 hover:bg-white/10 rounded-full transition-all ml-1 opacity-40 group-hover/chip:opacity-100"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleGenerate();
                        }
                      }}
                      placeholder={editingMessageId ? "Edit your prompt..." : "Type your message here... (Hinglish works best!)"}
                      className="w-full bg-transparent px-6 py-4 pr-24 text-sm focus:outline-none transition-all resize-none min-h-[60px] max-h-[200px]"
                    />
                  </div>
                  <div className="absolute right-3 bottom-1.5 flex items-center gap-2">
                    {editingMessageId && (
                      <button
                        onClick={() => { setEditingMessageId(null); setInput(''); }}
                        className="p-2 hover:bg-white/10 rounded-xl text-rose-400 transition-all"
                        title="Cancel Edit"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                      title="Upload Image"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        window.history.pushState({}, '', '/file-converter');
                        window.dispatchEvent(new Event('popstate'));
                      }}
                      title="File Converter"
                      className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                    >
                      <FileArchive className="w-5 h-5 text-amber-400" />
                    </button>
                    <button
                      onClick={() => {
                        window.history.pushState({}, '', '/pdf-converter');
                        window.dispatchEvent(new Event('popstate'));
                      }}
                      title="PDF Converter"
                      className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                    >
                      <FileText className="w-5 h-5 text-rose-400" />
                    </button>
                    <button
                      onClick={toggleListening}
                      className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}
                      title="Voice Input"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                  />
                </div>

                <button
                  onClick={() => handleGenerate()}
                  disabled={loading || (!input && !file)}
                  className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>

              <p className="text-[10px] text-center text-white/20 font-medium uppercase tracking-widest mt-4">
                Powered by OmniGen AI • Hinglish Assistant v1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
