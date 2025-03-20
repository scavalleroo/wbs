'use client';

import { useEffect, useState, useRef } from 'react';

// Simple diverse emoji collection
const PEOPLE_EMOJIS = ['👩‍💻', '👨‍💻', '👩‍🎓', '👨‍🎓', '👩‍🔬', '👨‍🔬', '🧑‍🎨', '👩‍🏫', '👨‍🏫', '🧘‍♀️', '🧘‍♂️', '👷‍♀️', '👷‍♂️', '👨‍⚕️', '👩‍⚕️', '🤔', '📚', '💻', '🎨', '🧠'];

// Get a random emoji from the collection
const getRandomPersonEmoji = (): string => {
  const randomIndex = Math.floor(Math.random() * PEOPLE_EMOJIS.length);
  return PEOPLE_EMOJIS[randomIndex];
};

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
}

interface ActiveUsersParticlesProps {
  count: number;
}

export function ActiveUsersParticles({ count }: ActiveUsersParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const particleCount = Math.min(count, 40); // Cap at 40 for performance

  // Initialize particles on mount and when count changes
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    // Generate particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      // Create diverse size range - smaller on mobile, larger on desktop
      const isMobile = window.innerWidth < 640;
      const baseSize = isMobile ? 20 : 28;
      const sizeVariance = isMobile ? 8 : 12;
      const size = baseSize + Math.random() * sizeVariance;

      newParticles.push({
        id: i,
        x: Math.random() * (width - size),
        y: Math.random() * (height - size),
        size: size,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: (Math.random() - 0.5) * 0.6,
        opacity: Math.random() * 0.3 + 0.7, // 0.7-1
        emoji: getRandomPersonEmoji(),
        rotation: Math.random() * 30 - 15, // -15 to 15 degrees
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    setParticles(newParticles);

    // Handle window resize
    const handleResize = () => {
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();

      setParticles(prevParticles =>
        prevParticles.map(particle => ({
          ...particle,
          x: Math.min(particle.x, width - particle.size),
          y: Math.min(particle.y, height - particle.size),
        }))
      );
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [particleCount]);

  // Update particle positions using requestAnimationFrame
  useEffect(() => {
    if (!containerRef.current || particles.length === 0) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    const updateParticles = () => {
      setParticles(prevParticles =>
        prevParticles.map(particle => {
          let newX = particle.x + particle.speedX;
          let newY = particle.y + particle.speedY;
          const newRotation = particle.rotation + particle.rotationSpeed;

          // Bounce off walls
          if (newX <= 0 || newX >= width - particle.size) {
            particle.speedX *= -1;
            newX = Math.max(0, Math.min(newX, width - particle.size));
          }

          if (newY <= 0 || newY >= height - particle.size) {
            particle.speedY *= -1;
            newY = Math.max(0, Math.min(newY, height - particle.size));
          }

          return {
            ...particle,
            x: newX,
            y: newY,
            rotation: newRotation,
          };
        })
      );

      frameRef.current = requestAnimationFrame(updateParticles);
    };

    frameRef.current = requestAnimationFrame(updateParticles);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [particles.length]);

  if (particleCount === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute flex items-center justify-center"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            opacity: particle.opacity,
            transform: `rotate(${particle.rotation}deg)`,
            fontSize: `${particle.size * 0.75}px`,
            filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.4))',
            transition: 'opacity 2s ease',
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
}