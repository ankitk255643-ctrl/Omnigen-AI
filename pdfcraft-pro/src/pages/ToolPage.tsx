import React, { useState, useRef, useEffect } from 'react';
import {
  File,
  ArrowLeft,
  RotateCw,
  Sparkles,
  Download,
  Grid,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Settings,
  PenTool,
  Lock,
  BookOpen,
  MessageSquare,
  Eye,
  Compass,
  Trash2
} from 'lucide-react';
import { PDF_TOOLS } from '../toolsData';
import { PDFTool, FileRecord, User } from '../types';
import UploadBox from '../components/UploadBox';

interface ToolPageProps {
  toolId: string;
  onBack: () => void;
  currentUser: User | null;
  onNavigate: (page: string) => void;
}

export default function ToolPage({ toolId, onBack, currentUser, onNavigate }: ToolPageProps) {
  const tool = PDF_TOOLS.find((t) => t.id === toolId) || PDF_TOOLS[0];

  // Upload state
  const [stagedFiles, setStagedFiles] = useState<FileRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Operation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedFile, setProcessedFile] = useState<FileRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings states
  // 1. Merge
  const [mergeOrder, setMergeOrder] = useState<string[]>([]);
  // 2. Split
  const [splitRange, setSplitRange] = useState('1-2');
  // 3. Compress
  const [compressionLevel, setCompressionLevel] = useState<'extreme' | 'recommended' | 'low'>('recommended');
  // 4. Rotate
  const [rotation, setRotation] = useState<'90' | '180' | '270'>('90');
  // 5. Watermark
  const [watermarkText, setWatermarkText] = useState('PDFCRAFT PRO CONFIDENTIAL');
  const [watermarkColor, setWatermarkColor] = useState('red');
  const [watermarkPosition, setWatermarkPosition] = useState('center');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkSize, setWatermarkSize] = useState(40);
  // 6. Security (Protect / Lock)
  const [protectPassword, setProtectPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // 7. Security (Unlock)
  const [unlockPassword, setUnlockPassword] = useState('');
  // 8. OCR
  const [ocrLanguage, setOcrLanguage] = useState('English');
  // 9. JPG to PDF
  const [jpgMargin, setJpgMargin] = useState<'none' | 'small' | 'large'>('small');
  // 10. AI Summarizer
  const [summaryStyle, setSummaryStyle] = useState<'short' | 'bullet' | 'chapter-wise'>('short');
  const [aiSummaryResult, setAiSummaryResult] = useState<string | null>(null);
  // 11. AI Translation
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [translatedSnippet, setTranslatedSnippet] = useState<string | null>(null);
  // 12. AI Chat
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! Ask me any question concerning the uploaded PDF content.' }
  ]);
  // 13. Sign PDF
  const [typedName, setTypedName] = useState('');
  const [signCanvasUrl, setSignCanvasUrl] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // 14. Remove/delete pages specific selection state
  const [removedPagesSet, setRemovedPagesSet] = useState<number[]>([]);
  // 15. Extract pages specific selection state
  const [extractedPagesSet, setExtractedPagesSet] = useState<number[]>([]);

  // Setup initial merge order list when files upload
  useEffect(() => {
    if (stagedFiles.length > 0) {
      setMergeOrder(stagedFiles.map((f) => f.id));
      setRemovedPagesSet([]);
      setExtractedPagesSet([]);
    }
  }, [stagedFiles]);

  // Handle local binary file staging and immediate upload to Node Backend!
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    try {
      const headers: Record<string, string> = {};
      if (currentUser) headers['x-user-id'] = currentUser.id;

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!res.ok) {
        let errorMsg = 'Failed to upload files to backend server';
        if (isJson) {
          try {
            const errData = await res.json();
            errorMsg = errData.error || errorMsg;
          } catch (_) { }
        } else {
          try {
            const rawText = await res.text();
            if (rawText && rawText.length < 150) {
              errorMsg = rawText;
            } else {
              errorMsg = `Server error code ${res.status}`;
            }
          } catch (__) { }
        }
        throw new Error(errorMsg);
      }

      if (!isJson) {
        throw new Error('Received non-JSON HTML static contents on file upload. Please restart the page or verify the backend service is running.');
      }

      const data = await res.json();
      setStagedFiles((prev) => [...prev, ...data.files]);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Re-order active merge list helper
  const moveMergeItem = (index: number, direction: 'up' | 'down') => {
    const list = [...mergeOrder];
    const target = index + (direction === 'up' ? -1 : 1);
    if (target >= 0 && target < list.length) {
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      setMergeOrder(list);
    }
  };

  // HTML5 canvas drawing signatures helper
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a'; // dark blue signature ink
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveSignatureImage();
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignCanvasUrl(null);
  };

  const saveSignatureImage = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    setSignCanvasUrl(canvas.toDataURL());
  };

  // Trigger processing call
  const handleProcessDocument = async () => {
    if (stagedFiles.length === 0) {
      setErrorMessage('Please upload at least one file to start document processing');
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setErrorMessage(null);

    // Coordinate route and payload based on selected tool
    let endpoint = '';
    let bodyPayload: any = {};
    const primaryFile = stagedFiles[0];

    try {
      if (tool.id === 'merge-pdf') {
        endpoint = '/api/pdf/merge';
        bodyPayload = { fileIds: mergeOrder };
      } else if (tool.id === 'split-pdf') {
        endpoint = '/api/pdf/split';
        bodyPayload = { fileId: primaryFile.id, splitRanges: splitRange };
      } else if (tool.id === 'remove-pages') {
        if (removedPagesSet.length === 0) {
          throw new Error('Please select at least one page to remove from the PDF review dashboard.');
        }
        if (primaryFile.pageCount && removedPagesSet.length === primaryFile.pageCount) {
          throw new Error('Cannot remove all pages from a PDF. There must be at least one page left.');
        }
        endpoint = '/api/pdf/remove-pages';
        bodyPayload = { fileId: primaryFile.id, pagesToRemove: removedPagesSet };
      } else if (tool.id === 'extract-pages') {
        if (extractedPagesSet.length === 0) {
          throw new Error('Please select at least one page to extract from the PDF review dashboard.');
        }
        endpoint = '/api/pdf/extract-pages';
        bodyPayload = { fileId: primaryFile.id, pagesToExtract: extractedPagesSet };
      } else if (tool.id === 'compress-pdf') {
        endpoint = '/api/pdf/compress';
        bodyPayload = { fileId: primaryFile.id, level: compressionLevel };
      } else if (tool.id === 'rotate-pdf') {
        endpoint = '/api/pdf/rotate';
        bodyPayload = { fileId: primaryFile.id, rotationDegrees: rotation, targetPages: 'all' };
      } else if (tool.id === 'add-watermark') {
        endpoint = '/api/pdf/watermark';
        bodyPayload = {
          fileId: primaryFile.id,
          text: watermarkText,
          opacity: watermarkOpacity,
          size: watermarkSize,
          color: watermarkColor,
          position: watermarkPosition
        };
      } else if (tool.id === 'protect-pdf') {
        if (!protectPassword) throw new Error('Password setting cannot be left empty');
        if (protectPassword !== confirmPassword) throw new Error('Passwords do not match');
        endpoint = '/api/pdf/protect';
        bodyPayload = { fileId: primaryFile.id, password: protectPassword };
      } else if (tool.id === 'unlock-pdf') {
        if (!unlockPassword) throw new Error('Lock master credentials are required');
        endpoint = '/api/pdf/unlock';
        bodyPayload = { fileId: primaryFile.id, password: unlockPassword };
      } else if (tool.id === 'ocr-pdf') {
        endpoint = '/api/pdf/ocr';
        bodyPayload = { fileId: primaryFile.id, language: ocrLanguage };
      } else if (tool.id === 'jpg-to-pdf') {
        endpoint = '/api/convert/jpg-to-pdf';
        bodyPayload = { fileIds: stagedFiles.map((f) => f.id), margin: jpgMargin };
      } else if (tool.id === 'ai-summarizer') {
        endpoint = '/api/ai/summarize-pdf';
        bodyPayload = { fileId: primaryFile.id, summaryStyle };
      } else if (tool.id === 'translate-pdf') {
        endpoint = '/api/ai/translate-pdf';
        bodyPayload = { fileId: primaryFile.id, targetLanguage };
      } else {
        // Mock processing for standard conversion, editing, forms, and redaction sub-modules
        endpoint = 'mock';
      }

      setProgress(45);

      if (endpoint === 'mock') {
        // Fallback gorgeous animation simulations for remaining suite
        await new Promise((res) => setTimeout(res, 2200));
        setProgress(100);

        // Generate mock downloadable record
        const mockOutId = 'f-mock-' + Math.random().toString(36).substring(2, 9);
        const resolvedMock: FileRecord = {
          id: mockOutId,
          userId: currentUser ? currentUser.id : null,
          originalName: `Crafted_${tool.name.replace(' ', '_')}_Active.pdf`,
          fileType: 'application/pdf',
          fileSize: primaryFile.fileSize,
          toolUsed: tool.id,
          status: 'completed',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          downloadUrl: '#' // Mock triggers localized success alert
        };

        setProcessedFile(resolvedMock);
      } else {
        // Real Node API call
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (currentUser) headers['x-user-id'] = currentUser.id;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload),
        });

        setProgress(80);

        const contentType = res.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        if (!res.ok) {
          let errorMsg = 'Server rejected operational payload';
          if (isJson) {
            try {
              const errData = await res.json();
              errorMsg = errData.error || errorMsg;
            } catch (_) { }
          } else {
            try {
              const rawText = await res.text();
              if (rawText && rawText.length < 150) {
                errorMsg = rawText;
              } else {
                errorMsg = `Server error code ${res.status}`;
              }
            } catch (__) { }
          }
          throw new Error(errorMsg);
        }

        if (!isJson) {
          throw new Error(`The server returned an unexpected HTML layout instead of JSON (Status code: ${res.status}). This can occur if the endpoint is not correctly matching or there is a routing failure. Please verify the active PDF is not corrupted.`);
        }

        const data = await res.json();
        setProgress(100);
        setProcessedFile(data.file);

        if (tool.id === 'ai-summarizer') setAiSummaryResult(data.summary);
        if (tool.id === 'translate-pdf') setTranslatedSnippet(data.translatedText);
      }

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Interactive Q&A chat handler
  const handleSendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    if (stagedFiles.length === 0) {
      alert('Staged PDF document context is missing. Upload first!');
      return;
    }

    const usrMsg = chatMessage;
    setChatMessage('');
    setChatLog((prev) => [...prev, { sender: 'user', text: usrMsg }]);

    try {
      const res = await fetch('/api/ai/chat-with-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: stagedFiles[0].id, question: usrMsg }),
      });

      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!res.ok) {
        let errorMsg = 'Interactive chat failed';
        if (isJson) {
          try {
            const errData = await res.json();
            errorMsg = errData.error || errorMsg;
          } catch (_) { }
        } else {
          try {
            const rawText = await res.text();
            if (rawText && rawText.length < 150) {
              errorMsg = rawText;
            } else {
              errorMsg = `Server error code ${res.status}`;
            }
          } catch (__) { }
        }
        throw new Error(errorMsg);
      }

      if (!isJson) {
        throw new Error('Server returned HTML or invalid response format.');
      }

      const data = await res.json();
      setChatLog((prev) => [...prev, { sender: 'ai', text: data.answer }]);
    } catch (err: any) {
      setChatLog((prev) => [...prev, { sender: 'ai', text: `Failed to fetch response: ${err.message}` }]);
    }
  };

  // Reset tool card to run again
  const handleStartOver = () => {
    setStagedFiles([]);
    setProcessedFile(null);
    setProgress(0);
    setErrorMessage(null);
    setMergeOrder([]);
    setProtectPassword('');
    setConfirmPassword('');
    setUnlockPassword('');
    setAiSummaryResult(null);
    setTranslatedSnippet(null);
    clearSignature();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* 1. Tool Page Title / Navbar Navigation Bar */}
      <div className="flex items-center space-x-3 mb-8">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-col text-left">
          <span className="font-sans text-xs font-bold text-red-500 uppercase tracking-widest">
            {tool.category.replace('-', ' ')}
          </span>
          <h1 className="font-sans text-xl sm:text-2xl font-black text-gray-900 leading-none mt-1">
            {tool.name}
          </h1>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-center space-x-2.5 rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-bold font-sans text-red-700 animate-fade-in">
          <AlertCircle size={15} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Success Panel */}
      {processedFile ? (
        <div className="rounded-2xl border border-green-100 bg-green-50/20 p-8 text-center shadow-md animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600 mb-6 shadow-md shadow-green-500/10">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="font-sans text-xl font-extrabold text-gray-900 leading-tight">Your document is ready</h2>
          <p className="mt-1 font-sans text-xs text-gray-500">
            Processed cleanly through <b>PDFCraft Pro</b> secure pipeline
          </p>

          <div className="mt-6 inline-flex max-w-sm items-center space-x-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-inner">
            <File size={16} className="text-gray-400" />
            <div className="text-left overflow-hidden max-w-[200px]">
              <p className="truncate font-sans text-xs font-bold text-gray-800">{processedFile.originalName}</p>
              <p className="font-mono text-[9px] font-semibold text-gray-400 uppercase tracking-widest">
                File size: {(processedFile.fileSize / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          {/* AI summaries view block */}
          {aiSummaryResult && (
            <div className="mt-8 text-left bg-white border border-gray-100 rounded-2xl p-6 shadow-inner max-w-full">
              <h4 className="flex items-center space-x-1 font-sans text-xs font-bold uppercase tracking-wider text-purple-600 mb-3.5">
                <Sparkles size={14} className="stroke-[2.5]" />
                <span>Gemini Analytical Summary ({summaryStyle})</span>
              </h4>
              <div className="font-sans text-xs text-gray-600 leading-relaxed whitespace-pre-wrap select-text selection:bg-purple-100">
                {aiSummaryResult}
              </div>
            </div>
          )}

          {/* AI translated snippets block */}
          {translatedSnippet && (
            <div className="mt-8 text-left bg-white border border-gray-100 rounded-2xl p-6 shadow-inner max-w-full">
              <h4 className="flex items-center space-x-1 font-sans text-xs font-bold uppercase tracking-wider text-blue-600 mb-3.5">
                <Sparkles size={14} className="stroke-[2.5]" />
                <span>Gemini translated script ({targetLanguage})</span>
              </h4>
              <div className="font-sans text-xs text-gray-600 leading-relaxed whitespace-pre-wrap select-text selection:bg-blue-100">
                {translatedSnippet}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
            {processedFile.downloadUrl === '#' ? (
              <button
                onClick={() => alert(`SaaS Simulator Active! Clean document compilation has processed natively without errors.`)}
                className="flex cursor-pointer items-center space-x-2 rounded-xl bg-gradient-to-r from-red-500 to-blue-600 px-6 py-3 font-sans text-sm font-bold text-white shadow-md shadow-red-500/10 hover:opacity-95 hover:shadow-lg transition-all"
              >
                <Download size={15} />
                <span>Simulated Download</span>
              </button>
            ) : (
              <a
                href={`/api/files/download/${processedFile.id}`}
                className="flex cursor-pointer items-center space-x-2 rounded-xl bg-gradient-to-r from-red-500 to-blue-600 px-6 py-3 font-sans text-sm font-bold text-white shadow-md shadow-red-500/10 hover:opacity-95 hover:shadow-lg transition-all"
              >
                <Download size={15} />
                <span>Download Saved PDF</span>
              </a>
            )}

            <button
              onClick={handleStartOver}
              className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-sans text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Process New File</span>
            </button>
          </div>
        </div>
      ) : (
        /* 3. Settings or Upload Panel */
        <div className="space-y-8 animate-fade-in">
          {stagedFiles.length === 0 ? (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20">
              <UploadBox
                onFilesSelected={handleFilesSelected}
                multiple={tool.id === 'merge-pdf' || tool.id === 'jpg-to-pdf'}
                maxSizeMB={currentUser?.plan === 'premium' ? 500 : currentUser?.plan === 'business' ? 1000 : 100}
                label={`Select files to upload for ${tool.name}`}
              />
              {isUploading && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500 font-sans">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  <span>Staging files upload securely...</span>
                </div>
              )}
            </div>
          ) : (
            /* Uploaded Staged Files, Configuring Settings UI */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Staged file outline list */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md">
                  <h3 className="font-mono text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-4">
                    Staged Core Documents
                  </h3>

                  {tool.id === 'merge-pdf' && mergeOrder.length > 1 ? (
                    // Specialized list with re-ordering sorting options
                    <div className="space-y-3">
                      <p className="text-[10.5px] font-sans text-gray-400">
                        Adjust index priorities up or down before assembling individual streams together.
                      </p>
                      {mergeOrder.map((id, index) => {
                        const rec = stagedFiles.find((f) => f.id === id);
                        if (!rec) return null;
                        return (
                          <div key={id} className="flex items-center justify-between border border-gray-100 bg-gray-50/50 p-3 rounded-xl text-left">
                            <div className="flex items-center space-x-2 overflow-hidden">
                              <span className="font-mono text-[10px] font-extrabold text-blue-500 shrink-0">#{index + 1}</span>
                              <p className="truncate font-sans text-xs font-bold text-gray-800">{rec.originalName}</p>
                            </div>
                            <div className="flex space-x-1 shrink-0">
                              <button
                                onClick={() => moveMergeItem(index, 'up')}
                                className="h-6 w-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 hover:text-gray-800 hover:border-gray-200 transition-all"
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => moveMergeItem(index, 'down')}
                                className="h-6 w-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 hover:text-gray-800 hover:border-gray-200 transition-all"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Singular list view
                    <div className="space-y-4">
                      {stagedFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50/50 border border-gray-100 p-3 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <File size={15} />
                            </div>
                            <div className="text-left overflow-hidden">
                              <p className="truncate font-sans text-xs font-bold text-gray-800 leading-none">{f.originalName}</p>
                              <span className="font-mono text-[9.5px] text-gray-400">
                                {(f.fileSize / 1024).toFixed(1)} KB {f.pageCount ? `• ${f.pageCount} Pages` : ''}
                              </span>
                            </div>
                          </div>
                          {f.pageCount && (
                            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider font-sans shrink-0">
                              Active Editor
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Display the Visual Review & Page Deletions Grid here! */}
                      {tool.id === 'remove-pages' && stagedFiles[0] && (
                        <div className="mt-6 border-t border-gray-100 pt-5 text-left">
                          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                            <div>
                              <h4 className="font-sans text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                                Interactive Page Review Grid
                              </h4>
                              <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
                                Click any page to flag/unflag it for removal from this document.
                              </p>
                            </div>
                            <div className="flex space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const total = stagedFiles[0].pageCount || 0;
                                  const allPages = Array.from({ length: total }, (_, idx) => idx + 1);
                                  setRemovedPagesSet(allPages);
                                }}
                                className="px-2 py-1 text-[9.5px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                              >
                                Select All for Removal
                              </button>
                              <button
                                type="button"
                                onClick={() => setRemovedPagesSet([])}
                                className="px-2 py-1 text-[9.5px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                              >
                                Clear Deletion Flags
                              </button>
                            </div>
                          </div>

                          {stagedFiles[0].pageCount ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-gray-50/40 p-4 rounded-2xl border border-gray-150 max-h-96 overflow-y-auto">
                              {Array.from({ length: stagedFiles[0].pageCount }, (_, idx) => {
                                const pageNum = idx + 1;
                                const isFlaggedToRemove = removedPagesSet.includes(pageNum);
                                return (
                                  <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => {
                                      setRemovedPagesSet((prev) =>
                                        prev.includes(pageNum)
                                          ? prev.filter((p) => p !== pageNum)
                                          : [...prev, pageNum]
                                      );
                                    }}
                                    className={`relative group rounded-xl p-3 border text-center transition-all ${isFlaggedToRemove
                                        ? 'bg-red-50/75 border-red-300 ring-2 ring-red-350 shadow-sm shadow-red-100'
                                        : 'bg-white border-gray-200 hover:border-gray-400 hover:shadow-xs'
                                      }`}
                                  >
                                    {/* Page miniature structure */}
                                    <div className="mx-auto h-20 w-14 rounded bg-white shadow-sm border border-gray-200 p-1 flex flex-col justify-between overflow-hidden relative mb-2">
                                      {/* Visual placeholder text lines */}
                                      <div className="space-y-1 mt-0.5">
                                        <div className="w-full h-1 bg-gray-200 rounded"></div>
                                        <div className="w-10 h-1 bg-gray-100 rounded"></div>
                                        <div className="w-12 h-1 bg-gray-100 rounded"></div>
                                        <div className="w-8 h-1 bg-gray-100 rounded"></div>
                                        <div className="w-11 h-1 bg-gray-50 rounded"></div>
                                      </div>

                                      {/* Flagged status overlay inside miniature */}
                                      {isFlaggedToRemove ? (
                                        <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                                          <div className="bg-red-500 text-white rounded-full p-1.5 shadow-md">
                                            <Trash2 size={12} strokeWidth={2.5} />
                                          </div>
                                        </div>
                                      ) : null}

                                      <span className="font-mono text-[9px] text-gray-400 self-end">
                                        {pageNum}
                                      </span>
                                    </div>

                                    <div className="font-sans font-extrabold text-xs text-gray-850 leading-none">
                                      Page {pageNum}
                                    </div>

                                    {/* Badge display */}
                                    <div className="mt-2">
                                      {isFlaggedToRemove ? (
                                        <span className="inline-flex items-center text-[8.5px] font-extrabold font-sans text-red-600 bg-red-100/60 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          To Remove
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center text-[8.5px] font-extrabold font-sans text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          To Keep
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                              Reading page outlines of {stagedFiles[0].originalName}...
                            </div>
                          )}

                          {/* Summary numbers block */}
                          {stagedFiles[0].pageCount ? (
                            <div className="mt-3.5 p-3 rounded-xl bg-gray-150/40 border border-gray-200 flex flex-wrap justify-between items-center text-xs text-gray-600 font-sans font-medium gap-2">
                              <div>
                                Selected <span className="font-bold text-red-600 font-mono">{removedPagesSet.length}</span> of <span className="font-bold text-gray-800 font-mono">{stagedFiles[0].pageCount}</span> page(s) for removal
                              </div>
                              <div className="text-[11px] text-gray-500 font-semibold bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                                Output: <span className="font-extrabold text-gray-800 font-mono">{stagedFiles[0].pageCount - removedPagesSet.length}</span> page(s) remaining
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Display the Visual Review & Page Extraction Grid here! */}
                      {tool.id === 'extract-pages' && stagedFiles[0] && (
                        <div className="mt-6 border-t border-gray-100 pt-5 text-left">
                          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                            <div>
                              <h4 className="font-sans text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                                Interactive Page Extraction Grid
                              </h4>
                              <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
                                Click any page to flag it/unflag it for extraction from this document.
                              </p>
                            </div>
                            <div className="flex space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const total = stagedFiles[0].pageCount || 0;
                                  const allPages = Array.from({ length: total }, (_, idx) => idx + 1);
                                  setExtractedPagesSet(allPages);
                                }}
                                className="px-2 py-1 text-[9.5px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer border border-blue-100"
                              >
                                Select All Pages
                              </button>
                              <button
                                type="button"
                                onClick={() => setExtractedPagesSet([])}
                                className="px-2 py-1 text-[9.5px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                              >
                                Clear Selection
                              </button>
                            </div>
                          </div>

                          {stagedFiles[0].pageCount ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-gray-50/40 p-4 rounded-2xl border border-gray-150 max-h-96 overflow-y-auto w-full">
                              {Array.from({ length: stagedFiles[0].pageCount }, (_, idx) => {
                                const pageNum = idx + 1;
                                const isFlaggedToExtract = extractedPagesSet.includes(pageNum);
                                return (
                                  <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => {
                                      setExtractedPagesSet((prev) =>
                                        prev.includes(pageNum)
                                          ? prev.filter((p) => p !== pageNum)
                                          : [...prev, pageNum]
                                      );
                                    }}
                                    className={`relative group rounded-xl p-3 border text-center transition-all ${isFlaggedToExtract
                                        ? 'bg-blue-50/75 border-blue-300 ring-2 ring-blue-350 shadow-sm shadow-blue-100'
                                        : 'bg-white border-gray-200 hover:border-gray-400 hover:shadow-xs'
                                      }`}
                                  >
                                    {/* Page miniature structure */}
                                    <div className="mx-auto h-20 w-14 rounded bg-white shadow-sm border border-gray-200 p-1 flex flex-col justify-between overflow-hidden relative mb-2">
                                      {/* Visual placeholder text lines */}
                                      <div className="space-y-1 mt-0.5">
                                        <div className="w-full h-1 bg-gray-200 rounded"></div>
                                        <div className="w-10 h-1 bg-gray-100 rounded"></div>
                                        <div className="w-12 h-1 bg-gray-100 rounded"></div>
                                        <div className="w-8 h-1 bg-gray-100 rounded"></div>
                                        <div className="w-11 h-1 bg-gray-50 rounded"></div>
                                      </div>

                                      {/* Flagged status overlay inside miniature */}
                                      {isFlaggedToExtract ? (
                                        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                                          <div className="bg-blue-500 text-white rounded-full p-1 shadow-md leading-none flex items-center justify-center w-5 h-5 font-bold">
                                            ✓
                                          </div>
                                        </div>
                                      ) : null}

                                      <span className="font-mono text-[9px] text-gray-400 self-end">
                                        {pageNum}
                                      </span>
                                    </div>

                                    <div className="font-sans font-extrabold text-xs text-gray-850 leading-none">
                                      Page {pageNum}
                                    </div>

                                    {/* Badge display */}
                                    <div className="mt-2">
                                      {isFlaggedToExtract ? (
                                        <span className="inline-flex items-center text-[8.5px] font-extrabold font-sans text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          Extract
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center text-[8.5px] font-extrabold font-sans text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          Skip
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                              Reading page outlines of {stagedFiles[0].originalName}...
                            </div>
                          )}

                          {/* Summary numbers block */}
                          {stagedFiles[0].pageCount ? (
                            <div className="mt-3.5 p-3 rounded-xl bg-gray-150/40 border border-gray-200 flex flex-wrap justify-between items-center text-xs text-gray-600 font-sans font-medium gap-2">
                              <div>
                                Selected <span className="font-bold text-blue-600 font-mono">{extractedPagesSet.length}</span> of <span className="font-bold text-gray-800 font-mono">{stagedFiles[0].pageCount}</span> page(s) for extraction
                              </div>
                              <div className="text-[11px] text-gray-500 font-semibold bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                                Output: <span className="font-extrabold text-blue-600 font-mono">{extractedPagesSet.length}</span> page(s) new PDF
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleStartOver}
                    className="mt-4 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Clear Selected File(s)
                  </button>
                </div>

                {/* Simulated AI Q&A Chat window when utilizing Chat tool */}
                {tool.id === 'ai-summarizer' && (
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md text-left">
                    <h3 className="font-mono text-[10px] uppercase font-bold text-purple-500 tracking-wider mb-3">AI Context Chatbot</h3>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      Before applying, you can also ask direct questions below. The document context represents the page streams.
                    </p>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 max-h-48 overflow-y-auto mb-3 space-y-3 text-xs leading-normal select-text">
                      {chatLog.map((log, i) => (
                        <div key={i} className={`p-2 rounded-lg max-w-[85%] ${log.sender === 'user' ? 'bg-blue-100 text-blue-900 ml-auto' : 'bg-white border border-gray-100 text-gray-700'}`}>
                          <b>{log.sender === 'user' ? 'User: ' : 'AI Analysis: '}</b>
                          <span>{log.text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask: What is the primary focus of this file?"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        className="flex-1 border border-gray-100 bg-gray-50 pl-3 py-1.5 text-xs rounded-xl focus:bg-white focus:outline-none focus:border-red-500 transition-all font-sans"
                      />
                      <button
                        onClick={handleSendChatMessage}
                        className="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 cursor-pointer"
                      >
                        Ask
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Customizable tool settings sidebox */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md text-left">
                  <div className="flex items-center space-x-1.5 mb-4 border-b border-gray-50 pb-2">
                    <Settings size={14} className="text-gray-400" />
                    <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-600">
                      Tool Variables
                    </h3>
                  </div>

                  {/* 1. Merge variables layout */}
                  {tool.id === 'merge-pdf' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 leading-normal">
                        Ready to join current streams into one single PDF payload in specific order.
                      </p>
                    </div>
                  )}

                  {/* 2. Split PDF variables */}
                  {tool.id === 'split-pdf' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-700">Split Ranges</label>
                      <input
                        type="text"
                        placeholder="e.g. 1-2, 3-4"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      />
                      <span className="text-[10px] text-gray-400 leading-none block">
                        Enter hyphenated pages parameters to split.
                      </span>
                    </div>
                  )}

                  {/* 2b. Remove Pages variables */}
                  {tool.id === 'remove-pages' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Pages Set for Removal</label>
                        <div className="mt-1.5 p-3 rounded-xl bg-red-50/50 border border-red-100 max-h-36 overflow-y-auto">
                          {removedPagesSet.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {removedPagesSet.sort((a, b) => a - b).map((pageNum) => (
                                <span
                                  key={pageNum}
                                  className="inline-flex items-center space-x-1 font-mono text-[10.5px] font-extrabold text-red-700 bg-red-100/60 px-2 py-0.5 rounded-lg border border-red-250"
                                >
                                  <span>P{pageNum}</span>
                                  <button
                                    type="button"
                                    onClick={() => setRemovedPagesSet((prev) => prev.filter((p) => p !== pageNum))}
                                    className="hover:text-red-900 ml-0.5 font-bold cursor-pointer"
                                    title="Unflag"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10.5px] font-sans text-gray-400 leading-normal">
                              No pages flagged for deletion. Click the page cards in the left interactive grid portal.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Manual listing input too, for ultimate convenience */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Add Page Manually</label>
                        <div className="flex space-x-1.5 mt-1.5">
                          <input
                            type="number"
                            id="manualPageInput"
                            min="1"
                            max={stagedFiles[0]?.pageCount || 999}
                            placeholder="Page #"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = parseInt((e.target as HTMLInputElement).value, 10);
                                if (val && val >= 1 && (!stagedFiles[0]?.pageCount || val <= stagedFiles[0].pageCount)) {
                                  if (!removedPagesSet.includes(val)) {
                                    setRemovedPagesSet((prev) => [...prev, val]);
                                  }
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                            className="w-2/3 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-red-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const inputEl = document.getElementById('manualPageInput') as HTMLInputElement;
                              if (inputEl) {
                                const val = parseInt(inputEl.value, 10);
                                if (val && val >= 1 && (!stagedFiles[0]?.pageCount || val <= stagedFiles[0].pageCount)) {
                                  if (!removedPagesSet.includes(val)) {
                                    setRemovedPagesSet((prev) => [...prev, val]);
                                  }
                                  inputEl.value = '';
                                }
                              }
                            }}
                            className="w-1/3 bg-gray-900 hover:bg-gray-800 text-white text-[10.5px] font-bold rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                        <span className="text-[9.5px] text-gray-400 leading-none mt-1.5 block">
                          Press enter or click Add to append page number.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2c. Extract Pages variables */}
                  {tool.id === 'extract-pages' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Pages Set for Extraction</label>
                        <div className="mt-1.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100 max-h-36 overflow-y-auto">
                          {extractedPagesSet.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {extractedPagesSet.sort((a, b) => a - b).map((pageNum) => (
                                <span
                                  key={pageNum}
                                  className="inline-flex items-center space-x-1 font-mono text-[10.5px] font-extrabold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-lg border border-blue-250"
                                >
                                  <span>P{pageNum}</span>
                                  <button
                                    type="button"
                                    onClick={() => setExtractedPagesSet((prev) => prev.filter((p) => p !== pageNum))}
                                    className="hover:text-blue-900 ml-0.5 font-bold cursor-pointer"
                                    title="Unflag"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10.5px] font-sans text-gray-400 leading-normal">
                              No pages selected for extraction. Click the page cards in the left interactive grid portal.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Manual listing input too, for ultimate convenience */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Add Page Manually</label>
                        <div className="flex space-x-1.5 mt-1.5">
                          <input
                            type="number"
                            id="manualExtractPageInput"
                            min="1"
                            max={stagedFiles[0]?.pageCount || 999}
                            placeholder="Page #"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = parseInt((e.target as HTMLInputElement).value, 10);
                                if (val && val >= 1 && (!stagedFiles[0]?.pageCount || val <= stagedFiles[0].pageCount)) {
                                  if (!extractedPagesSet.includes(val)) {
                                    setExtractedPagesSet((prev) => [...prev, val]);
                                  }
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                            className="w-2/3 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const inputEl = document.getElementById('manualExtractPageInput') as HTMLInputElement;
                              if (inputEl) {
                                const val = parseInt(inputEl.value, 10);
                                if (val && val >= 1 && (!stagedFiles[0]?.pageCount || val <= stagedFiles[0].pageCount)) {
                                  if (!extractedPagesSet.includes(val)) {
                                    setExtractedPagesSet((prev) => [...prev, val]);
                                  }
                                  inputEl.value = '';
                                }
                              }
                            }}
                            className="w-1/3 bg-gray-900 hover:bg-gray-800 text-white text-[10.5px] font-bold rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                        <span className="text-[9.5px] text-gray-400 leading-none mt-1.5 block">
                          Press enter or click Add to append page number.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3. Compress PDF */}
                  {tool.id === 'compress-pdf' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-700">Compression Settings</label>
                      <div className="space-y-2">
                        {[
                          { id: 'extreme', tag: 'Extreme Compression', desc: 'Saves maximal bandwidth. Low quality margins.' },
                          { id: 'recommended', tag: 'Recommended Compression', desc: 'Standard metadata stripping. Excellent clarity.' },
                          { id: 'low', tag: 'Low Compression', desc: 'Preserves images perfectly with massive fidelity.' },
                        ].map((lvl) => (
                          <label key={lvl.id} className="flex items-start space-x-2.5 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <input
                              type="radio"
                              name="complvl"
                              checked={compressionLevel === lvl.id}
                              onChange={() => setCompressionLevel(lvl.id as any)}
                              className="mt-1"
                            />
                            <div className="text-left font-sans">
                              <p className="text-xs font-bold text-gray-800">{lvl.tag}</p>
                              <p className="text-[10px] text-gray-400">{lvl.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Rotate PDF */}
                  {tool.id === 'rotate-pdf' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-700">Page Degrees Angle</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { deg: '90', label: '+90° CW' },
                          { deg: '180', label: '180° Half' },
                          { deg: '270', label: '-90° CCW' },
                        ].map((rot) => (
                          <button
                            key={rot.deg}
                            type="button"
                            onClick={() => setRotation(rot.deg as any)}
                            className={`px-1 py-2 text-[10.5px] font-bold rounded-xl transition-all ${rotation === rot.deg
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                              }`}
                          >
                            {rot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Watermark PDF */}
                  {tool.id === 'add-watermark' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Watermark Text</label>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-500 mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Color Palette</label>
                        <div className="grid grid-cols-3 gap-1.5 mt-1">
                          {['red', 'blue', 'gray'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setWatermarkColor(c)}
                              className={`py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold border transition-colors ${watermarkColor === c
                                  ? 'bg-gray-900 text-white border-gray-900'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Position Block</label>
                        <select
                          value={watermarkPosition}
                          onChange={(e) => setWatermarkPosition(e.target.value)}
                          className="w-full border border-gray-200 bg-white rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-red-500 mt-1"
                        >
                          <option value="center">Centered Page Body</option>
                          <option value="top">Top Header Margin</option>
                          <option value="bottom">Bottom Footer Margin</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-gray-750">
                          <span>Transparency ({Math.round(watermarkOpacity * 100)}%)</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-full mt-1.5"
                        />
                      </div>
                    </div>
                  )}

                  {/* 6. Protect PDF */}
                  {tool.id === 'protect-pdf' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Set Security Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={protectPassword}
                          onChange={(e) => setProtectPassword(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-500 mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Repeat Passphrase</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-500 mt-1"
                        />
                      </div>
                      {protectPassword && (
                        <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-[10px] text-gray-500 font-bold font-sans">
                          SaaS strength analysis:{' '}
                          <span className={protectPassword.length > 7 ? 'text-green-600' : 'text-amber-500'}>
                            {protectPassword.length > 7 ? 'STRONG METADATA AES KEY' : 'MODERATE LENGTH'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7. Unlock PDF */}
                  {tool.id === 'unlock-pdf' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-700">File AES Password</label>
                      <input
                        type="password"
                        placeholder="Master lock coordinates"
                        value={unlockPassword}
                        onChange={(e) => setUnlockPassword(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>
                  )}

                  {/* 8. OCR PDF */}
                  {tool.id === 'ocr-pdf' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-700">Target Language Scan</label>
                      <select
                        value={ocrLanguage}
                        onChange={(e) => setOcrLanguage(e.target.value)}
                        className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-500"
                      >
                        <option value="English">English / Roman</option>
                        <option value="Spanish">Spanish / Castilian</option>
                        <option value="German">German / Deutsch</option>
                        <option value="French">French / Français</option>
                      </select>
                    </div>
                  )}

                  {/* 9. JPG to PDF */}
                  {tool.id === 'jpg-to-pdf' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-700">Page Margin Size</label>
                      <div className="grid grid-cols-3 gap-1.5 mt-1">
                        {['none', 'small', 'large'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setJpgMargin(m as any)}
                            className={`py-1 rounded-lg text-[10px] uppercase font-bold border transition-colors ${jpgMargin === m
                                ? 'bg-gray-900 text-white'
                                : 'bg-white border-gray-200 text-gray-600'
                              }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 10. AI Summarizer */}
                  {tool.id === 'ai-summarizer' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-700">Summary Outline Style</label>
                      <select
                        value={summaryStyle}
                        onChange={(e) => setSummaryStyle(e.target.value as any)}
                        className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-500"
                      >
                        <option value="short">Short Cohesive Summary</option>
                        <option value="bullet">Structured Bullet Fact sheets</option>
                        <option value="chapter-wise">Chapter-by-Chapter Analytics</option>
                      </select>
                    </div>
                  )}

                  {/* 11. AI Translation */}
                  {tool.id === 'translate-pdf' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-700">Target Language Output</label>
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-500"
                      >
                        <option value="Spanish">Spanish (Español)</option>
                        <option value="French">French (Français)</option>
                        <option value="German">German (Deutsch)</option>
                        <option value="Japanese">Japanese (日本語)</option>
                        <option value="Arabic">Arabic (العربية)</option>
                        <option value="Russian">Russian (Русский)</option>
                      </select>
                    </div>
                  )}

                  {/* 12. Sign PDF Drawing Board */}
                  {tool.id === 'sign-pdf' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Draw Digital Ink</label>
                        <canvas
                          ref={signatureCanvasRef}
                          width={240}
                          height={120}
                          onMouseDown={startDrawing}
                          onMouseMove={drawSignature}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          className="w-full border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl cursor-crosshair mt-1.5"
                        />
                        <div className="flex justify-between items-center mt-1">
                          <span className="font-mono text-[9px] text-gray-400">Canvas dimension: 240x120px</span>
                          <button
                            type="button"
                            onClick={clearSignature}
                            className="text-[10px] font-bold text-red-500 hover:text-red-600"
                          >
                            Clear Board
                          </button>
                        </div>
                      </div>

                      <span className="text-center block font-sans text-xs font-semibold text-gray-300">OR</span>

                      <div>
                        <label className="block text-xs font-bold text-gray-700">Type Name Signature</label>
                        <input
                          type="text"
                          placeholder="Type John Doe"
                          value={typedName}
                          onChange={(e) => setTypedName(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-500 mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Standard mock descriptors for the rest (Word to PDF, Repair PDF, Compare, Crop etc.) */}
                  {!['merge-pdf', 'split-pdf', 'remove-pages', 'extract-pages', 'compress-pdf', 'rotate-pdf', 'add-watermark', 'protect-pdf', 'unlock-pdf', 'ocr-pdf', 'jpg-to-pdf', 'ai-summarizer', 'translate-pdf', 'sign-pdf'].includes(tool.id) && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 leading-normal">
                        Ready to process <b>{tool.name}</b> parameters on the server queue structure.
                      </p>
                    </div>
                  )}

                  {/* Main Action execution button */}
                  {isProcessing ? (
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-blue-600">
                        <span>Compiling payload...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-red-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProcessDocument}
                      className="mt-6 w-full flex items-center justify-center space-x-1 cursor-pointer rounded-xl bg-gradient-to-r from-red-500 to-blue-600 px-4 py-3 font-sans text-sm font-bold text-white shadow-md shadow-red-500/10 hover:opacity-95 hover:shadow-lg transition-all"
                    >
                      <Sparkles size={14} className="stroke-[2.5]" />
                      <span>Assemble PDF Output</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
