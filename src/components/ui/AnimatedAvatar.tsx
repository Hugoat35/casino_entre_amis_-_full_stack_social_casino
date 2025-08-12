interface AnimatedAvatarProps {
  emoji: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export function AnimatedAvatar({ 
  emoji, 
  size = 'md', 
  isOnline = false, 
  className = '' 
}: AnimatedAvatarProps) {
  const sizeClasses = {
    sm: 'text-2xl w-8 h-8',
    md: 'text-3xl w-12 h-12',
    lg: 'text-4xl w-16 h-16',
    xl: 'text-6xl w-24 h-24'
  };

  return (
    <div className={`avatar ${isOnline ? 'online' : ''} ${sizeClasses[size]} ${className} flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-float`}>
      <span>{emoji}</span>
    </div>
  );
}
