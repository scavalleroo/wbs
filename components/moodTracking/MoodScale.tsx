import { useState } from 'react';

interface MoodScaleProps {
  question: string;
  onSelect: (rating: number) => void;
}

const MoodScale = ({ question, onSelect }: MoodScaleProps) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const moods = [
    { rating: 1, emoji: '😢', label: 'Poor' },
    { rating: 2, emoji: '😕', label: 'Fair' },
    { rating: 3, emoji: '😐', label: 'Ok' },
    { rating: 4, emoji: '🙂', label: 'Good' },
    { rating: 5, emoji: '😁', label: 'Great' },
  ];

  const handleSelect = (rating: number) => {
    setSelectedRating(rating);
    // Short delay to show selection before moving to next step
    setTimeout(() => onSelect(rating), 300);
  };

  return (
    <div className="space-y-4 py-4">
      <p className="text-sm font-medium text-center sm:text-base">{question}</p>
      <div className="flex justify-between items-center px-1 py-2">
        {moods.map((mood) => (
          <button
            key={mood.rating}
            type="button"
            onClick={() => handleSelect(mood.rating)}
            className={`flex flex-col items-center transition-all px-1 py-2 rounded-md ${selectedRating === mood.rating
                ? 'scale-110 bg-neutral-200 dark:bg-neutral-700'
                : 'opacity-70 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            aria-label={`Select rating: ${mood.label}`}
          >
            <span className="text-xl sm:text-3xl md:text-4xl">{mood.emoji}</span>
            <span className="text-[9px] sm:text-xs mt-2 whitespace-nowrap">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodScale;