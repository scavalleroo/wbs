import React, { useState } from 'react';

interface MoodScaleProps {
    setMoodRating: (rating: number) => void;
}

const MoodScale: React.FC<MoodScaleProps> = ({ setMoodRating }) => {
    const [selectedMood, setSelectedMood] = useState<number | null>(null);

    const moods = [
        { value: 1, emoji: '😢', label: 'Very Bad' },
        { value: 2, emoji: '😟', label: 'Bad' },
        { value: 3, emoji: '😐', label: 'Neutral' },
        { value: 4, emoji: '🙂', label: 'Good' },
        { value: 5, emoji: '😁', label: 'Very Good' },
    ];

    const handleMoodSelect = (value: number) => {
        setSelectedMood(value);
        setMoodRating(value);
    };

    return (
        <div className="mood-scale">
            <h3>How are you feeling today?</h3>
            <div className="mood-emojis">
                {moods.map((mood) => (
                    <button
                        key={mood.value}
                        onClick={() => handleMoodSelect(mood.value)}
                        className={`mood-button ${selectedMood === mood.value ? 'selected' : ''}`}
                        aria-label={mood.label}
                    >
                        <span className="emoji">{mood.emoji}</span>
                        <span className="label">{mood.label}</span>
                    </button>
                ))}
            </div>
            <style jsx>{`
        .mood-scale {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .mood-emojis {
          display: flex;
          justify-content: space-between;
          margin: 20px 0;
        }
        
        .mood-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: none;
          border: 2px solid transparent;
          border-radius: 10px;
          padding: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mood-button:hover {
          transform: scale(1.1);
        }
        
        .mood-button.selected {
          border-color: #4a90e2;
          background-color: rgba(74, 144, 226, 0.1);
        }
        
        .emoji {
          font-size: 2.5rem;
          margin-bottom: 5px;
        }
        
        .label {
          font-size: 0.8rem;
        }
      `}</style>
        </div>
    );
};

export default MoodScale;