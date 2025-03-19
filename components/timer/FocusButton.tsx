import { PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { FocusSelector } from './FocusSelector';
import { FullScreenTimer } from './FullScreenTimer';
import { DialogTitle } from '@radix-ui/react-dialog';
import { useTimer } from '@/contexts/TimerProvider';

export function FocusButton() {
    const [showFocusSelector, setShowFocusSelector] = useState(false);
    const [showFocusMode, setShowFocusMode] = useState(false);

    // Use the shared timer context
    const { initializeSession } = useTimer();

    const startFocusSession = (settings: {
        activity: string;
        sound: string;
        duration: number;
        volume: number;
        flowMode?: boolean;
    }) => {
        // Initialize the shared timer state
        initializeSession({
            activity: settings.activity,
            sound: settings.sound,
            duration: settings.duration,
            volume: settings.volume || 50,
            flowMode: settings.flowMode || false,
            initialTimeRemaining: settings.flowMode ? 0 : settings.duration * 60,
            initialTimeElapsed: 0
        });

        // Close selector and show fullscreen timer
        setShowFocusSelector(false);
        setShowFocusMode(true);
    };

    const handleMinimize = () => {
        // No need to pass session data - it's stored in the context
        setShowFocusMode(false);
        // The Footer will automatically show because it uses the same context
    };

    return (
        <>
            <button
                onClick={() => setShowFocusSelector(true)}
                className="px-4 py-2 md:px-5 md:py-2.5 bg-white text-indigo-600 rounded-full flex items-center gap-1 md:gap-1.5 text-sm md:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300"
            >
                <PlayCircle className="size-4 md:size-4" />
                Start Focus Session
            </button>

            <Dialog open={showFocusSelector} onOpenChange={setShowFocusSelector}>
                <DialogContent className="sm:max-w-xl md:max-w-2xl p-0 border-0 bg-transparent max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-1 shadow-xl">
                        <div className="bg-white dark:bg-neutral-900 rounded-lg p-0 overflow-y-auto max-h-[80vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <DialogTitle>
                                <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 p-6 text-white">
                                    <h2 className="text-2xl font-bold mb-1">Set up your focus session</h2>
                                    <p className="opacity-80">Customize your perfect environment</p>
                                </div>
                            </DialogTitle>

                            <FocusSelector onStart={startFocusSession} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {showFocusMode && (
                <FullScreenTimer
                    onClose={() => setShowFocusMode(false)}
                    onMinimize={handleMinimize}
                />
            )}
        </>
    );
}

// Enhanced focus button with modern gradient design (unchanged)
export function EnhancedFocusButton() {
    return (
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-70 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative">
                <FocusButton />
            </div>
        </div>
    );
}