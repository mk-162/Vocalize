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
  ChevronDownIcon
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
            <div className="w-8 h-8 rounded-full bg-ink-base border border-ink-border flex items-center justify-center text-oxide-red flex-shrink-0">
              <ClockIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-paper-text text-sm">30-Minute Recording</h4>
              <p className="text-xs text-paper-muted leading-relaxed mt-1">Increase your limit from 2:00 to 30:00 per session.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-ink-base border border-ink-border flex items-center justify-center text-oxide-red flex-shrink-0">
              <QueueListIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-paper-text text-sm">Cloud History</h4>
              <p className="text-xs text-paper-muted leading-relaxed mt-1">Automatically save all your transcripts and drafts.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-ink-base border border-ink-border flex items-center justify-center text-oxide-red flex-shrink-0">
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
    // Toast logic could go here
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
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');

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
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= currentLimit) {
            toggleRecording();
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
  }, [isRecording, currentLimit, isPro]);

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

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      handleProcess();
    } else {
      setFinalTranscript('');
      setTranscript('');
      setResult('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleProcess = async () => {
    const text = (finalTranscript + ' ' + transcript).trim();
    if (!text) return;
    setIsProcessing(true);
    try {
      const content = await processTranscript(text, config);
      setResult(content);
      // Auto-scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
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
      <main className="flex-1 w-full max-w-3xl mx-auto pt-32 pb-20 px-6 flex flex-col items-center gap-8 md:gap-12">

        {/* Hero Copy */}
        <div className="text-center space-y-2 mb-2 animate-in fade-in slide-in-from-top-4 duration-700">
          <p className="text-3xl md:text-4xl text-paper-text font-light italic">
            Stop typing. Just talk.
          </p>
        </div>

        {/* --- THE INSTRUMENT CORE --- */}
        <div className="flex flex-col items-center gap-6 w-full max-w-md">

          {/* 1. Record Button */}
          <div className="relative group z-10">
            {/* Active Glow */}
            <div className={`absolute -inset-10 rounded-full blur-3xl opacity-20 transition-all duration-500 ${isRecording ? 'bg-oxide-red scale-110' : 'bg-transparent'}`} />

            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`
                  relative w-28 h-28 rounded-full border border-ink-border transition-all duration-200 ease-out 
                  flex items-center justify-center shadow-2xl overflow-hidden
                  ${isRecording
                  ? 'bg-ink-surface border-oxide-red shadow-[0_0_50px_rgba(234,88,12,0.2)] scale-105'
                  : 'bg-ink-surface hover:bg-ink-surface/80 hover:border-paper-muted hover:-translate-y-0.5'}
                `}
            >
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <>
                    <StopIcon className="w-8 h-8 text-oxide-red" />
                    <MechanicalMeter isActive={true} />
                  </>
                ) : (
                  <MicrophoneIcon className="w-8 h-8 text-paper-muted group-hover:text-paper-text transition-colors" />
                )}
              </div>
            </button>
          </div>

          {/* 2. Transcript & Output Display (Between Mic and Timer) */}
          <div className="w-full min-h-[140px] relative">
            {/* Placeholder / Empty State */}
            {!result && !isRecording && !isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 border border-dashed border-ink-border rounded-sm opacity-50">
                <p className="text-sm text-paper-muted mb-2 font-sans">Ready to capture.</p>
                <p className="text-[10px] uppercase tracking-widest text-paper-muted/60">Defaults: Summary / Conversational</p>
              </div>
            )}

            {/* Active Transcript / Processing */}
            {(isRecording || isProcessing) && !result && (
              <div className="w-full h-full p-6 bg-ink-surface/50 border border-ink-border rounded-sm backdrop-blur-sm animate-in fade-in">
                <div className="flex items-center gap-3 text-oxide-red font-mono text-[10px] uppercase tracking-widest mb-3">
                  {isProcessing ? '/// PROCESSING...' : '/// RECORDING...'}
                </div>
                <p className="font-serif text-lg leading-relaxed text-paper-text line-clamp-4">
                  {finalTranscript} <span className="text-paper-muted/70">{transcript}</span>
                </p>
              </div>
            )}

            {/* Final Result */}
            {result && (
              <div ref={resultRef} className="w-full bg-ink-surface border border-ink-border rounded-sm p-8 shadow-2xl relative group animate-in zoom-in-95 duration-300">
                {/* Result Header */}
                <div className="absolute top-0 left-0 right-0 h-10 border-b border-ink-border bg-ink-base/50 flex items-center justify-between px-4">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-oxide-red/40" />
                    <div className="w-2 h-2 rounded-full bg-paper-muted/20" />
                    <div className="w-2 h-2 rounded-full bg-paper-muted/20" />
                  </div>
                  <CopyButton text={result} />
                </div>

                {/* Result Content */}
                <div className="mt-8 mb-4 prose prose-invert prose-p:text-paper-text prose-headings:font-normal prose-sm max-w-none font-serif leading-relaxed">
                  <p className="whitespace-pre-wrap">{result}</p>
                </div>

                {/* Result Footer: Integrations & Upgrade */}
                <div className="border-t border-ink-border pt-4 mt-6">
                  {!isPro && (
                    <button onClick={() => { setUpsellMode('UPGRADE'); setShowUpsell(true); }} className="w-full flex items-center justify-between bg-ink-base p-3 rounded-sm border border-ink-border hover:border-oxide-red transition-colors group/banner mb-4">
                      <span className="text-[10px] uppercase font-bold text-paper-muted group-hover/banner:text-oxide-red">Unlock Full History & Integrations</span>
                      <span className="text-[10px] uppercase font-bold text-oxide-red flex items-center gap-1">Upgrade <StarIcon className="w-3 h-3" /></span>
                    </button>
                  )}

                  <div className="flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-paper-muted self-center">Send to:</span>
                    <div className="flex gap-3">
                      <button onClick={() => setShowUpsell(true)} className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-paper-muted hover:text-paper-text hover:underline transition-all">
                        <QueueListIcon className="w-3 h-3" /> Notion
                      </button>
                      <button onClick={() => setShowUpsell(true)} className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-paper-muted hover:text-paper-text hover:underline transition-all">
                        <ShareIcon className="w-3 h-3" /> LinkedIn
                      </button>
                      <button onClick={() => setShowUpsell(true)} className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-paper-muted hover:text-paper-text hover:underline transition-all">
                        <GlobeAltIcon className="w-3 h-3" /> WordPress
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Timer & Limits */}
          <div className="w-full flex items-center gap-4">
            <span className="text-[10px] font-mono text-paper-muted">{Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}</span>

            {/* Progress Bar */}
            <div className="flex-1 h-1 bg-ink-surface border border-ink-border rounded-full relative overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${recordingSeconds > FREE_LIMIT * 0.9 && !isPro ? 'bg-red-500 animate-pulse' : 'bg-oxide-red'}`}
                style={{ width: `${Math.min((recordingSeconds / currentLimit) * 100, 100)}%` }}
              />
            </div>

            {isPro ? (
              <span className="text-[10px] font-sans font-bold text-oxide-red uppercase tracking-wider">PRO 30:00</span>
            ) : (
              <button onClick={() => { setUpsellMode('UPGRADE'); setShowUpsell(true); }} className="text-[9px] font-sans font-bold text-paper-muted hover:text-oxide-red transition-colors uppercase tracking-wider whitespace-nowrap">
                Limit 2:00 <span className="underline decoration-oxide-red">Upgrade</span>
              </button>
            )}
          </div>

        </div>

        {/* 5. Configuration Deck (Visible) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl border-t border-ink-border pt-8 pb-12">
          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-paper-muted flex items-center gap-2">
              <span className="w-1 h-1 bg-oxide-red rounded-full"></span> Output Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['SUMMARY', 'DESIGN_FEEDBACK', 'MEETING_NOTES', 'EMAIL_DRAFT'].map((t) => (
                <button
                  key={t}
                  onClick={() => setConfig({ ...config, docType: t as DocType })}
                  className={`
                    h-10 w-full btn-instrument flex items-center justify-center text-[10px]
                    ${config.docType === t ? 'btn-instrument-active' : ''}
                  `}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-paper-muted flex items-center gap-2">
              <span className="w-1 h-1 bg-oxide-red rounded-full"></span> Writing Style
            </label>
            <div className="grid grid-cols-1 gap-2">
              {['CONVERSATIONAL', 'PROFESSIONAL', 'DIRECT', 'CREATIVE'].map((s) => (
                <button
                  key={s}
                  onClick={() => setConfig({ ...config, style: s as WritingStyle })}
                  className={`
                    h-10 w-full btn-instrument flex items-center justify-center text-[10px]
                    ${config.style === s ? 'btn-instrument-active' : ''}
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
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
