import { useState } from 'react';

interface AnimatedCardProps {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  hidden?: boolean;
  onClick?: () => void;
  className?: string;
}

const SUIT_SYMBOLS = {
  hearts: '♥️',
  diamonds: '♦️',
  clubs: '♣️',
  spades: '♠️',
};

export function AnimatedCard({ suit, rank, hidden = false, onClick, className = '' }: AnimatedCardProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  
  const isRed = suit === 'hearts' || suit === 'diamonds';
  
  const handleClick = () => {
    if (onClick) {
      setIsFlipping(true);
      setTimeout(() => {
        setIsFlipping(false);
        onClick();
      }, 300);
    }
  };

  return (
    <div
      className={`playing-card ${hidden ? 'flipped' : ''} ${isFlipping ? 'animate-card-flip' : ''} ${className}`}
      onClick={handleClick}
    >
      {!hidden ? (
        <div className={`flex flex-col items-center justify-center h-full ${isRed ? 'text-red-600' : 'text-black'}`}>
          <div className="text-lg font-bold">{rank}</div>
          <div className="text-xl">{SUIT_SYMBOLS[suit]}</div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-2xl text-white">🂠</div>
        </div>
      )}
    </div>
  );
}
