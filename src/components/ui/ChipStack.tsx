interface ChipStackProps {
  value: number;
  count?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export function ChipStack({ value, count = 1, onClick, disabled = false }: ChipStackProps) {
  const getChipClass = (value: number) => {
    if (value >= 500) return 'chip-500';
    if (value >= 100) return 'chip-100';
    if (value >= 50) return 'chip-50';
    if (value >= 25) return 'chip-25';
    if (value >= 10) return 'chip-10';
    return 'chip-5';
  };

  return (
    <div className="relative">
      {Array.from({ length: Math.min(count, 5) }).map((_, index) => (
        <div
          key={index}
          className={`chip ${getChipClass(value)} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            transform: `translateY(-${index * 2}px)`,
            zIndex: count - index,
          }}
          onClick={!disabled ? onClick : undefined}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
            {value}
          </div>
        </div>
      ))}
      {count > 5 && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </div>
      )}
    </div>
  );
}
