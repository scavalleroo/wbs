import { useEffect, useState } from 'react';

interface AnalogClockProps {
    timeRemaining: number;
    totalTime: number;
}

export function AnalogClock({ timeRemaining, totalTime }: AnalogClockProps) {
    const size = 300;
    const center = size / 2;
    const radius = size * 0.4;
    const strokeWidth = 6;

    // Calculate progress
    const progress = timeRemaining / totalTime;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    // Convert seconds to hour and minute for clock hands
    const minutes = Math.floor(timeRemaining / 60) % 60;
    const seconds = timeRemaining % 60;

    // Calculate hand angles
    const minuteAngle = (minutes / 60) * 360;
    const secondAngle = (seconds / 60) * 360;

    return (
        <div className="relative">
            <svg width={size} height={size}>
                {/* Clock face */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius + 20}
                    fill="transparent"
                    stroke="currentColor"
                    strokeOpacity={0.1}
                    strokeWidth={1}
                />

                {/* Hour markers */}
                {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const x1 = center + (radius - 10) * Math.cos(angle);
                    const y1 = center + (radius - 10) * Math.sin(angle);
                    const x2 = center + radius * Math.cos(angle);
                    const y2 = center + radius * Math.sin(angle);

                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="currentColor"
                            strokeWidth={i % 3 === 0 ? 3 : 1}
                            strokeOpacity={0.8}
                        />
                    );
                })}

                {/* Progress ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius + 20}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                />

                {/* Minute hand */}
                <line
                    x1={center}
                    y1={center}
                    x2={center + radius * 0.7 * Math.sin(minuteAngle * (Math.PI / 180))}
                    y2={center - radius * 0.7 * Math.cos(minuteAngle * (Math.PI / 180))}
                    stroke="currentColor"
                    strokeWidth={4}
                    strokeLinecap="round"
                />

                {/* Second hand */}
                <line
                    x1={center}
                    y1={center}
                    x2={center + radius * 0.9 * Math.sin(secondAngle * (Math.PI / 180))}
                    y2={center - radius * 0.9 * Math.cos(secondAngle * (Math.PI / 180))}
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="text-primary"
                />

                {/* Center dot */}
                <circle
                    cx={center}
                    cy={center}
                    r={5}
                    fill="currentColor"
                />
            </svg>
        </div>
    );
}