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
  GlobeAltIcon
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
    <div className="min-h-screen flex flex-col items-center py-12 px-6 font-serif bg-ink-base selection:bg-oxide-red selection:text-white">

      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-baseline mb-12 border-b border-ink-border pb-6">
        <h1 className="text-3xl font-normal tracking-tight text-paper-text">Vocalize.</h1>
        <div className="flex gap-6 text-xs font-sans uppercase tracking-widest text-paper-muted">
          <span>{user ? user.email : 'Guest Mode'}</span>
          {user && (
            <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="hover:text-oxide-red transition-colors">
              Eject
            </button>
          )}
          {!user && (
            <button onClick={() => router.push('/login')} className="hover:text-oxide-red transition-colors">
              Insert Card
            </button>
          )}
        </div>
      </header>

      {/* Main Panel */}
      <main className="w-full max-w-2xl flex flex-col gap-16">

        {/* 1. Record Controls (Central) */}
        <div className="flex flex-col items-center justify-center gap-8">

          {/* The Physical Switch */}
          <div className="relative group">
            {/* Glow / Shadow */}
            <div className={`absolute -inset-8 rounded-full blur-3xl opacity-20 transition-all duration-500 ${isRecording ? 'bg-oxide-red scale-110' : 'bg-transparent'}`} />

            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`
                  relative w-36 h-36 rounded-full border-[6px] transition-all duration-200 ease-out shadow-2xl
                  flex items-center justify-center active:scale-95
                  ${isRecording
                  ? 'bg-ink-surface border-oxide-red shadow-[0_0_40px_rgba(194,65,12,0.4)]'
                  : 'bg-ink-surface border-ink-border hover:border-paper-muted hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]'}
                `}
            >
              <div className={`w-24 h-24 rounded-full transition-all duration-300 flex items-center justify-center ${isRecording ? 'bg-oxide-red' : 'bg-ink-border group-hover:bg-paper-muted/20'
                }`}>
                {isRecording ? (
                  <div className="w-8 h-8 bg-white rounded-sm drop-shadow-md" /> // Stop Square
                ) : (
                  // Play Triangle - Oxide Orange
                  <div className="w-0 h-0 border-t-[14px] border-t-transparent border-l-[24px] border-l-oxide-red border-b-[14px] border-b-transparent ml-2 drop-shadow-sm" />
                )}
              </div>
            </button>
          </div>

          {/* Timer & Meter */}
          <div className="w-full max-w-[200px] space-y-3">
            <div className="flex justify-between text-[11px] uppercase tracking-widest font-mono text-paper-muted font-medium">
              <span className={isRecording ? 'text-oxide-red animate-pulse' : ''}>
                {isRecording ? '● ON AIR' : 'STANDBY'}
              </span>
              <span>{Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}</span>
            </div>

            {/* Mechanical Timer Bar */}
            <div className="h-3 w-full bg-ink-surface border border-ink-border rounded-sm relative overflow-hidden">
              <div
                className="h-full bg-oxide-red transition-all duration-1000 ease-linear opacity-80"
                style={{ width: `${Math.min((recordingSeconds / currentLimit) * 100, 100)}%` }}
              />
              {/* Ticks */}
              <div className="absolute inset-0 flex justify-between px-px opacity-30">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="w-px h-full bg-ink-base" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Control Layout */}
        <div className="flex flex-col gap-10 border-t border-ink-border pt-10">

          {/* Format Selection */}
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-widest text-paper-muted flex items-center gap-2">
              <DocumentDuplicateIcon className="w-3 h-3" /> Output Format
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['DESIGN_FEEDBACK', 'EMAIL_DRAFT', 'MEETING_NOTES', 'LINKEDIN_POST'].map((t) => (
                <button
                  key={t}
                  onClick={() => setConfig({ ...config, docType: t as DocType })}
                  className={`
                    h-12 px-2 text-xs font-sans font-bold tracking-wider uppercase border rounded-sm transition-all duration-100 active:translate-y-px
                    ${config.docType === t
                      ? 'bg-paper-text text-ink-base border-paper-text shadow-sm'
                      : 'bg-ink-surface border-ink-border text-paper-muted hover:border-paper-muted hover:text-paper-text'}
                  `}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-widest text-paper-muted flex items-center gap-2">
              <SparklesIcon className="w-3 h-3" /> Tone
            </label>
            <div className="flex gap-3">
              {['PROFESSIONAL', 'DIRECT', 'CREATIVE'].map((s) => (
                <button
                  key={s}
                  onClick={() => setConfig({ ...config, style: s as WritingStyle })}
                  className={`
                    flex-1 h-12 text-xs font-sans font-bold tracking-wider uppercase border rounded-sm transition-all duration-100 active:translate-y-px
                    ${config.style === s
                      ? 'bg-paper-text text-ink-base border-paper-text shadow-sm'
                      : 'bg-ink-surface border-ink-border text-paper-muted hover:border-paper-muted hover:text-paper-text'}
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Output - The Paper */}
        {(result || isRecording || isProcessing) && (
          <div ref={resultRef} className="animate-in fade-in duration-700 slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-4 border-b border-ink-border pb-2">
              <span className="text-[10px] uppercase tracking-widest text-paper-muted">Transcript Ref #001</span>
              {result && (
                <button onClick={copyToClipboard} className="text-[10px] uppercase tracking-widest text-oxide-red hover:text-white transition-colors flex items-center gap-1">
                  <ClipboardDocumentCheckIcon className="w-3 h-3" /> Copy
                </button>
              )}
            </div>

            <div className="min-h-[200px] pl-4 border-l border-ink-border relative">
              {(isRecording || isProcessing) && !result && (
                <div className="space-y-4 opacity-70">
                  <div className="flex items-center gap-3 text-oxide-red font-mono text-xs uppercase tracking-widest">
                    {isProcessing ? '• GENERATING...' : '• LISTENING...'}
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

            {result && (
              <div className="mt-8 pt-6 border-t border-ink-border flex gap-4 overflow-x-auto pb-2">
                <button onClick={() => setShowUpsell(true)} className="flex-shrink-0 px-4 py-2 bg-ink-surface border border-ink-border text-xs font-sans uppercase tracking-wider text-paper-muted hover:text-white hover:border-paper-muted transition-colors flex items-center gap-2">
                  <QueueListIcon className="w-3 h-3" /> Save to Notion
                </button>
                <button onClick={() => setShowUpsell(true)} className="flex-shrink-0 px-4 py-2 bg-ink-surface border border-ink-border text-xs font-sans uppercase tracking-wider text-paper-muted hover:text-white hover:border-paper-muted transition-colors flex items-center gap-2">
                  <ShareIcon className="w-3 h-3" /> LinkedIn
                </button>
                <button onClick={() => setShowUpsell(true)} className="flex-shrink-0 px-4 py-2 bg-ink-surface border border-ink-border text-xs font-sans uppercase tracking-wider text-paper-muted hover:text-white hover:border-paper-muted transition-colors flex items-center gap-2">
                  <GlobeAltIcon className="w-3 h-3" /> Blog
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      <UpsellModal
        isOpen={showUpsell}
        onClose={() => setShowUpsell(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
