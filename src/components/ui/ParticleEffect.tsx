import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface ParticleEffectProps {
  trigger: boolean;
  origin: { x: number; y: number };
  count?: number;
  colors?: string[];
}

export function ParticleEffect({ 
  trigger, 
  origin, 
  count = 15, 
  colors = ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#45B7D1"] 
}: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    
    let animationId: number;

    // Create new particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const velocity = 2 + Math.random() * 4;
      
      newParticles.push({
        id: Date.now() + i,
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 60,
        maxLife: 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
      });
    }

    setParticles(newParticles);

    // Animate particles
    const animate = () => {
      setParticles(prev => {
        const updated = prev
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.1, // gravity
            life: particle.life - 1,
          }))
          .filter(particle => particle.life > 0);

        if (updated.length > 0) {
          animationId = requestAnimationFrame(animate);
        }
        
        return updated;
      });
    };

    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [trigger, origin, count, colors]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x - particle.size / 2,
            top: particle.y - particle.size / 2,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life / particle.maxLife,
            transform: `scale(${particle.life / particle.maxLife})`,
          }}
        />
      ))}
    </div>
  );
}
