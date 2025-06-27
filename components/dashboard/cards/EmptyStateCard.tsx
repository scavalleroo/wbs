'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

interface EmptyStateCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    actionText: string;
    onActionClick: () => void;
    gradient: string;
    tips?: string[];
}

export function EmptyStateCard({
    title,
    description,
    icon,
    actionText,
    onActionClick,
    gradient,
    tips = []
}: EmptyStateCardProps) {
    return (
        <div className={`rounded-2xl p-6 ${gradient} text-white shadow-lg relative overflow-hidden`}>
            {/* Decorative elements */}
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/10 z-0"></div>
            <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-white/10 z-0"></div>
            <div className="absolute inset-0 bg-black/10 z-0"></div>

            <div className="relative z-10 text-center">
                {/* Icon */}
                <div className="text-6xl opacity-80 mb-4">
                    {icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-white/80 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                    {description}
                </p>

                {/* Tips */}
                {tips.length > 0 && (
                    <div className="bg-white/10 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-center mb-2">
                            <Sparkles className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">Quick Tips</span>
                        </div>
                        <ul className="text-xs text-white/80 space-y-1">
                            {tips.map((tip, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="text-white/60 mr-2">•</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Action Button */}
                <Button
                    onClick={onActionClick}
                    className="bg-white/20 hover:bg-white/30 text-white border-none px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                >
                    {actionText}
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
