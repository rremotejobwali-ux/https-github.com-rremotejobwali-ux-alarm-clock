import React from 'react';

interface ClockDisplayProps {
  time: Date;
}

export const ClockDisplay: React.FC<ClockDisplayProps> = ({ time }) => {
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  const dateString = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col items-center justify-center py-12 select-none">
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50"></div>
        
        <div className="relative font-mono text-7xl md:text-9xl font-bold tracking-tighter text-white drop-shadow-2xl flex items-baseline">
          <span>{hours}</span>
          <span className="animate-pulse text-primary mx-2">:</span>
          <span>{minutes}</span>
          <span className="ml-4 text-3xl md:text-4xl text-secondary font-light self-end pb-4 md:pb-6">{seconds}</span>
        </div>
      </div>
      <div className="mt-4 text-secondary text-lg md:text-xl font-medium tracking-wide uppercase">
        {dateString}
      </div>
    </div>
  );
};