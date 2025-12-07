import React, { useState, useEffect } from 'react';
import { X, Check, Wand2 } from 'lucide-react';
import { Alarm, DAYS_OF_WEEK } from '../types';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alarm: Omit<Alarm, 'id' | 'createdAt'>) => void;
  editingAlarm?: Alarm;
  hasApiKey: boolean;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({ isOpen, onClose, onSave, editingAlarm, hasApiKey }) => {
  const [time, setTime] = useState('08:00');
  const [label, setLabel] = useState('');
  const [days, setDays] = useState<number[]>([]);
  const [useAI, setUseAI] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingAlarm) {
        setTime(editingAlarm.time);
        setLabel(editingAlarm.label);
        setDays(editingAlarm.days);
        setUseAI(editingAlarm.useAI);
      } else {
        // Defaults
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        const defaultTime = `${nextHour.getHours().toString().padStart(2, '0')}:${nextHour.getMinutes().toString().padStart(2, '0')}`;
        setTime(defaultTime);
        setLabel('Wake Up');
        setDays([]);
        setUseAI(false);
      }
    }
  }, [isOpen, editingAlarm]);

  const toggleDay = (index: number) => {
    setDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    );
  };

  const handleSave = () => {
    onSave({
      time,
      label,
      days: days.sort(),
      isActive: true,
      useAI,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-semibold text-white">
            {editingAlarm ? 'Edit Alarm' : 'New Alarm'}
          </h2>
          <button onClick={onClose} className="p-2 text-secondary hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Time Input */}
          <div className="flex justify-center">
             <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-transparent text-5xl font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg px-4 py-2"
            />
          </div>

          {/* Days Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-secondary uppercase tracking-wider">Repeat</label>
            <div className="flex justify-between">
              {DAYS_OF_WEEK.map((day, index) => {
                const isSelected = days.includes(index);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(index)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'bg-white/5 text-secondary hover:bg-white/10'
                    }`}
                  >
                    {day.charAt(0)}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-secondary text-center mt-2 h-4">
              {days.length === 0 ? 'Ring once' : days.length === 7 ? 'Every day' : 'Custom schedule'}
            </p>
          </div>

          {/* Label Input */}
          <div className="space-y-2">
             <label className="text-xs font-medium text-secondary uppercase tracking-wider">Label</label>
             <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Alarm name"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* AI Toggle */}
          {hasApiKey && (
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-4 rounded-xl border border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Smart Briefing</h3>
                  <p className="text-xs text-indigo-200/60">Generate AI motivation</p>
                </div>
              </div>
              <button
                onClick={() => setUseAI(!useAI)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useAI ? 'bg-indigo-500' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useAI ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            <Check size={20} />
            Save Alarm
          </button>
        </div>
      </div>
    </div>
  );
};