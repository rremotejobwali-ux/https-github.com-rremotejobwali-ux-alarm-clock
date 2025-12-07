import React, { useEffect, useState } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { Alarm } from '../types';
import { generateWakeUpMessage } from '../services/geminiService';

// Custom Snooze Icon since it's not available in standard lucide-react exports
const SnoozeIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 4v16"/><path d="M2 8h16a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M13.26 3.26a2 2 0 0 0-2.83 0l-6.17 6.17"/>
  </svg>
);

interface RingingOverlayProps {
  alarm: Alarm | null;
  onSnooze: () => void;
  onDismiss: () => void;
}

export const RingingOverlay: React.FC<RingingOverlayProps> = ({ alarm, onSnooze, onDismiss }) => {
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (alarm && alarm.useAI && !aiMessage && !loading) {
      setLoading(true);
      generateWakeUpMessage(alarm.label, alarm.time)
        .then(msg => {
          setAiMessage(msg);
        })
        .catch(() => setAiMessage("Time to wake up!"))
        .finally(() => setLoading(false));
    }
  }, [alarm, aiMessage, loading]);

  // Reset state when alarm closes
  useEffect(() => {
    if (!alarm) {
      setAiMessage(null);
      setLoading(false);
    }
  }, [alarm]);

  if (!alarm) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
      
      {/* Pulse Rings */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="w-[500px] h-[500px] border-2 border-primary/20 rounded-full animate-ping opacity-20 duration-[2000ms]"></div>
        <div className="absolute w-[400px] h-[400px] border-2 border-primary/30 rounded-full animate-ping delay-300 opacity-20 duration-[2000ms]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-8 text-center space-y-8">
        <div className="bg-primary/20 p-8 rounded-full mb-4 animate-bounce">
          <Bell size={64} className="text-primary drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-8xl font-mono font-bold text-white tracking-tighter">
            {alarm.time}
          </h1>
          <h2 className="text-2xl text-indigo-200 font-medium tracking-wide">
            {alarm.label}
          </h2>
        </div>

        {/* AI Message Area */}
        <div className="min-h-[80px] flex items-center justify-center">
          {loading ? (
             <div className="flex items-center gap-2 text-white/50">
               <Loader2 className="animate-spin" size={20} />
               <span className="text-sm">Generating briefing...</span>
             </div>
          ) : aiMessage ? (
             <p className="text-lg md:text-xl text-white font-light italic leading-relaxed animate-in slide-in-from-bottom-4">
               "{aiMessage}"
             </p>
          ) : alarm.useAI ? (
            <div className="h-6" /> // spacer
          ) : null}
        </div>

        <div className="flex flex-col w-full gap-4 pt-8">
          <button
            onClick={onSnooze}
            className="w-full bg-white/10 hover:bg-white/20 active:bg-white/15 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <SnoozeIcon size={24} />
            Snooze (5 min)
          </button>
          
          <button
            onClick={onDismiss}
            className="w-full bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/15 border border-red-500/50 text-red-200 font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-2"
          >
            <X size={24} />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};