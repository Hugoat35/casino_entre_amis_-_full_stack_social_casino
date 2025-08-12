interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

export function StatCard({ icon, label, value, change, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-400/30',
    green: 'from-green-500/20 to-green-600/20 border-green-400/30',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-400/30',
    red: 'from-red-500/20 to-red-600/20 border-red-400/30',
  };

  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-6 border backdrop-blur-lg
      bg-gradient-to-br ${colorClasses[color]}
      hover:scale-105 transition-all duration-300 cursor-pointer
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-4xl animate-float">{icon}</div>
        {change && (
          <div className={`flex items-center text-sm font-medium ${
            change.type === 'increase' ? 'text-green-400' : 'text-red-400'
          }`}>
            <span className="mr-1">
              {change.type === 'increase' ? '↗️' : '↘️'}
            </span>
            {Math.abs(change.value)}%
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-white mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      
      <div className="text-sm text-gray-300">{label}</div>
      
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
    </div>
  );
}
