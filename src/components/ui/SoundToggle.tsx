import { useState, useEffect } from 'react';

export function SoundToggle() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('casino-sound-enabled');
    if (saved !== null) {
      setSoundEnabled(JSON.parse(saved));
    }
  }, []);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('casino-sound-enabled', JSON.stringify(newState));
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-300">🔊</span>
      <button
        onClick={toggleSound}
        className={`sound-toggle ${soundEnabled ? 'active' : ''}`}
        aria-label="Toggle sound"
      />
    </div>
  );
}
