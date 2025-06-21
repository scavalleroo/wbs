import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility

interface MoodScaleProps {
  question: string; // This can be kept if you want a title above the scale, or removed if question is always handled outside
  onSelect: (rating: number) => void;
  questionType: 'mood' | 'sleep' | 'nutrition' | 'exercise' | 'social' | string; // More specific types
  isMobile?: boolean;
}

interface ScaleItem {
  rating: number;
  emoji: string;
  label: string;
}

const ratingScales: Record<string, ScaleItem[]> = {
  default: [ // Fallback scale
    { rating: 1, emoji: '😢', label: 'Poor' },
    { rating: 2, emoji: '😕', label: 'Fair' },
    { rating: 3, emoji: '😐', label: 'Ok' },
    { rating: 4, emoji: '🙂', label: 'Good' },
    { rating: 5, emoji: '😁', label: 'Great' },
  ],
  mood: [
    { rating: 1, emoji: '😭', label: 'Awful' },
    { rating: 2, emoji: '😔', label: 'Bad' },
    { rating: 3, emoji: '😐', label: 'Okay' },
    { rating: 4, emoji: '😊', label: 'Good' },
    { rating: 5, emoji: '🤩', label: 'Amazing' },
  ],
  sleep: [
    { rating: 1, emoji: '😩', label: 'Restless' },
    { rating: 2, emoji: '🥱', label: 'Tired' },
    { rating: 3, emoji: '😴', label: 'Decent' },
    { rating: 4, emoji: '😌', label: 'Rested' },
    { rating: 5, emoji: '😇', label: 'Recharged' },
  ],
  nutrition: [
    { rating: 1, emoji: '🤢', label: 'Unhealthy' },
    { rating: 2, emoji: '🍟', label: 'Indulgent' },
    { rating: 3, emoji: '🥗', label: 'Balanced' },
    { rating: 4, emoji: '🍎', label: 'Healthy' },
    { rating: 5, emoji: '🏆', label: 'Optimal' },
  ],
  exercise: [
    { rating: 1, emoji: '🛋️', label: 'None' },
    { rating: 2, emoji: '🚶', label: 'Light' },
    { rating: 3, emoji: '🏃', label: 'Moderate' },
    { rating: 4, emoji: '💪', label: 'Vigorous' },
    { rating: 5, emoji: '⚡', label: 'Intense' },
  ],
  social: [
    { rating: 1, emoji: '💔', label: 'Isolated' },
    { rating: 2, emoji: '🙁', label: 'Lonely' },
    { rating: 3, emoji: '💬', label: 'Connected' },
    { rating: 4, emoji: '😊', label: 'Engaged' },
    { rating: 5, emoji: '🎉', label: 'Fulfilled' },
  ],
};

const MoodScale = ({ question, onSelect, questionType, isMobile }: MoodScaleProps) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const currentScale = useMemo(() => {
    return ratingScales[questionType] || ratingScales.default;
  }, [questionType]);

  const handleSelect = (rating: number) => {
    setSelectedRating(rating);
    setTimeout(() => onSelect(rating), 200); // Slightly shorter delay
  };

  const emojiSizeClass = isMobile ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl md:text-3xl";
  const labelSizeClass = isMobile ? "text-[10px] sm:text-xs" : "text-[9px] sm:text-xs";

  return (
    <div className="space-y-2 py-2 sm:py-4">
      {question && <p className="text-sm font-medium text-center sm:text-base mb-2 sm:mb-4">{question}</p>}
      <div className="flex justify-around items-end px-1 sm:px-2"> {/* Changed to justify-around and items-end for better spacing */}
        {currentScale.map((item) => (
          <button
            key={item.rating}
            type="button"
            onClick={() => handleSelect(item.rating)}
            className={cn(
              `flex flex-col items-center transition-all duration-150 ease-in-out p-1 sm:p-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`,
              selectedRating === item.rating
                ? 'scale-110 sm:scale-115 bg-white/20 dark:bg-neutral-700/50' // Enhanced selected state
                : 'opacity-70 hover:opacity-100 hover:bg-white/10 dark:hover:bg-neutral-700/30'
            )}
            aria-label={`Select rating: ${item.label}`}
          >
            <span className={cn(emojiSizeClass, "mb-1 sm:mb-1.5")}>{item.emoji}</span>
            <span className={cn(labelSizeClass, "whitespace-nowrap")}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodScale;