import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DocType, DocLength, WritingStyle, ProcessingConfig } from './types';
import { processTranscript } from './services/gemini';
import { 
  MicrophoneIcon, 
  StopIcon, 
  ArrowPathIcon, 
  ClipboardDocumentCheckIcon, 
  DocumentTextIcon,
  SparklesIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  TicketIcon,
  ChatBubbleLeftRightIcon,
  QueueListIcon,
  LockClosedIcon,
  CheckCircleIcon,
  StarIcon,
  GlobeAltIcon,
  ShareIcon
} from '@heroicons/react/24/solid';

// --- Components ---

const Waveform = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className={`flex items-center justify-center gap-1 h-12 ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="w-2 bg-red-400 rounded-full animate-wave"
          style={{
            height: '100%',
            animation: isActive ? `wave 1s ease-in-out infinite` : 'none',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

const MarkdownRenderer = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        
        // Headers
        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-cyan-100 mt-4">{formatInline(line.replace('### ', ''))}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-6 border-b border-slate-700 pb-2">{formatInline(line.replace('## ', ''))}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">{formatInline(line.replace('# ', ''))}</h1>;
        
        // List items (Handles both - and * for bullets)
        // Check if it starts with "- " OR "* " (but not "**" which is bold)
        if (trimmed.startsWith('- ') || (trimmed.startsWith('* ') && !trimmed.startsWith('**'))) {
            const content = trimmed.substring(2);
            return (
                <div key={i} className="flex gap-3 ml-2">
                    <span className="text-cyan-500 mt-1.5">•</span>
                    <p className="text-slate-300 leading-relaxed flex-1">{formatInline(content)}</p>
                </div>
            )
        }
        
        // Numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
             return (
                <div key={i} className="flex gap-3 ml-2">
                    <span className="text-cyan-500 font-mono text-sm mt-1">{trimmed.split('.')[0]}.</span>
                    <p className="text-slate-300 leading-relaxed flex-1">{formatInline(trimmed.replace(/^\d+\.\s/, ''))}</p>
                </div>
            )
        }
        
        // Empty lines
        if (!trimmed) return <div key={i} className="h-2"></div>;
        
        // Paragraphs
        return <p key={i} className="text-slate-300 leading-relaxed">{formatInline(line)}</p>;
      })}
    </div>
  );
};

// Helper to handle bold/italic in a very simple way
const formatInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="text-cyan-200 font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="text-slate-400 italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

const UpsellModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <LockClosedIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Go Viral. Save Time.</h2>
          <p className="text-blue-100 text-sm">Automate your personal brand & workflow.</p>
        </div>

        {/* Features */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
             <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-green-500/20 rounded-full">
                <CheckCircleIcon className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Social Scheduling</h4>
                <p className="text-xs text-slate-400">Post directly to LinkedIn & X (Twitter) with one click.</p>
              </div>
            </div>
             <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-green-500/20 rounded-full">
                <CheckCircleIcon className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Blog Publishing</h4>
                <p className="text-xs text-slate-400">Push drafted articles to WordPress, Medium, or Ghost.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-green-500/20 rounded-full">
                <CheckCircleIcon className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Workflow Sync</h4>
                <p className="text-xs text-slate-400">Sync notes to Notion, Jira, and Slack instantly.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            <button className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors mb-3 flex items-center justify-center gap-2">
              <StarIcon className="w-5 h-5 text-yellow-600" />
              Upgrade to Pro - $9/mo
            </button>
            <button 
              onClick={onClose}
              className="w-full text-slate-500 text-sm hover:text-slate-300 transition-colors"
            >
              No thanks, I'll copy-paste manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  // Application State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState(''); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [showUpsell, setShowUpsell] = useState(false);

  // Configuration State
  const [config, setConfig] = useState<ProcessingConfig>({
    docType: DocType.DESIGN_FEEDBACK,
    length: DocLength.DETAILED,
    style: WritingStyle.PROFESSIONAL
  });

  const recognitionRef = useRef<any>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalChunk) {
            setFinalTranscript(prev => prev + ' ' + finalChunk);
        }
        setTranscript(interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
            setError("Microphone access denied. Please allow permissions.");
            setIsRecording(false);
        }
      };
    } else {
      setError("Your browser does not support Speech Recognition. Please use Chrome or Safari.");
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      handleProcess();
    } else {
      setError(null);
      setTranscript('');
      setFinalTranscript('');
      setResult('');
      setIsEditingTranscript(false);
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleProcess = useCallback(async (manualText?: string) => {
    const textToProcess = manualText !== undefined ? manualText : (finalTranscript + ' ' + transcript).trim();
    if (manualText === undefined) {
        setEditableTranscript(textToProcess);
    }

    if (!textToProcess) return;

    setIsProcessing(true);
    setResult(''); 
    
    try {
      const generatedContent = await processTranscript(textToProcess, config);
      setResult(generatedContent);
      setIsEditingTranscript(false);
      
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err) {
      setError("Failed to process. Please check your network or API Key.");
    } finally {
      setIsProcessing(false);
    }
  }, [finalTranscript, transcript, config]);

  const handleRegenerate = () => {
    handleProcess(editableTranscript);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    const btn = document.getElementById('copy-btn');
    if(btn) {
        const originalText = btn.innerText;
        btn.innerText = "Copied!";
        setTimeout(() => btn.innerText = originalText, 2000);
    }
  };

  const downloadResult = () => {
      const blob = new Blob([result], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocalize-${config.docType.toLowerCase().replace(/\s/g, '-')}-${new Date().toISOString().slice(0,10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleUpsell = () => {
    setShowUpsell(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 md:px-8 selection:bg-cyan-500/30 selection:text-cyan-100">
      
      <UpsellModal isOpen={showUpsell} onClose={() => setShowUpsell(false)} />

      {/* Header */}
      <div className={`w-full max-w-3xl mb-8 text-center transition-all duration-500 ${isRecording ? 'opacity-50 scale-95 blur-[2px]' : 'opacity-100'}`}>
        <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-6 tracking-tighter">
          Vocalize
        </h1>
        <p className="text-slate-300 text-xl md:text-2xl font-light leading-relaxed max-w-2xl mx-auto">
          Stop typing. Just talk. <br/>
          <span className="text-slate-500 text-lg">We turn your rambling voice notes into structured <span className="text-cyan-400 font-semibold">docs</span>, viral <span className="text-purple-400 font-semibold">tweets</span>, and blog <span className="text-green-400 font-semibold">posts</span>.</span>
        </p>
      </div>

      {/* Main Interaction Zone */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-12 w-full">
        
        {/* Waveform Visualizer */}
        <div className="h-16 mb-4 flex items-end">
            <Waveform isActive={isRecording} />
        </div>

        {/* The Big Button */}
        <div className="relative group">
            {/* Glow Effect */}
            <div className={`absolute -inset-1 rounded-full blur-xl opacity-40 transition-all duration-500
                ${isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-cyan-500 group-hover:opacity-70 group-hover:scale-105'}
            `}></div>
            
            <button
            onClick={toggleRecording}
            disabled={isProcessing}
            className={`
                relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-4
                ${isRecording 
                    ? 'bg-slate-900 border-red-500 text-red-500 scale-105' 
                    : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-cyan-400 hover:border-cyan-400 hover:text-cyan-300 hover:-translate-y-1'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed border-slate-700' : ''}
            `}
            >
            {isProcessing ? (
                <ArrowPathIcon className="w-10 h-10 animate-spin text-slate-400" />
            ) : isRecording ? (
                <StopIcon className="w-10 h-10" />
            ) : (
                <MicrophoneIcon className="w-10 h-10" />
            )}
            </button>
        </div>

        {/* Instructions / Status */}
        <div className="mt-8 text-center h-8">
            {isRecording ? (
                 <p className="text-red-400 font-medium tracking-wide animate-pulse uppercase text-sm">Recording in Progress</p>
            ) : isProcessing ? (
                <p className="text-cyan-400 font-medium tracking-wide animate-pulse uppercase text-sm">Processing thoughts...</p>
            ) : (
                <p className="text-slate-500 text-sm font-medium">Tap to start • Tap to stop & generate</p>
            )}
        </div>
      </div>

      {/* Configuration Panel */}
      <div className={`w-full max-w-4xl transition-all duration-500 ease-in-out ${isRecording ? 'opacity-20 pointer-events-none blur-sm grayscale' : 'opacity-100'}`}>
        <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl rounded-2xl p-1 shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700/50">
                <div className="p-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4">
                        <DocumentTextIcon className="w-4 h-4" /> Output Format
                    </label>
                    <div className="space-y-1">
                        {Object.values(DocType).map((type) => (
                        <button
                            key={type}
                            onClick={() => setConfig({ ...config, docType: type })}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                            config.docType === type 
                                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shadow-lg shadow-cyan-900/20 font-medium' 
                                : 'hover:bg-slate-700/50 text-slate-400'
                            }`}
                        >
                            {type}
                        </button>
                        ))}
                    </div>
                </div>
                <div className="p-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-4">
                        <SparklesIcon className="w-4 h-4" /> Writing Style
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {Object.values(WritingStyle).map((style) => (
                        <button
                            key={style}
                            onClick={() => setConfig({ ...config, style })}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                            config.style === style
                                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-lg shadow-purple-900/20 font-medium'
                                : 'hover:bg-slate-700/50 text-slate-400'
                            }`}
                        >
                            {style}
                        </button>
                        ))}
                    </div>
                </div>
                <div className="p-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4">
                        <DocumentTextIcon className="w-4 h-4" /> Detail Level
                    </label>
                    <div className="flex flex-col gap-2">
                        {Object.values(DocLength).map((len) => (
                        <button
                            key={len}
                            onClick={() => setConfig({ ...config, length: len })}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                            config.length === len
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-lg shadow-emerald-900/20 font-medium'
                                : 'hover:bg-slate-700/50 text-slate-400'
                            }`}
                        >
                            {len}
                        </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Live Transcript Display */}
      {(transcript || finalTranscript) && isRecording && (
        <div className="fixed bottom-10 left-0 right-0 mx-auto w-full max-w-2xl px-6 pointer-events-none z-50">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-2xl text-center">
                <p className="text-slate-300 text-lg leading-relaxed font-light">
                   <span className="opacity-60">{finalTranscript}</span> 
                   <span className="text-cyan-400 font-medium">{transcript}</span>
                </p>
            </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div ref={resultRef} className="w-full max-w-4xl mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Actions Bar */}
            <div className="flex justify-between items-end mb-4 px-2">
                <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-purple-400" /> 
                    Generated Output
                </h2>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            isEditingTranscript 
                            ? 'bg-slate-700 border-slate-600 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        {isEditingTranscript ? <XMarkIcon className="w-4 h-4" /> : <PencilSquareIcon className="w-4 h-4" />}
                        {isEditingTranscript ? 'Cancel Edit' : 'Refine Input'}
                    </button>
                    <button 
                        onClick={downloadResult}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 font-medium transition-colors"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download
                    </button>
                    <button 
                        id="copy-btn"
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm text-white font-bold transition-colors shadow-lg shadow-cyan-900/20"
                    >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                        Copy
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                
                {/* Editing Mode */}
                {isEditingTranscript && (
                    <div className="p-6 bg-slate-900/50 border-b border-slate-700">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Original Transcript</h3>
                            <span className="text-xs text-slate-500">Edit any mistakes below</span>
                        </div>
                        <textarea
                            value={editableTranscript}
                            onChange={(e) => setEditableTranscript(e.target.value)}
                            className="w-full h-40 bg-slate-900 border border-slate-600 rounded-lg p-4 text-slate-300 text-sm leading-relaxed focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-y"
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleRegenerate}
                                disabled={isProcessing}
                                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                <ArrowPathIcon className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                                Regenerate Document
                            </button>
                        </div>
                    </div>
                )}

                {/* Document Display */}
                <div className="p-8 md:p-12 min-h-[300px] bg-slate-800/50">
                    <MarkdownRenderer content={result} />
                </div>
                
                {/* Integration Footer (Upsell) */}
                <div className="bg-slate-900/80 p-5 border-t border-slate-700/50">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Export & Schedule</p>
                    <div className="flex flex-wrap gap-3">
                        {/* Work Buttons */}
                         <button 
                            onClick={handleUpsell}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-900 text-sm font-bold hover:bg-white hover:scale-[1.02] transition-all shadow-lg shadow-slate-900/20"
                        >
                            <QueueListIcon className="w-4 h-4" />
                            Notion
                        </button>
                        
                        {/* Social Buttons */}
                        <button 
                            onClick={handleUpsell}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0077B5] text-white text-sm font-bold hover:bg-[#0077B5]/90 hover:scale-[1.02] transition-all shadow-lg shadow-blue-900/20"
                        >
                            <ShareIcon className="w-4 h-4" />
                            Post to LinkedIn
                        </button>
                         <button 
                            onClick={handleUpsell}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-black text-white border border-slate-700 text-sm font-bold hover:bg-slate-900 hover:scale-[1.02] transition-all shadow-lg"
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                            Post to X
                        </button>
                         <button 
                            onClick={handleUpsell}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 text-white text-sm font-bold hover:bg-slate-600 hover:scale-[1.02] transition-all shadow-lg"
                        >
                            <GlobeAltIcon className="w-4 h-4" />
                            Publish to Blog
                        </button>
                    </div>
                </div>
                
                {/* Meta Footer */}
                 <div className="bg-slate-900/50 px-5 py-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-600">
                    <span>Generated with Gemini 1.5 Flash</span>
                    <span>{new Date().toLocaleDateString()} • {editableTranscript.length} chars</span>
                </div>
            </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-8 right-8 z-50 bg-red-900/90 text-red-100 px-6 py-4 rounded-xl shadow-2xl border border-red-700 animate-in slide-in-from-bottom-4 duration-300">
          <p className="font-medium">{error}</p>
        </div>
      )}

    </div>
  );
};

export default App;