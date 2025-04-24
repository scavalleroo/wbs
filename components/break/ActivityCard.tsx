'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Heart, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
    title: string;
    description: string;
    level: string;
    views: number;
    audioSrc: string;
    colorScheme?: 'meditation' | 'focus' | 'energy' | 'breathing' | 'creative' | 'relaxation';
    className?: string;
    isActive?: boolean;
    likeCount?: number;
    commentCount?: number;
    activityId: string;
    onLike?: (activityId: string) => Promise<void>;
    onComment?: (activityId: string) => void;
    shareUrl: string;
}

export function ActivityCard({
    title,
    description,
    level,
    views,
    audioSrc,
    colorScheme = 'meditation',
    className,
    isActive = false,
    likeCount = 0,
    commentCount = 0,
    activityId,
    onLike,
    onComment,
    shareUrl,
}: ActivityCardProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentLikes, setCurrentLikes] = useState(likeCount);
    const [isLiked, setIsLiked] = useState(false);
    const [interactionAnimation, setInteractionAnimation] = useState<string | null>(null);

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

    // Auto play/pause when card becomes active
    useEffect(() => {
        if (isActive && audioRef.current) {
            if (!isPlaying) {
                audioRef.current.play().catch(e => console.log("Auto-play prevented:", e));
                setIsPlaying(true);
            }
        } else if (!isActive && audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    const updateProgress = () => {
        if (audioRef.current) {
            const value = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(value);
        }
    };

    const togglePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
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

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onLike) {
            try {
                await onLike(activityId);
                setCurrentLikes(prev => isLiked ? prev - 1 : prev + 1);
                setIsLiked(!isLiked);
                setInteractionAnimation('like');
                setTimeout(() => setInteractionAnimation(null), 1000);
            } catch (error) {
                console.error('Failed to update like:', error);
            }
        }
    };

    const handleComment = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onComment) {
            onComment(activityId);
            setInteractionAnimation('comment');
            setTimeout(() => setInteractionAnimation(null), 1000);
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: description,
                    url: shareUrl
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                console.log('Link copied to clipboard');
            }
            setInteractionAnimation('share');
            setTimeout(() => setInteractionAnimation(null), 1000);
        } catch (error) {
            console.error('Error sharing:', error);
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
        meditation: 'from-[#F9F871] via-[#FF864B] to-[#FF2D75]',
        focus: 'from-[#A0E9FF] via-[#7189FF] to-[#4C4CFF]',
        energy: 'from-[#FFD166] via-[#FF6B6B] to-[#AC04ED]',
        breathing: 'from-[#90F9C4] via-[#48C9B0] to-[#007991]',
        creative: 'from-[#FFCF7B] via-[#FF9671] to-[#D65DB1]',
        relaxation: 'from-[#B8E1FC] via-[#8BB8E8] to-[#5E6CE2]'
    };

    return (
        <div
            className={cn(
                "w-full h-full relative bg-gradient-to-br overflow-hidden flex items-center justify-center",
                colorClasses[colorScheme],
                className
            )}
            onClick={togglePlayPause}
        >
            {/* Background elements */}
            <div className="absolute inset-0 bg-black/30 z-0"></div>

            {/* Animated background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-30">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className={`absolute rounded-full bg-white/20 animate-pulse`}
                            style={{
                                width: `${Math.random() * 300 + 100}px`,
                                height: `${Math.random() * 300 + 100}px`,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.7}s`,
                                animationDuration: `${Math.random() * 5 + 5}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Central play/pause button */}
            <div className={`absolute z-20 transition-opacity duration-500 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
                <div className="w-20 h-20 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
                    <Play fill="white" className="w-10 h-10 text-white ml-1" />
                </div>
            </div>

            {/* Interaction animations */}
            {interactionAnimation === 'like' && (
                <div className="absolute inset-0 z-30 flex items-center justify-center">
                    <Heart className="w-32 h-32 text-red-500 animate-pop" fill="red" />
                </div>
            )}

            {/* Content container */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-6 text-white">
                {/* Title and description */}
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
                <p className="text-lg mb-1">{description}</p>
                <p className="text-sm mb-4">{level}</p>

                {/* Progress bar */}
                <div
                    ref={progressBarRef}
                    className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer"
                    onClick={handleProgressChange}
                >
                    <div
                        className="h-full bg-white rounded-full"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="flex items-center justify-between">
                    {/* Time indicator */}
                    <div className="text-sm">
                        {formatTime(progress * duration / 100)} / {formatTime(duration)}
                    </div>

                    {/* Play/pause button */}
                    <button
                        onClick={togglePlayPause}
                        className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                </div>
            </div>

            {/* Right side interaction buttons */}
            <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6 z-20">
                {/* Temporarily commented out like button 
                <div className="flex flex-col items-center">
                    <button
                        onClick={handleLike}
                        className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center mb-1"
                    >
                        <Heart className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                    </button>
                    <span className="text-white text-xs">{currentLikes}</span>
                </div>
                */}

                {/* Temporarily commented out comment button 
                <div className="flex flex-col items-center">
                    <button
                        onClick={handleComment}
                        className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center mb-1"
                    >
                        <MessageCircle className="w-6 h-6 text-white" />
                    </button>
                    <span className="text-white text-xs">{commentCount}</span>
                </div>
                */}

                {/* Share button - keeping this active */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={handleShare}
                        className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center mb-1"
                    >
                        <Share2 className="w-6 h-6 text-white" />
                    </button>
                    <span className="text-white text-xs">Share</span>
                </div>
            </div>

            {/* Add Tailwind classes for animations */}
            <style jsx global>{`
                @keyframes pop {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 0; }
                }
                .animate-pop {
                    animation: pop 0.8s ease-out forwards;
                }
            `}</style>
        </div>
    );
}

export default ActivityCard;