'use client';

import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    // Focus session state
    const [activity, setActivity] = useState('Work');
    const [sound, setSound] = useState('None');
    const [volume, setVolume] = useState(50);
    const { timeRemaining, timeElapsed, isRunning, initializeSession, endSession, pauseTimer, startTimer } = useTimer();

    const handleStartFocus = () => {
        const soundValue = sound === 'None' ? 'none' : sound.toLowerCase();

        initializeSession({
            activity: activity.toLowerCase(),
            sound: soundValue,
            duration: 0, // 0 duration for "Go with the flow" mode
            volume: volume,
            flowMode: true // Always in flow mode now
        });
    };

    const handlePauseResume = () => {
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    };

    const formatTime = (seconds: number) => {
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="header-gradient rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden shadow-lg">
            <div className="p-4 md:p-6">
                {/* Pioneer CDJ Style Vinyl Decks with Center Play Button */}
                <div className="grid grid-cols-3 gap-4 md:gap-8 items-center mb-4">
                    {/* Left Deck - Activity Selection */}
                    <div className="text-center">
                        <h5 className="text-white/70 text-xs font-medium mb-1 md:mb-2 uppercase tracking-wider">{activity}</h5>
                        <div className="relative">
                            {/* Vinyl Disc */}
                            <div className={`w-24 h-24 md:w-40 md:h-40 mx-auto rounded-full bg-gradient-to-br from-slate-700/80 to-slate-900/80 border-2 md:border-4 border-white/30 relative shadow-2xl backdrop-blur-sm ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
                                {/* Center hole */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-3 h-3 md:w-6 md:h-6 bg-slate-900/90 rounded-full border border-white/40 md:border-2"></div>
                                </div>

                                {/* Grooves */}
                                <div className="absolute inset-1 md:inset-2 rounded-full border border-white/20"></div>
                                <div className="absolute inset-2 md:inset-4 rounded-full border border-white/15"></div>
                                <div className="absolute inset-3 md:inset-6 rounded-full border border-white/12"></div>
                                <div className="absolute inset-4 md:inset-8 rounded-full border border-white/10"></div>
                                <div className="absolute inset-6 md:inset-12 rounded-full border border-white/8"></div>

                                {/* Pioneer-style dots */}
                                <div className="absolute inset-1 rounded-full">
                                    {[...Array(8)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-0.5 h-0.5 md:w-1 md:h-1 bg-white/40 rounded-full"
                                            style={{
                                                top: '50%',
                                                left: '50%',
                                                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-${isMobile ? '42px' : '70px'})`
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Activity Selector */}
                            <div className="mt-2 md:mt-3">
                                <div className="text-center mb-1">
                                    <span className="text-white/50 text-xs uppercase tracking-wider">Pick Activity</span>
                                </div>
                                <Select value={activity} onValueChange={setActivity}>
                                    <SelectTrigger className="w-20 md:w-28 mx-auto bg-white/20 border-white/30 text-white text-xs h-6 md:h-7 backdrop-blur-sm">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Work">Work</SelectItem>
                                        <SelectItem value="Study">Study</SelectItem>
                                        <SelectItem value="Code">Code</SelectItem>
                                        <SelectItem value="Focus">Focus</SelectItem>
                                        <SelectItem value="Reading">Reading</SelectItem>
                                        <SelectItem value="Writing">Writing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Center - Play/Pause Button and Volume Control */}
                    <div className="flex flex-col items-center gap-3 md:gap-6">
                        {/* Focus Time Display */}
                        <div className="text-center">
                            <div className="text-white/90 font-mono text-sm md:text-lg font-bold tracking-wider">
                                {isRunning
                                    ? formatTime(timeElapsed || 0)
                                    : "Ready to focus"
                                }
                            </div>
                        </div>

                        {/* Play/Pause Button */}
                        <Button
                            onClick={isRunning ? handlePauseResume : handleStartFocus}
                            className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white/20 hover:bg-white/30 text-white shadow-2xl border-2 md:border-4 border-white/40 backdrop-blur-sm transition-all duration-200"
                        >
                            {isRunning ? (
                                <Pause className="h-6 w-6 md:h-10 md:w-10" />
                            ) : (
                                <Play className="h-6 w-6 md:h-10 md:w-10 ml-0.5 md:ml-1" />
                            )}
                        </Button>

                        {/* DJ-Style Volume Control - Only show if sound is selected */}
                        {sound !== 'None' && (
                            <div className="flex flex-col items-center gap-2 md:gap-3 mt-1 md:mt-2">
                                <span className="text-white/70 text-xs font-medium uppercase tracking-wider">VOLUME</span>
                                <div className="relative w-24 md:w-32 h-3 md:h-4">
                                    {/* Volume Fader Background */}
                                    <div className="w-full h-full bg-black/50 rounded-full border border-white/30 relative shadow-lg backdrop-blur-sm">
                                        {/* Volume Track */}
                                        <div className="absolute inset-0.5 md:inset-1 rounded-full bg-slate-900/80">
                                            {/* Volume Fill */}
                                            <div
                                                className="absolute left-0 top-0 bottom-0 bg-white/70 rounded-full transition-all duration-200"
                                                style={{ width: `${volume}%` }}
                                            />
                                        </div>

                                        {/* Volume Fader Handle */}
                                        <div
                                            className="absolute w-2 h-4 md:w-3 md:h-6 bg-white/90 rounded border border-white/40 shadow-lg cursor-pointer transition-all duration-200 hover:bg-white pointer-events-none"
                                            style={{
                                                left: `${volume}%`,
                                                top: '-2px',
                                                transform: 'translateX(-50%)'
                                            }}
                                        />
                                    </div>

                                    {/* Volume Input */}
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={(e) => setVolume(parseInt(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Deck - Sound Selection */}
                    <div className="text-center">
                        <h5 className="text-white/70 text-xs font-medium mb-1 md:mb-2 uppercase tracking-wider">{sound === 'None' ? 'NO SOUND' : sound}</h5>
                        <div className="relative">
                            {/* Vinyl Disc or Empty Turntable */}
                            {sound === 'None' ? (
                                /* Empty Turntable */
                                <div className="w-24 h-24 md:w-40 md:h-40 mx-auto rounded-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 md:border-4 border-white/30 relative shadow-2xl backdrop-blur-sm">
                                    {/* Turntable platter */}
                                    <div className="absolute inset-2 md:inset-3 rounded-full bg-slate-900/90 border border-white/20"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-3 md:w-6 md:h-6 bg-slate-900/90 rounded-full border border-white/40 md:border-2"></div>
                                    </div>

                                    {/* Tone arm */}
                                    <div className="absolute -right-2 md:-right-3 top-1/2 w-6 md:w-10 h-0.5 md:h-1 bg-white/60 rounded transform -translate-y-1/2"></div>
                                    <div className="absolute -right-0.5 md:-right-1 top-1/2 w-1 h-1 md:w-2 md:h-2 bg-white/80 rounded-full transform -translate-y-1/2"></div>

                                    {/* Pioneer-style dots */}
                                    <div className="absolute inset-1 rounded-full">
                                        {[...Array(8)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-0.5 h-0.5 md:w-1 md:h-1 bg-white/40 rounded-full"
                                                style={{
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-${isMobile ? '42px' : '70px'})`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Sound Vinyl Disc */
                                <div className={`w-24 h-24 md:w-40 md:h-40 mx-auto rounded-full bg-gradient-to-br from-slate-700/80 to-slate-900/80 border-2 md:border-4 border-white/30 relative shadow-2xl backdrop-blur-sm ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }}>
                                    {/* Center hole */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-3 md:w-6 md:h-6 bg-slate-900/90 rounded-full border border-white/40 md:border-2"></div>
                                    </div>

                                    {/* Grooves */}
                                    <div className="absolute inset-1 md:inset-2 rounded-full border border-white/20"></div>
                                    <div className="absolute inset-2 md:inset-4 rounded-full border border-white/15"></div>
                                    <div className="absolute inset-3 md:inset-6 rounded-full border border-white/12"></div>
                                    <div className="absolute inset-4 md:inset-8 rounded-full border border-white/10"></div>
                                    <div className="absolute inset-6 md:inset-12 rounded-full border border-white/8"></div>

                                    {/* Pioneer-style dots */}
                                    <div className="absolute inset-1 rounded-full">
                                        {[...Array(8)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-0.5 h-0.5 md:w-1 md:h-1 bg-white/40 rounded-full"
                                                style={{
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-${isMobile ? '42px' : '70px'})`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sound Selector */}
                            <div className="mt-2 md:mt-3">
                                <div className="text-center mb-1">
                                    <span className="text-white/50 text-xs uppercase tracking-wider">Pick Sound</span>
                                </div>
                                <Select value={sound} onValueChange={setSound}>
                                    <SelectTrigger className="w-20 md:w-28 mx-auto bg-white/20 border-white/30 text-white text-xs h-6 md:h-7 backdrop-blur-sm">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="None">None</SelectItem>
                                        <SelectItem value="Rain">Rain</SelectItem>
                                        <SelectItem value="Waves">Waves</SelectItem>
                                        <SelectItem value="Nature">Nature</SelectItem>
                                        <SelectItem value="Forest">Forest</SelectItem>
                                        <SelectItem value="Coffee">Coffee Shop</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}