import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Clock, Power, Sparkles, AlertTriangle } from 'lucide-react';
import { ClockDisplay } from './components/ClockDisplay';
import { AlarmModal } from './components/AlarmModal';
import { RingingOverlay } from './components/RingingOverlay';
import { audioService } from './services/audioService';
import { Alarm, DAYS_OF_WEEK } from './types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Storage Key
const STORAGE_KEY = 'chronorise_alarms_v1';

const App: React.FC = () => {
  // --- State ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | undefined>(undefined);
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Refs for loop control
  const ringingAlarmRef = useRef<Alarm | null>(null); // To access in interval without deps
  const alarmsRef = useRef<Alarm[]>([]);

  // Check for API Key
  const hasApiKey = !!process.env.API_KEY;

  // --- Effects ---

  // 1. Initialize from storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAlarms(parsed);
        alarmsRef.current = parsed;
      } catch (e) {
        console.error("Failed to parse alarms", e);
      }
    }
  }, []);

  // 2. Persist to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
    alarmsRef.current = alarms;
  }, [alarms]);

  // 3. Sync ref
  useEffect(() => {
    ringingAlarmRef.current = ringingAlarm;
  }, [ringingAlarm]);

  // 4. Clock & Alarm Check Loop
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Alarm Check Logic
      const nowString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.getDay(); // 0-6
      const todayDateString = now.toDateString(); // "Mon Oct 02 2023"

      // Only check if nothing is ringing
      if (!ringingAlarmRef.current) {
        alarmsRef.current.forEach(alarm => {
          if (!alarm.isActive) return;

          // Check if already triggered today
          if (alarm.lastTriggered === todayDateString) return;

          const matchesTime = alarm.time === nowString;
          
          if (matchesTime) {
            // Check days
            const isToday = alarm.days.length === 0 || alarm.days.includes(currentDay);
            
            if (isToday) {
               triggerAlarm(alarm, todayDateString);
            }
          }
        });
      }

    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // --- Actions ---

  const triggerAlarm = (alarm: Alarm, dateString: string) => {
    // Mark as triggered for today
    const updatedAlarms = alarmsRef.current.map(a => 
      a.id === alarm.id ? { ...a, lastTriggered: dateString } : a
    );
    setAlarms(updatedAlarms);
    
    // Set ringing state
    setRingingAlarm(alarm);
    audioService.startAlarm();
  };

  const handleAddAlarm = (data: Omit<Alarm, 'id' | 'createdAt'>) => {
    const newAlarm: Alarm = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    setAlarms(prev => [...prev, newAlarm]);
    audioService.unlockAudio(); // Ensure audio context is ready
    setHasInteracted(true);
  };

  const handleEditAlarm = (data: Omit<Alarm, 'id' | 'createdAt'>) => {
    if (!editingAlarm) return;
    setAlarms(prev => prev.map(a => a.id === editingAlarm.id ? { ...a, ...data } : a));
    setEditingAlarm(undefined);
  };

  const toggleAlarm = (id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    audioService.unlockAudio();
    setHasInteracted(true);
  };

  const deleteAlarm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  const openEdit = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setIsModalOpen(true);
  };

  // Ringing Actions
  const handleSnooze = () => {
    audioService.stopAlarm();
    setRingingAlarm(null);
    // Snooze logic: Create a temp one-off alarm for 5 mins later? 
    // Or just let the user rest. For simplicity in this demo, we just stop. 
    // Ideally, we'd add a new one-time alarm for now + 5 mins.
    const now = new Date();
    const snoozeTime = new Date(now.getTime() + 5 * 60000);
    const snoozeTimeString = `${snoozeTime.getHours().toString().padStart(2, '0')}:${snoozeTime.getMinutes().toString().padStart(2, '0')}`;
    
    const snoozedAlarm: Alarm = {
      id: generateId(),
      time: snoozeTimeString,
      label: `Snooze: ${ringingAlarm?.label}`,
      days: [],
      isActive: true,
      useAI: false, // Don't spam AI on snooze
      createdAt: Date.now()
    };
    setAlarms(prev => [...prev, snoozedAlarm]);
  };

  const handleDismiss = () => {
    audioService.stopAlarm();
    setRingingAlarm(null);
  };

  // Sort alarms by time
  const sortedAlarms = [...alarms].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="min-h-screen bg-background text-zinc-100 font-sans selection:bg-primary/30">
      
      {/* Audio Warning/Init helper for strict browsers */}
      {!hasInteracted && alarms.length > 0 && (
         <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center text-xs text-primary font-medium cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => { audioService.unlockAudio(); setHasInteracted(true); }}>
           Click anywhere to ensure alarm sounds are enabled
         </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 pb-24">
        
        {/* Header / Clock */}
        <header className="pt-8">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-primary">
               <Clock className="w-6 h-6" />
               <span className="font-bold tracking-tight text-lg">ChronoRise</span>
             </div>
             {/* API Key Indicator */}
             {hasApiKey && (
               <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
                 <Sparkles size={12} />
                 <span>AI Active</span>
               </div>
             )}
           </div>
           <ClockDisplay time={currentTime} />
        </header>

        {/* Alarm List */}
        <main className="mt-8 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white/90">Your Alarms</h2>
            <button 
              onClick={() => { setEditingAlarm(undefined); setIsModalOpen(true); }}
              className="p-3 bg-surface hover:bg-white/10 rounded-full text-primary transition-all active:scale-95 shadow-lg shadow-black/20"
            >
              <Plus size={24} />
            </button>
          </div>

          {sortedAlarms.length === 0 ? (
            <div className="text-center py-16 opacity-40">
              <Clock size={48} className="mx-auto mb-4 text-secondary" />
              <p className="text-lg font-medium">No alarms set</p>
              <p className="text-sm">Tap the + button to wake up on time</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sortedAlarms.map((alarm) => (
                <div 
                  key={alarm.id}
                  onClick={() => openEdit(alarm)}
                  className={`group relative overflow-hidden bg-surface border border-white/5 rounded-2xl p-5 flex items-center justify-between transition-all duration-300 hover:border-white/10 cursor-pointer ${
                    !alarm.isActive ? 'opacity-60 grayscale-[0.5]' : ''
                  }`}
                >
                  {/* Active Indicator Glow */}
                  {alarm.isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                  )}

                  <div className="flex flex-col gap-1 pl-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-mono font-bold tracking-tighter text-white">
                        {alarm.time}
                      </span>
                      {alarm.useAI && hasApiKey && (
                        <Sparkles size={16} className="text-indigo-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <span className="font-medium text-white/80">
                        {alarm.label || 'Alarm'}
                      </span>
                      <span>•</span>
                      <span className="text-xs uppercase tracking-wide">
                        {alarm.days.length === 0 
                          ? 'Once' 
                          : alarm.days.length === 7 
                            ? 'Every day' 
                            : alarm.days.map(d => DAYS_OF_WEEK[d]).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleAlarm(alarm.id); }}
                      className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none ${
                        alarm.isActive ? 'bg-primary' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                          alarm.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    
                    <button
                      onClick={(e) => deleteAlarm(alarm.id, e)}
                      className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AlarmModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={editingAlarm ? handleEditAlarm : handleAddAlarm}
        editingAlarm={editingAlarm}
        hasApiKey={hasApiKey}
      />

      <RingingOverlay
        alarm={ringingAlarm}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
      />

    </div>
  );
};

export default App;