'use client';

import { useEffect, useState } from 'react';

interface CooldownTimerProps {
  endTime: number;
  onComplete: () => void;
}

export default function CooldownTimer({ endTime, onComplete }: CooldownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRateLimit, setIsRateLimit] = useState(false);
  
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);
      
      // Check if this is a rate limit cooldown (longer than 10 minutes)
      setIsRateLimit(remaining > 10 * 60 * 1000);
      
      if (remaining === 0) {
        onComplete();
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [endTime, onComplete]);
  
  if (timeLeft === 0) return null;
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-pulse">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm font-medium">
            {isRateLimit ? 'Rate limit' : 'Cooldown'}: {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
