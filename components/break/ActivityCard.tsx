'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
    title: string;
    description: string;
    level: string;
    views: number;
    audioSrc: string;
    colorScheme?: 'meditation' | 'focus' | 'energy' | 'breathing' | 'creative' | 'relaxation';
    className?: string;
}

export function ActivityCard({
    title,
    description,
    level,
    views,
    audioSrc,
    colorScheme = 'meditation',
    className
}: ActivityCardProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressBarRef = useRef<HTMLDivElement | null>(null);

    // Initialize audio
    useEffect(() => {
        const audio = new Audio(audioSrc);
        audioRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration);
        });

        audio.addEventListener('timeupdate', updateProgress);

        audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setProgress(0);
        });

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', () => {
                setIsPlaying(false);
                setProgress(0);
            });
            audio.pause();
        };
    }, [audioSrc]);

    const updateProgress = () => {
        if (audioRef.current) {
            const value = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(value);
        }
    };

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
        if (progressBarRef.current && audioRef.current) {
            const rect = progressBarRef.current.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            setProgress(pos * 100);
            audioRef.current.currentTime = pos * audioRef.current.duration;
        }
    };

    // Format seconds to mm:ss
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Determine color scheme
    const colorClasses = {
        meditation: 'from-[#F9F871] via-[#FF864B] to-[#FF2D75] shadow-[0_0_15px_rgba(255,45,117,0.3)]',
        focus: 'from-[#A0E9FF] via-[#7189FF] to-[#4C4CFF] shadow-[0_0_15px_rgba(76,76,255,0.3)]',
        energy: 'from-[#FFD166] via-[#FF6B6B] to-[#AC04ED] shadow-[0_0_15px_rgba(172,4,237,0.3)]',
        breathing: 'from-[#90F9C4] via-[#48C9B0] to-[#007991] shadow-[0_0_15px_rgba(0,121,145,0.3)]',
        creative: 'from-[#FFCF7B] via-[#FF9671] to-[#D65DB1] shadow-[0_0_15px_rgba(214,93,177,0.3)]',
        relaxation: 'from-[#B8E1FC] via-[#8BB8E8] to-[#5E6CE2] shadow-[0_0_15px_rgba(94,108,226,0.3)]'
    };

    return (
        <div className={cn(
            "relative w-full rounded-2xl p-5 md:p-6 overflow-hidden bg-gradient-to-r",
            colorClasses[colorScheme],
            className
        )}>
            {/* Semi-transparent dark overlay for better text contrast */}
            <div className="absolute inset-0 bg-black/40 z-0"></div>

            {/* Decorative circles */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 rounded-full bg-white/10 -mr-32 z-0"></div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-48 h-48 md:w-72 md:h-72 rounded-full bg-white/10 -mr-24 z-0"></div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/10 -mr-16 z-0"></div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-4">
                    <h3 className="text-xl md:text-2xl font-bold text-white">{title}</h3>
                </div>

                <p className="text-white text-sm md:text-base mb-1 font-medium">{description}</p>
                <span className="text-white text-xs mb-4 font-medium">{level}</span>

                <div className="mt-auto">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-xs font-medium"></span>
                        {/* <span className="text-white text-xs font-medium">{views.toLocaleString()} views</span> */}
                        <div className="flex items-center gap-2">
                            <span className="text-white text-xs font-medium">
                                {formatTime(progress * duration / 100)} / {formatTime(duration)}
                            </span>
                            <button
                                onClick={togglePlayPause}
                                className="h-10 w-10 rounded-full bg-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                                aria-label={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div
                        ref={progressBarRef}
                        className="w-full h-3 bg-black/40 rounded-full cursor-pointer"
                        onClick={handleProgressChange}
                    >
                        <div
                            className="h-full bg-white rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActivityCard;