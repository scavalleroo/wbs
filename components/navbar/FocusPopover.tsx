'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimer } from '@/contexts/TimerProvider';
import { User } from '@supabase/supabase-js';
import { X } from 'lucide-react';

interface FocusPopoverProps {
    user: User | null | undefined;
}

export function FocusPopover({ user }: FocusPopoverProps) {
    const [sound, setSound] = useState('Atmosphere');
    const [isOpen, setIsOpen] = useState(false);
    const [displayTime, setDisplayTime] = useState(0);
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
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

    // Update display time when timer changes
    useEffect(() => {
        if (isRunning) {
            setDisplayTime(timeElapsed || 0);
        }
    }, [timeElapsed, isRunning]);

    // Force re-render when timer is running (removed - using displayTime state instead)

    // Click outside to close - only when Select is not open
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // Don't close if Select dropdown is open
            if (isSelectOpen) {
                return;
            }

            const target = event.target as Element;

            // Don't close if clicking anywhere inside the popover
            if (popoverRef.current && popoverRef.current.contains(target)) {
                return;
            }

            // Only close if clicking outside the popover
            if (popoverRef.current && !popoverRef.current.contains(target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside, true);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside, true);
            };
        }
    }, [isOpen, isSelectOpen]);

    // Video mapping
    const videoMapping: { [key: string]: string } = {
        'Atmosphere': '/focus/none.mp4',
        'Rain': '/focus/rain.mp4',
        'Waves': '/focus/waves.mp4',
        'Nature': '/focus/forest.mp4',
        'Forest': '/focus/forest.mp4',
        'Coffee': '/focus/cafe.mp4'
    };

    useEffect(() => {
        if (videoRef.current && isOpen) {
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
    }, [sound, isOpen]);

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

        // Don't close popover automatically - let user close it manually
    };

    const handleFinishSession = () => {
        endSession();

        // Don't close popover automatically - let user close it manually
    };

    const formatTime = (seconds: number) => {
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative" ref={popoverRef}>
            {/* Trigger Button - Only show when session is running */}
            {isRunning ? (
                !isOpen ? (
                    // Show mini timer with background when session is running and popover is closed
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="relative rounded-lg overflow-hidden shadow-sm h-8 w-20 hover:scale-105 transition-transform duration-200 bg-white/10 backdrop-blur-md border border-white/20"
                    >
                        {/* Mini video background */}
                        <video
                            className="absolute inset-0 w-full h-full object-cover"
                            src={videoMapping[sound]}
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-white font-mono text-[11px] font-bold tracking-tight drop-shadow-lg">
                                {Math.floor(displayTime / 60).toString().padStart(2, '0')}:
                                {(displayTime % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                    </button>
                ) : null
            ) : null}

            {/* Popover Content */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 z-[60]">
                    <div className="relative rounded-xl overflow-hidden shadow-lg h-80 w-full bg-black">
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

                        {/* Close Button - Top Left */}
                        <div className="absolute top-3 left-3 z-50">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>

                        {/* Sound Selector - Top Right */}
                        <div className="absolute top-3 right-3 w-28 z-50">
                            <Select
                                value={sound}
                                onValueChange={handleSoundChange}
                                onOpenChange={setIsSelectOpen}
                            >
                                <SelectTrigger className="w-full bg-white/10 backdrop-blur-md border-white/20 text-white text-xs h-7 rounded-lg hover:bg-white/20 transition-all duration-200">
                                    <SelectValue placeholder="Background" />
                                </SelectTrigger>
                                <SelectContent className="z-[70] select-content" side="bottom" align="end">
                                    <SelectItem value="Atmosphere">Atmosphere</SelectItem>
                                    <SelectItem value="Rain">Rain</SelectItem>
                                    <SelectItem value="Waves">Waves</SelectItem>
                                    <SelectItem value="Nature">Nature</SelectItem>
                                    <SelectItem value="Forest">Forest</SelectItem>
                                    <SelectItem value="Coffee">Coffee Shop</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                            {!isRunning ? (
                                /* No session message when not running */
                                <div className="px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
                                    <div className="text-white/90 text-sm font-medium text-center">
                                        No active session
                                    </div>
                                </div>
                            ) : (
                                /* Running state - Time in center, button at bottom */
                                <>
                                    {/* Time Display - Center when running */}
                                    <div className="px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
                                        <div className="text-white/90 font-mono text-xl font-medium tracking-wider">
                                            {formatTime(timeElapsed || 0)}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Finish Session Button - Bottom when running */}
                        {isRunning && (
                            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                                <button
                                    onClick={handleFinishSession}
                                    className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white font-medium text-sm tracking-wide hover:bg-white/20 transition-all duration-200 shadow-lg"
                                >
                                    Finish Session
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
