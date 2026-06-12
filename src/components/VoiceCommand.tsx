import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, ArrowLeft, Loader2, Globe, Command } from 'lucide-react';

interface VoiceCommandProps {
  onBack: () => void;
}

export default function VoiceCommand({ onBack }: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Click the microphone and say "Open [app/website]"');
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setStatus('Listening...');
        setTranscript('');
        transcriptRef.current = '';
      };

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
        transcriptRef.current = result;
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setStatus('Error: ' + event.error);
        setProcessing(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // If we have a transcript, process it
        const finalTranscript = transcriptRef.current;
        if (finalTranscript) {
          processCommand(finalTranscript);
        } else {
          setStatus('Ready to listen');
        }
      };
    } else {
      setStatus('Speech recognition is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setProcessing(false);
      recognitionRef.current?.start();
    }
  };

  const processCommand = async (text: string) => {
    setProcessing(true);
    setStatus(`Processing: "${text}"`);
    
    // Remove punctuation that speech recognition might add
    const command = text.toLowerCase().trim().replace(/[.,!?]$/, '');
    
    // Basic Regex Parsing for App / Website
    const openMatch = command.match(/^open\s+(.+)$/i);
    
    if (openMatch) {
      let target = openMatch[1].trim();
      
      // Determine if it's a website
      const isWebsite = target.includes('.') || 
                        target.includes('youtube') || 
                        target.includes('google') ||
                        target.includes('facebook');
                        
      if (isWebsite) {
        setStatus(`Opening website: ${target}`);
        // Add domains if it's just a word
        if (!target.includes('.')) {
          target = `${target}.com`;
        }
        if (!target.startsWith('http')) {
          target = `https://${target}`;
        }
        
        // Remove spaces for url
        target = target.replace(/\s+/g, '');
        window.open(target, '_blank');
        setTimeout(() => setStatus('Website opened successfully!'), 1000);
      } else {
        // It's a local app
        let execTarget = target;
        const appMap: Record<string, string> = {
          'calculator': 'calc',
          'notepad': 'notepad',
          'vs code': 'code',
          'visual studio code': 'code',
          'paint': 'mspaint',
          'ms paint': 'mspaint',
          'ms word': 'winword',
          'word': 'winword',
          'excel': 'excel',
          'ms excel': 'excel',
          'powerpoint': 'powerpnt',
          'ms powerpoint': 'powerpnt',
          'chrome': 'chrome',
          'google chrome': 'chrome',
          'file explorer': 'explorer',
          'explorer': 'explorer',
          'camera': 'microsoft.windows.camera:',
          'antigravity': 'antigravity',
          'codex': 'codex'
        };

        if (appMap[target]) {
          execTarget = appMap[target];
        }

        setStatus(`Opening application: ${target}`);
        try {
          const res = await fetch('/api/open-app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: execTarget })
          });
          const data = await res.json();
          if (data.success) {
            setStatus(`Successfully opened ${target}!`);
          } else {
            setStatus(`Failed to open ${target}.`);
          }
        } catch (error) {
          setStatus('Error connecting to backend.');
        }
      }
    } else {
      setStatus('Could not understand command. Try saying "Open calculator"');
    }
    
    setProcessing(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] text-white">
      <header className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Command className="w-5 h-5 text-purple-400" /> AI Voice Command
            </h2>
            <p className="text-xs text-white/40">Control your laptop and browser with your voice</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background glow when listening */}
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"
          />
        )}

        <div className="z-10 flex flex-col items-center gap-12 w-full max-w-md text-center">
          
          <div className="space-y-4">
            <h3 className="text-2xl font-light text-white/80">
              {transcript ? `"${transcript}"` : "I am listening..."}
            </h3>
            <p className="text-sm font-bold tracking-widest uppercase text-purple-400 h-6">
              {status}
            </p>
          </div>

          <button
            onClick={toggleListening}
            disabled={processing}
            className={`relative group flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300 ${
              isListening 
                ? 'bg-purple-600 shadow-[0_0_50px_rgba(147,51,234,0.5)] scale-110' 
                : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30'
            } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {processing ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : isListening ? (
              <Mic className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <MicOff className="w-12 h-12 text-white/60 group-hover:text-white transition-colors" />
            )}
            
            {/* Ripple effect */}
            {isListening && (
              <span className="absolute inset-0 rounded-full animate-[ping_2s_ease-out_infinite] border-2 border-purple-400 opacity-20"></span>
            )}
          </button>

          <div className="grid grid-cols-2 gap-4 w-full text-left mt-8">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <Command className="w-5 h-5 text-blue-400" />
              <h4 className="font-bold text-sm">Local Apps</h4>
              <p className="text-xs text-white/40">Say "Open Calculator" or "Open Notepad"</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-sm">Websites</h4>
              <p className="text-xs text-white/40">Say "Open YouTube" or "Open Google"</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
