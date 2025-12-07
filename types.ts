export interface Alarm {
  id: string;
  time: string; // HH:mm format (24h)
  label: string;
  days: number[]; // 0 = Sunday, 1 = Monday, etc. Empty array means one-time alarm.
  isActive: boolean;
  useAI: boolean; // Whether to generate an AI briefing
  createdAt: number;
  lastTriggered?: string; // ISO date string of the last day it triggered to prevent double ringing
}

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface WakeUpBriefing {
  message: string;
  temperature?: string; // Placeholder for future expansion
}