'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { processTranscript } from './actions/gemini';
import { DocType, WritingStyle, ProcessingConfig } from '@/types';
import { createClient } from '@/lib/supabase/client';
import {
  LockClosedIcon,
  StarIcon,
  QueueListIcon,
  ShareIcon,
  GlobeAltIcon,
  MicrophoneIcon,
  StopIcon,
  ClockIcon,
  ArchiveBoxIcon,
  ChevronDownIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';

// --- Components ---

const MechanicalMeter = ({ isActive }: { isActive: boolean }) => {
  const [bars, setBars] = useState<number[]>(new Array(6).fill(1));

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setBars(prev => prev.map(() => Math.max(2, Math.floor(Math.random() * 10))));
      }, 100);
    } else {
      setBars(new Array(6).fill(1));
    }
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="flex items-end gap-0.5 h-4">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-1 bg-oxide-red transition-all duration-75 ease-out rounded-t-sm"
          style={{ height: `${height * 10}%`, opacity: isActive ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
};

const UpsellModal = ({ isOpen, onClose, onUpgrade, mode = 'UPGRADE' }: { isOpen: boolean; onClose: () => void; onUpgrade: () => void; mode?: 'UPGRADE' | 'HISTORY' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-base/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-ink-surface border border-ink-border rounded-sm max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        {/* Header */}
        <div className="bg-ink-base p-6 text-center border-b border-ink-border">
          <div className="mx-auto w-10 h-10 border border-ink-border rounded-full flex items-center justify-center mb-4 text-paper-muted">
            {mode === 'HISTORY' ? <ArchiveBoxIcon className="w-5 h-5" /> : <LockClosedIcon className="w-5 h-5" />}
          </div>
          <h2 className="text-xl font-medium text-paper-text tracking-tight mb-1">
            {mode === 'HISTORY' ? 'History is a Pro Feature' : 'Upgrade to Pro'}
          </h2>
          <p className="text-paper-muted text-xs uppercase tracking-widest">
            {mode === 'HISTORY' ? 'Save & Organise Your Thinking' : 'Unlocking Advanced Tools'}
          </p>
        </div>

        {/* Features */}
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-ink-base border border-ink-border flex items-center justify-center text-oxide-red shrink-0">
              <ClockIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-paper-text text-sm">30-Minute Recording</h4>
              <p className="text-xs text-paper-muted leading-relaxed mt-1">Increase your limit from 2:00 to 30:00 per session.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-ink-base border border-ink-border flex items-center justify-center text-oxide-red shrink-0">
              <QueueListIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-paper-text text-sm">Cloud History</h4>
              <p className="text-xs text-paper-muted leading-relaxed mt-1">Automatically save all your transcripts and drafts.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-ink-base border border-ink-border flex items-center justify-center text-oxide-red shrink-0">
              <ShareIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-paper-text text-sm">Direct Integrations</h4>
              <p className="text-xs text-paper-muted leading-relaxed mt-1">Send drafts directly to Notion, LinkedIn & WordPress.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-ink-base border-t border-ink-border flex flex-col gap-3">
          <button
            onClick={onUpgrade}
            className="w-full bg-oxide-red hover:bg-orange-700 text-white font-medium py-3 rounded-sm transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-lg shadow-oxide-red/20"
          >
            <StarIcon className="w-4 h-4" />
            Upgrade - $9/mo
          </button>
          <button
            onClick={onClose}
            className="w-full text-paper-muted text-xs hover:text-paper-text transition-colors uppercase tracking-widest"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = (mode: 'TEXT' | 'MARKDOWN') => {
    navigator.clipboard.writeText(text);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => handleCopy('TEXT')}
        className="flex items-center gap-2 bg-oxide-red hover:bg-orange-700 text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-sm transition-colors"
      >
        Copy
        <div
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="border-l border-white/20 pl-2 ml-1 hover:bg-white/10 h-full flex items-center"
        >
          <ChevronDownIcon className="w-3 h-3" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-ink-surface border border-ink-border shadow-xl rounded-sm z-50 flex flex-col">
          <button onClick={() => handleCopy('TEXT')} className="text-left px-3 py-2 text-[10px] uppercase font-bold text-paper-muted hover:text-paper-text hover:bg-ink-base transition-colors">
            Plain Text
          </button>
          <button onClick={() => handleCopy('MARKDOWN')} className="text-left px-3 py-2 text-[10px] uppercase font-bold text-paper-muted hover:text-paper-text hover:bg-ink-base transition-colors">
            Markdown
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  // App State
  // 'CONFIG' | 'RECORDING' | 'GENERATING' | 'RESULT'
  const [appState, setAppState] = useState<'CONFIG' | 'RECORDING' | 'GENERATING' | 'RESULT'>('CONFIG');

  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  // UI & Tier State
  const [isPro, setIsPro] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellMode, setUpsellMode] = useState<'UPGRADE' | 'HISTORY'>('UPGRADE');

  // Configuration
  const [config, setConfig] = useState<ProcessingConfig>({
    docType: 'SUMMARY',
    length: 'BALANCED',
    style: 'CONVERSATIONAL'
  });

  const recognitionRef = useRef<any>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Constants
  const FREE_LIMIT = 120; // 2 minutes
  const PRO_LIMIT = 1800; // 30 minutes
  const currentLimit = isPro ? PRO_LIMIT : FREE_LIMIT;

  // Auth Check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
        if (data) setIsPro(data.is_pro);
      }
    };
    checkUser();
  }, [supabase]);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (appState === 'RECORDING') {
      interval = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= currentLimit) {
            stopRecording();
            if (!isPro) {
              setUpsellMode('UPGRADE');
              setShowUpsell(true);
            }
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [appState, currentLimit, isPro]);

  // Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
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
        if (finalChunk) setFinalTranscript(prev => prev + ' ' + finalChunk);
        setTranscript(interimTranscript);
      };
    }
  }, []);

  const startRecording = () => {
    setFinalTranscript('');
    setTranscript('');
    setResult('');
    setError(null);
    recognitionRef.current?.start();
    setAppState('RECORDING');
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setAppState('GENERATING');
    handleProcess();
  };

  const handleProcess = async () => {
    const text = (finalTranscript + ' ' + transcript).trim();
    if (!text) {
      // Did not capture audio
      setAppState('CONFIG');
      return;
    }

    try {
      // Simulate delay for animation if API is too fast
      const [content] = await Promise.all([
        processTranscript(text, config),
        new Promise(resolve => setTimeout(resolve, 1500)) // Min 1.5s animation
      ]);

      setResult(content);
      setAppState('RESULT');

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 500);

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An error occurred");
      setAppState('RESULT'); // Show error state
    }
  };

  const handleUpgrade = () => {
    alert("Redirecting to Lemon Squeezy Checkout...");
    setShowUpsell(false);
  };

  const handleViewOutput = () => {
    if (isPro) {
      alert("Opening History Sidebar (Coming Soon)");
    } else {
      setUpsellMode('HISTORY');
      setShowUpsell(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-serif bg-ink-base text-paper-text selection:bg-oxide-red selection:text-white overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-base/90 backdrop-blur-md border-b border-ink-border h-16">
        <div className="w-full max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-serif tracking-tight cursor-default">Vocalize.</h1>
            <span className="hidden md:inline text-[10px] font-sans uppercase tracking-[0.2em] text-paper-muted opacity-60">System v2.0</span>
          </div>

          <nav className="flex items-center gap-6 text-[10px] font-sans font-bold uppercase tracking-[0.15em]">
            <button onClick={handleViewOutput} className="hidden md:flex items-center gap-1.5 hover:text-oxide-red transition-colors text-paper-muted">
              <ArchiveBoxIcon className="w-3 h-3" /> View Data
            </button>

            {!isPro && (
              <button onClick={() => { setUpsellMode('UPGRADE'); setShowUpsell(true); }} className="text-oxide-red hover:text-white transition-colors flex items-center gap-1">
                <StarIcon className="w-3 h-3" /> Upgrade
              </button>
            )}

            {user ? (
              <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="text-paper-muted hover:text-paper-text transition-colors">
                Log Out
              </button>
            ) : (
              <button onClick={() => router.push('/login')} className="bg-paper-text text-ink-base px-5 py-1.5 rounded-sm hover:bg-white transition-colors">
                Log In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto pt-24 pb-20 px-6 flex flex-col items-center gap-6">

        {/* Hero Copy (Simplified) */}
        <div className="text-center space-y-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <p className="text-3xl md:text-4xl text-paper-text font-light italic">
            Stop typing. Just talk.
          </p>
        </div>

        {/* --- THE INSTRUMENT BOX (Unified Interface) --- */}
        <div className="w-full bg-ink-surface/30 border border-ink-border/50 rounded-sm relative overflow-hidden transition-all duration-500 min-h-[400px] flex flex-col">

          {/* STATE: GENERATING ANIMATION */}
          {appState === 'GENERATING' && (
            <div className="absolute inset-0 bg-ink-base z-20 flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="relative">
                <div className="absolute -inset-4 bg-oxide-red/20 blur-xl rounded-full animate-pulse" />
                <SparklesIcon className="w-12 h-12 text-oxide-red animate-spin-slow" />
              </div>
              <p className="mt-6 text-xs font-mono uppercase tracking-[0.3em] text-paper-muted animate-pulse">
                Structuring Thought...
              </p>
            </div>
          )}

          {/* HEADER OF BOX: Timer & Controls */}
          <div className="h-14 border-b border-ink-border flex items-center justify-between px-6 bg-ink-surface/50">
            <div className="flex items-center gap-4">
              {/* Timer */}
              <span className={`text-[12px] font-mono ${appState === 'RECORDING' ? 'text-oxide-red font-bold animate-pulse' : 'text-paper-muted'}`}>
                {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
              </span>

              {/* Progress Bar */}
              <div className="w-24 md:w-48 h-1 bg-ink-base border border-ink-border rounded-full relative overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${recordingSeconds > FREE_LIMIT * 0.9 && !isPro ? 'bg-red-500 animate-pulse' : 'bg-oxide-red'}`}
                  style={{ width: `${Math.min((recordingSeconds / currentLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* State Indicators */}
            <div className="flex items-center gap-3">
              {appState === 'RECORDING' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-oxide-red/10 border border-oxide-red/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-oxide-red animate-pulse" />
                  <span className="text-[9px] uppercase tracking-widest font-bold text-oxide-red">Live Input</span>
                </div>
              )}
              {!isPro && appState !== 'RECORDING' && (
                <span className="text-[9px] uppercase tracking-widest font-bold text-paper-muted">2:00 Limit</span>
              )}
            </div>
          </div>

          {/* BODY OF BOX */}
          <div className="flex-1 relative flex flex-col">

            {/* 1. CONFIG STATE (Ready) */}
            {appState === 'CONFIG' && (
              <div className="flex-1 flex flex-col md:flex-row animate-in fade-in duration-500">
                {/* LEFT: Record Trigger */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 border-r border-ink-border/50">
                  <div className="relative group cursor-pointer" onClick={startRecording}>
                    <div className="absolute -inset-8 bg-oxide-red/5 rounded-full blur-xl group-hover:bg-oxide-red/10 transition-all duration-500" />
                    <button
                      className="relative w-24 h-24 rounded-full bg-ink-surface border border-ink-border shadow-2xl flex items-center justify-center group-hover:scale-105 group-hover:border-paper-muted transition-all duration-300"
                    >
                      <MicrophoneIcon className="w-8 h-8 text-paper-muted group-hover:text-paper-text transition-colors" />
                    </button>
                  </div>
                  <p className="mt-8 text-sm font-serif italic text-paper-muted">"Tap to start..."</p>
                </div>

                {/* RIGHT: Configuration Grid (2x2) */}
                <div className="flex-1 p-8 grid grid-cols-2 gap-4 bg-ink-base/30">
                  {/* Doc Type Selector */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-paper-muted">Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['SUMMARY', 'EMAIL', 'NOTES', 'SOCIAL'].map((t) => {
                        // Mapping specific labels to internal types for cleaner UI
                        const typeMap: any = { 'SUMMARY': 'SUMMARY', 'EMAIL': 'EMAIL_DRAFT', 'NOTES': 'MEETING_NOTES', 'SOCIAL': 'LINKEDIN_POST' };
                        const isActive = config.docType === typeMap[t];
                        return (
                          <button
                            key={t}
                            onClick={() => setConfig({ ...config, docType: typeMap[t] })}
                            className={`h-10 text-[9px] font-bold uppercase tracking-wide border rounded-sm transition-all
                                                    ${isActive
                                ? 'bg-oxide-red text-white border-oxide-red'
                                : 'bg-transparent text-paper-muted border-ink-border hover:border-paper-muted hover:text-paper-text'}
                                                `}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Style Selector */}
                  <div className="col-span-2 space-y-2 mt-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-paper-muted">Tone</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['CASUAL', 'PRO', 'DIRECT', 'CREATIVE'].map((s) => {
                        const styleMap: any = { 'CASUAL': 'CONVERSATIONAL', 'PRO': 'PROFESSIONAL', 'DIRECT': 'DIRECT', 'CREATIVE': 'CREATIVE' };
                        const isActive = config.style === styleMap[s];
                        return (
                          <button
                            key={s}
                            onClick={() => setConfig({ ...config, style: styleMap[s] })}
                            className={`h-10 text-[9px] font-bold uppercase tracking-wide border rounded-sm transition-all
                                                    ${isActive
                                ? 'bg-ink-surface border-oxide-red text-oxide-red'
                                : 'bg-transparent text-paper-muted border-ink-border hover:border-paper-muted hover:text-paper-text'}
                                                `}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RECORDING STATE */}
            {appState === 'RECORDING' && (
              <div className="flex-1 flex flex-col relative animate-in zoom-in-95 duration-300">
                {/* Scrolling Text Field */}
                <div className="flex-1 p-8 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-ink-border scrollbar-track-transparent">
                  <p className="font-serif text-lg leading-relaxed text-paper-text/90 whitespace-pre-wrap">
                    {finalTranscript} <span className="text-paper-muted">{transcript}</span>
                    <span className="inline-block w-1.5 h-4 ml-1 bg-oxide-red animate-pulse align-middle" />
                  </p>
                </div>

                {/* Bottom Control Bar */}
                <div className="h-20 border-t border-ink-border bg-ink-base/80 backdrop-blur flex items-center justify-between px-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-ink-surface border border-ink-border flex items-center justify-center">
                      <StopIcon className="w-4 h-4 text-oxide-red animate-pulse" /> {/* Replaced mic with stop icon/eq concept */}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-paper-muted font-bold">Recording...</div>
                  </div>

                  {/* Main Stop Action */}
                  <button
                    onClick={stopRecording}
                    className="h-10 px-6 bg-oxide-red hover:bg-orange-700 text-white rounded-sm flex items-center gap-2 transition-all shadow-lg shadow-oxide-red/20"
                  >
                    <span className="text-[10px] uppercase tracking-widest font-bold">Finish</span>
                    <div className="w-4 h-4 rounded-sm bg-white/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-[1px]" />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 4. RESULT STATE */}
            {appState === 'RESULT' && (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Result Text */}
                <div ref={resultRef} className="flex-1 p-8 overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-ink-border scrollbar-track-transparent">
                  {error ? (
                    <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-sm">
                      <p className="text-sm text-red-200">{error}</p>
                      <button onClick={() => setAppState('CONFIG')} className="mt-4 text-xs text-red-500 underline">Reset</button>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-p:text-paper-text prose-headings:font-normal prose-sm max-w-none font-serif leading-relaxed">
                      <p className="whitespace-pre-wrap">{result}</p>
                    </div>
                  )}
                </div>

                {/* Result Actions Footer */}
                <div className="border-t border-ink-border p-4 bg-ink-base/50 flex flex-col md:flex-row gap-4 justify-between items-center">

                  <button onClick={() => { setAppState('CONFIG'); setResult(''); setFinalTranscript(''); }} className="text-[10px] uppercase font-bold text-paper-muted hover:text-paper-text transition-colors px-4">
                    ← New Note
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 border-r border-ink-border pr-4 mr-2">
                      <button onClick={() => setShowUpsell(true)} className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-ink-surface text-paper-muted hover:text-white transition-colors">
                        <QueueListIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => setShowUpsell(true)} className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-ink-surface text-paper-muted hover:text-white transition-colors">
                        <ShareIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => setShowUpsell(true)} className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-ink-surface text-paper-muted hover:text-white transition-colors">
                        <GlobeAltIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <CopyButton text={result} />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Helper Text below box */}
        {appState === 'CONFIG' && !isPro && (
          <div className="flex items-center gap-2 opacity-50 text-[10px] uppercase tracking-widest text-paper-muted">
            <span>•</span> Limit 2:00 per note <span>•</span>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-ink-border mt-auto bg-ink-base">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-widest text-paper-muted">
          <div className="flex gap-6">
            <a href="#" className="hover:text-paper-text transition-colors">Privacy</a>
            <a href="#" className="hover:text-paper-text transition-colors">Terms</a>
            <a href="#" className="hover:text-paper-text transition-colors">About</a>
          </div>
          <p className="opacity-50">© 2024 Vocalize Systems Inc.</p>
        </div>
      </footer>

      <UpsellModal
        isOpen={showUpsell}
        onClose={() => setShowUpsell(false)}
        onUpgrade={handleUpgrade}
        mode={upsellMode}
      />
    </div>
  );
}
