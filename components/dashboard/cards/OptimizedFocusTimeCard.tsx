'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTimer } from '@/contexts/TimerProvider';
import { User } from '@supabase/supabase-js';

interface OptimizedFocusTimeCardProps {
    user: User | null | undefined;
    isMobile?: boolean;
}

export function OptimizedFocusTimeCard({
    user,
    isMobile = false
}: OptimizedFocusTimeCardProps) {
    const [sound, setSound] = useState('Atmosphere');
    const videoRef = useRef<HTMLVideoElement>(null);
    const { timeRemaining, timeElapsed, isRunning, initializeSession, endSession, updateSessionSound, sound: currentSound } = useTimer();

    // Sync local sound with timer context sound
    useEffect(() => {
        if (currentSound && currentSound !== 'none') {
            // Convert from backend format to display format
            const displaySound = currentSound === 'atmosphere' ? 'Atmosphere' :
                currentSound.charAt(0).toUpperCase() + currentSound.slice(1);
            setSound(displaySound);
        }
    }, [currentSound]);

    // Video mapping
    const videoMapping: { [key: string]: string } = {
        'Atmosphere': '/focus/none.mp4',
        'Rain': '/focus/rain.mp4',
        'Waves': '/focus/waves.mp4',
        'Nature': '/focus/nature.mp4',
        'Coffee': '/focus/cafe.mp4',
        'Brown': '/focus/brown.mp4',
        'Fan': '/focus/fan.mp4',
        'Waterfall': '/focus/waterfall.mp4',
        'Campfire': '/focus/campfire.mp4',
        'Fireplace': '/focus/fireplace.mp4',
        'Lofi': '/focus/lofi.mp4'
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.loop = true;
            videoRef.current.playsInline = true;

            // Load and play the video
            const playVideo = async () => {
                try {
                    await videoRef.current?.play();
                } catch (error) {
                    console.log('Video autoplay prevented:', error);
                }
            };

            playVideo();
        }
    }, [sound]);

    const handleSoundChange = async (newSound: string) => {
        // Update local state immediately for UI responsiveness
        setSound(newSound);

        // Update the session in the background (if running)
        try {
            await updateSessionSound(newSound);
        } catch (error) {
            console.error('Failed to update session sound:', error);
            // UI already updated, so we don't need to revert
        }
    };

    const handleStartFocus = () => {
        const soundValue = sound === 'Atmosphere' ? 'atmosphere' : sound.toLowerCase();

        initializeSession({
            activity: 'focus',
            sound: soundValue,
            duration: 0,
            volume: 50,
            flowMode: true
        });
    };

    const handleFinishSession = () => {
        endSession();
    };

    const formatTime = (seconds: number) => {
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative rounded-xl overflow-hidden shadow-lg h-[400px] w-full">
            {/* Video Background */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                src={videoMapping[sound]}
                autoPlay
                muted
                loop
                playsInline
            />

            {/* Glass Overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

            {/* Sound Selector - Top Right */}
            <div className="absolute top-4 right-4 w-32 z-50">
                <Select value={sound} onValueChange={handleSoundChange}>
                    <SelectTrigger className="w-full bg-white/10 backdrop-blur-md border-white/20 text-white text-xs h-8 rounded-lg hover:bg-white/20 transition-all duration-200">
                        <SelectValue placeholder="Background" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                        <SelectItem value="Atmosphere">Atmosphere</SelectItem>
                        <SelectItem value="Rain">Rain</SelectItem>
                        <SelectItem value="Waves">Waves</SelectItem>
                        <SelectItem value="Nature">Nature</SelectItem>
                        <SelectItem value="Coffee">Coffee Shop</SelectItem>
                        <SelectItem value="Brown">Brown Noise</SelectItem>
                        <SelectItem value="Fan">Fan</SelectItem>
                        <SelectItem value="Waterfall">Waterfall</SelectItem>
                        <SelectItem value="Campfire">Campfire</SelectItem>
                        <SelectItem value="Fireplace">Fireplace</SelectItem>
                        <SelectItem value="Lofi">Lo-Fi</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                {!isRunning ? (
                    /* Start Focus Button - Center when not running */
                    <button
                        onClick={handleStartFocus}
                        className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white font-medium text-sm tracking-wide hover:bg-white/20 transition-all duration-200 shadow-lg"
                    >
                        Start Focus
                    </button>
                ) : (
                    /* Running state - Time in center, button at bottom */
                    <>
                        {/* Time Display - Center when running */}
                        <div className="px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
                            <div className="text-white/90 font-mono text-2xl font-medium tracking-wider">
                                {formatTime(timeElapsed || 0)}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Finish Session Button - Bottom when running */}
            {isRunning && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button
                        onClick={handleFinishSession}
                        className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white font-medium text-sm tracking-wide hover:bg-white/20 transition-all duration-200 shadow-lg"
                    >
                        Finish Session
                    </button>
                </div>
            )}
        </div>
    );
}