interface AnalogClockProps {
    timeRemaining: number; // In flow mode, this is time elapsed
    totalTime: number;
    flowMode?: boolean;
}

export function AnalogClock({ timeRemaining, totalTime, flowMode = false }: AnalogClockProps) {
    const size = 300;
    const center = size / 2;
    const radius = size * 0.4;
    const strokeWidth = 6;

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
                    strokeWidth={2}
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

                {/* Define gradients for consistent styling */}
                <defs>
                    <linearGradient id="gradientBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="gradientRadial" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                </defs>

                {/* Minute hand */}
                <line
                    x1={center}
                    y1={center}
                    x2={center + radius * 0.7 * Math.sin(minuteAngle * (Math.PI / 180))}
                    y2={center - radius * 0.7 * Math.cos(minuteAngle * (Math.PI / 180))}
                    stroke="#4F46E5"
                    strokeWidth={4}
                    strokeLinecap="round"
                />

                {/* Second hand */}
                <line
                    x1={center}
                    y1={center}
                    x2={center + radius * 0.9 * Math.sin(secondAngle * (Math.PI / 180))}
                    y2={center - radius * 0.9 * Math.cos(secondAngle * (Math.PI / 180))}
                    stroke="#3B82F6"
                    strokeWidth={2}
                    strokeLinecap="round"
                />

                {/* Center dot */}
                <circle
                    cx={center}
                    cy={center}
                    r={6}
                    fill="url(#gradientRadial)"
                />

                {/* Text label with gradient */}
                <text
                    x={center}
                    y={center + radius / 2}
                    textAnchor="middle"
                    fontSize="12"
                    className="uppercase font-medium"
                    fill="#4F46E5"
                >
                    {flowMode ? "Time Elapsed" : "Time Remaining"}
                </text>
            </svg>
        </div>
    );
}