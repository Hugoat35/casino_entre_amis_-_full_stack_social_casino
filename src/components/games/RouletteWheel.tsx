import { useState, useEffect } from 'react';

interface RouletteWheelProps {
  isSpinning: boolean;
  result?: number;
  onSpinComplete?: () => void;
}

export function RouletteWheel({ isSpinning, result, onSpinComplete }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [ballPosition, setBallPosition] = useState(0);

  useEffect(() => {
    if (isSpinning && result !== undefined) {
      // Calculate final rotation based on result
      const sectorAngle = 360 / 37; // 37 numbers (0-36)
      const finalRotation = 1440 + (result * sectorAngle); // 4 full rotations + result position
      
      setRotation(finalRotation);
      setBallPosition(finalRotation);

      const timer = setTimeout(() => {
        onSpinComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSpinning, result, onSpinComplete]);

  return (
    <div className="relative flex items-center justify-center">
      <div 
        className={`roulette-wheel w-64 h-64 ${isSpinning ? 'animate-spin-roulette' : ''}`}
        style={{ 
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
        }}
      >
        {/* Inner circle with numbers */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center border-4 border-yellow-300">
          <div className="text-4xl font-bold text-white">
            {!isSpinning && result !== undefined ? result : '🎲'}
          </div>
        </div>
        
        {/* Roulette ball */}
        <div 
          className="roulette-ball"
          style={{
            transform: `rotate(${-ballPosition}deg) translateX(-50%)`,
            transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
          }}
        />
      </div>
      
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
        <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg"></div>
      </div>
    </div>
  );
}
