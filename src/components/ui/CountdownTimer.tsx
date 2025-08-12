import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endTime: number;
  onComplete?: () => void;
  format?: 'short' | 'long';
}

export function CountdownTimer({ endTime, onComplete, format = 'short' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);

      if (remaining === 0 && onComplete) {
        onComplete();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (format === 'long') {
      if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
      }
      if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      }
      return `${seconds}s`;
    }

    // Short format
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const isUrgent = timeLeft < 10000; // Less than 10 seconds

  return (
    <div className={`font-mono text-lg font-bold ${
      isUrgent ? 'text-red-400 animate-pulse' : 'text-yellow-400'
    }`}>
      ⏱️ {formatTime(timeLeft)}
    </div>
  );
}
