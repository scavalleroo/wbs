import { PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { FocusSelector } from './FocusSelector';
import { FullScreenTimer } from './FullScreenTimer';
import { DialogTitle } from '@radix-ui/react-dialog';

interface FocusButtonProps {
    onMinimize?: (session: any) => void;
}

export function FocusButton({ onMinimize }: FocusButtonProps) {
    const [showFocusSelector, setShowFocusSelector] = useState(false);
    const [showFocusMode, setShowFocusMode] = useState(false);
    const [currentSession, setCurrentSession] = useState<any>(null);

    const startFocusSession = (settings: {
        activity: string;
        sound: string;
        duration: number;
        volume: number;
        flowMode?: boolean;
    }) => {
        const session = {
            ...settings,
            timeRemaining: settings.flowMode ? 0 : settings.duration * 60, // time remaining for timed mode
            timeElapsed: 0, // time elapsed for flow mode
            isRunning: true,
            isMuted: false,
            activityIcon: getActivityIcon(settings.activity),
            flowMode: settings.flowMode || false
        };

        setCurrentSession(session);
        setShowFocusSelector(false);
        setShowFocusMode(true);
    };

    const minimizeFocusSession = (session: any) => {
        if (onMinimize) {
            onMinimize(session);
        }
        setShowFocusMode(false);
    };

    const getActivityIcon = (activity: string) => {
        switch (activity) {
            case 'study': return '📚';
            case 'work': return '💼';
            case 'code': return '💻';
            case 'draw': return '🎨';
            default: return '🧠';
        }
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
                    onMinimize={() => minimizeFocusSession(currentSession)}
                    initialSettings={currentSession}
                />
            )}
        </>
    );
}