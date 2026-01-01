'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { processTranscript } from './actions/gemini';
import { DocType, DocLength, WritingStyle, ProcessingConfig } from '@/types';
import { createClient } from '@/lib/supabase/client';
import {
  SparklesIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  LockClosedIcon,
  StarIcon,
  ArrowPathIcon,
  XMarkIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  QueueListIcon,
  ShareIcon,
  GlobeAltIcon,
  MicrophoneIcon
} from '@heroicons/react/24/solid';

// --- Components ---

const MechanicalMeter = ({ isActive, volume }: { isActive: boolean; volume: number }) => {
  return (
    <div className="flex gap-0.5 h-6 items-end opacity-80">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`w-1 transition-mechanical ${isActive && i < volume ? 'bg-oxide-red h-full' : 'bg-ink-border h-1'
            }`}
        />
      ))}
    </div>
  );
};

const UpsellModal = ({ isOpen, onClose, onUpgrade }: { isOpen: boolean; onClose: () => void; onUpgrade: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-base/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-ink-surface border border-ink-border rounded-sm max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        {/* Header */}
        <div className="bg-ink-base p-6 text-center border-b border-ink-border">
          <div className="mx-auto w-10 h-10 border border-ink-border rounded-full flex items-center justify-center mb-4 text-paper-muted">
            <LockClosedIcon className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-medium text-paper-text tracking-tight mb-1">Upgrade to Pro</h2>
          <p className="text-paper-muted text-xs uppercase tracking-widest">Unlocking Advanced Tools</p>
        </div>

        {/* Features */}
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-oxide-red mt-0.5" />
            <div>
              <h4 className="font-medium text-paper-text text-sm">30-Minute Recording</h4>
              <p className="text-xs text-paper-muted leading-relaxed">Extended recording time for deep focus sessions.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-oxide-red mt-0.5" />
            <div>
              <h4 className="font-medium text-paper-text text-sm">Cloud History</h4>
              <p className="text-xs text-paper-muted leading-relaxed">Save and sync your sessions across devices.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-ink-base border-t border-ink-border flex flex-col gap-3">
          <button
            onClick={onUpgrade}
            className="w-full bg-oxide-red hover:bg-orange-700 text-white font-medium py-3 rounded-sm transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
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
  const [volume, setVolume] = useState(0);

  // UI & Tier State
  const [isPro, setIsPro] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showUpsell, setShowUpsell] = useState(false);

  // Configuration (Switches)
  const [config, setConfig] = useState<ProcessingConfig>({
    docType: 'DESIGN_FEEDBACK',
    length: 'DETAILED',
    style: 'PROFESSIONAL'
  });

  const recognitionRef = useRef<any>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Constants
  const FREE_LIMIT = 120;
  const PRO_LIMIT = 1800;
  const currentLimit = isPro ? PRO_LIMIT : FREE_LIMIT;

  // Auth Check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Check profile
        const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
        if (data) setIsPro(data.is_pro);
      }
    };
    checkUser();
  }, [supabase]);

  // Volume Simulation
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setVolume(Math.floor(Math.random() * 12));
      }, 100);
    } else {
      setVolume(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= currentLimit) {
            toggleRecording(); // Stop
            if (!isPro) setShowUpsell(true);
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

  // Speech Recognition Setup
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
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = () => {
    // Placeholder
    alert("Redirecting to Lemon Squeezy Checkout...");
    setShowUpsell(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  return (
    <div className="min-h-screen flex flex-col font-serif bg-ink-base selection:bg-oxide-red selection:text-white">

      {/* Header: Fixed Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-base/80 backdrop-blur-md border-b border-ink-border">
        <div className="w-full max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Branding Left */}
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-serif text-paper-text tracking-tight cursor-default select-none">Vocalize.</h1>
            <span className="hidden md:inline text-[10px] font-sans uppercase tracking-[0.2em] text-paper-muted opacity-60">System v2.0</span>
          </div>

          {/* Auth/Nav Right */}
          <nav className="flex items-center gap-6 text-[10px] font-sans font-bold uppercase tracking-[0.15em]">
            {!isPro && (
              <button onClick={() => setShowUpsell(true)} className="text-oxide-red hover:text-white transition-colors flex items-center gap-1">
                <StarIcon className="w-3 h-3" /> Upgrade
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-paper-muted hidden sm:inline">{user.email}</span>
                <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="text-paper-muted hover:text-paper-text transition-colors">
                  Log Out
                </button>
              </div>
            ) : (
              <button onClick={() => router.push('/login')} className="bg-paper-text text-ink-base px-4 py-1.5 rounded-sm hover:bg-white transition-colors">
                Log In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto pt-32 pb-20 px-6 flex flex-col items-center gap-12">

        {/* Hero Copy (Minimal) */}
        <div className="text-center space-y-2 mb-4">
          <p className="text-3xl text-paper-text font-light italic">
            Stop typing. Just talk.
          </p>
        </div>

        {/* 1. Record Controls (Central) */}
        <div className="flex flex-col items-center justify-center gap-8 w-full">

          {/* The Physical Switch */}
          <div className="relative group">
            {/* Ambient Light */}
            <div className={`absolute -inset-8 rounded-full blur-3xl opacity-10 transition-all duration-700 ${isRecording ? 'bg-oxide-red scale-125' : 'bg-transparent'}`} />

            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`
                  relative w-24 h-24 rounded-full border border-ink-border transition-all duration-200 ease-out 
                  flex items-center justify-center active:scale-95 z-10 shadow-xl
                  ${isRecording
                  ? 'bg-ink-surface border-oxide-red shadow-[0_0_50px_rgba(234,88,12,0.15)]'
                  : 'bg-ink-surface hover:bg-ink-surface/80 hover:border-paper-muted'}
                `}
            >
              {/* Icon Layer */}
              <div className={`transition-all duration-300 ${isRecording ? 'text-oxide-red scale-110' : 'text-paper-muted group-hover:text-paper-text'}`}>
                {isRecording ? (
                  <div className="w-6 h-6 bg-oxide-red rounded-sm shadow-[0_0_15px_rgba(234,88,12,0.5)]" />
                ) : (
                  <MicrophoneIcon className="w-8 h-8" />
                )}
              </div>
            </button>
          </div>

          {/* Status & Timer */}
          <div className="w-full max-w-[200px] flex flex-col items-center gap-2">
            <div className="w-full flex justify-between text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-paper-muted">
              <span className={isRecording ? 'text-oxide-red animate-pulse' : ''}>
                {isRecording ? '● Live Input' : 'Ready'}
              </span>
              <span className="font-mono">{Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}</span>
            </div>

            {/* Mechanical Progress Bar */}
            <div className="h-1 w-full bg-ink-surface border border-ink-border rounded-full relative overflow-hidden">
              <div
                className="h-full bg-oxide-red transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min((recordingSeconds / currentLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Integrations (Moved Up) */}
        <div className="w-full max-w-2xl py-6 border-y border-ink-border/50">
          <div className="flex flex-wrap justify-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-paper-muted self-center mr-2">Integrate:</span>
            <button onClick={() => setShowUpsell(true)} className="text-[10px] font-sans font-bold uppercase tracking-wider text-paper-muted hover:text-oxide-red transition-colors flex items-center gap-1.5">
              <QueueListIcon className="w-3 h-3" /> Notion
            </button>
            <span className="text-ink-border self-center">|</span>
            <button onClick={() => setShowUpsell(true)} className="text-[10px] font-sans font-bold uppercase tracking-wider text-paper-muted hover:text-oxide-red transition-colors flex items-center gap-1.5">
              <ShareIcon className="w-3 h-3" /> LinkedIn
            </button>
            <span className="text-ink-border self-center">|</span>
            <button onClick={() => setShowUpsell(true)} className="text-[10px] font-sans font-bold uppercase tracking-wider text-paper-muted hover:text-oxide-red transition-colors flex items-center gap-1.5">
              <GlobeAltIcon className="w-3 h-3" /> WordPress
            </button>
          </div>
        </div>

        {/* 3. Configuration Deck */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-paper-muted flex items-center gap-2">
              <span className="w-1 h-1 bg-oxide-red rounded-full"></span> Output Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['DESIGN_FEEDBACK', 'EMAIL_DRAFT', 'MEETING_NOTES', 'LINKEDIN_POST'].map((t) => (
                <button
                  key={t}
                  onClick={() => setConfig({ ...config, docType: t as DocType })}
                  className={`
                    h-9 w-full btn-instrument flex items-center justify-center text-[9px]
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
              {['PROFESSIONAL', 'DIRECT', 'CREATIVE'].map((s) => (
                <button
                  key={s}
                  onClick={() => setConfig({ ...config, style: s as WritingStyle })}
                  className={`
                    h-9 w-full btn-instrument flex items-center justify-center text-[9px]
                    ${config.style === s ? 'btn-instrument-active' : ''}
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Output Display */}
        {(result || isRecording || isProcessing) && (
          <div ref={resultRef} className="w-full animate-in fade-in duration-700 slide-in-from-bottom-8 border-t border-ink-border pt-12">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] uppercase tracking-widest text-paper-muted font-bold">Generated Output</span>
              {result && (
                <button onClick={copyToClipboard} className="text-[10px] uppercase tracking-widest text-oxide-red hover:text-white transition-colors flex items-center gap-1 font-bold">
                  [ Copy ]
                </button>
              )}
            </div>

            <div className="bg-ink-surface/30 p-8 rounded-sm border border-ink-border relative">
              {(isRecording || isProcessing) && !result && (
                <div className="space-y-4 opacity-70">
                  <div className="flex items-center gap-3 text-oxide-red font-mono text-xs uppercase tracking-widest">
                    {isProcessing ? '/// PROCESSING DATA...' : '/// RECORDING AUDIO...'}
                    <MechanicalMeter isActive={isRecording} volume={volume} />
                  </div>
                  <p className="text-lg text-paper-text leading-relaxed font-serif">
                    {finalTranscript} <span className="text-paper-muted">{transcript}</span>
                  </p>
                </div>
              )}

              {result && (
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed font-serif text-lg text-paper-text">
                    {result}
                  </p>
                </div>
              )}
            </div>
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
      />
    </div>
  );
}
