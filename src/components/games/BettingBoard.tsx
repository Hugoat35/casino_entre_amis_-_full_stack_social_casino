import { ChipStack } from '../ui/ChipStack';

interface BettingBoardProps {
  selectedBets: Record<string, number>;
  onPlaceBet: (betType: string, betValue: any) => void;
  disabled?: boolean;
}

const ROULETTE_LAYOUT = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function BettingBoard({ selectedBets, onPlaceBet, disabled = false }: BettingBoardProps) {
  return (
    <div className="table-felt rounded-2xl p-6 space-y-4">
      {/* Zero */}
      <div className="flex justify-center">
        <button
          onClick={() => onPlaceBet('straight', 0)}
          disabled={disabled}
          className="relative h-12 w-full max-w-md bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-xl">0</span>
          {selectedBets['straight-0'] && (
            <div className="absolute -top-2 -right-2">
              <ChipStack value={selectedBets['straight-0']} />
            </div>
          )}
        </button>
      </div>

      {/* Number grid */}
      <div className="space-y-2">
        {ROULETTE_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-12 gap-1">
            {row.map((number) => (
              <button
                key={number}
                onClick={() => onPlaceBet('straight', number)}
                disabled={disabled}
                className={`relative h-12 text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  RED_NUMBERS.includes(number)
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <span className="text-sm">{number}</span>
                {selectedBets[`straight-${number}`] && (
                  <div className="absolute -top-1 -right-1 scale-75">
                    <ChipStack value={selectedBets[`straight-${number}`]} />
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Outside bets */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { key: 'red', label: '🔴 Rouge', color: 'bg-red-600 hover:bg-red-500' },
          { key: 'black', label: '⚫ Noir', color: 'bg-gray-800 hover:bg-gray-700' },
          { key: 'even', label: 'Pair', color: 'bg-blue-600 hover:bg-blue-500' },
          { key: 'odd', label: 'Impair', color: 'bg-purple-600 hover:bg-purple-500' },
          { key: 'low', label: '1-18', color: 'bg-indigo-600 hover:bg-indigo-500' },
          { key: 'high', label: '19-36', color: 'bg-pink-600 hover:bg-pink-500' },
        ].map((bet) => (
          <button
            key={bet.key}
            onClick={() => onPlaceBet(bet.key, bet.key)}
            disabled={disabled}
            className={`relative py-3 text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${bet.color}`}
          >
            <span className="text-sm">{bet.label}</span>
            {selectedBets[bet.key] && (
              <div className="absolute -top-2 -right-2 scale-75">
                <ChipStack value={selectedBets[bet.key]} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
