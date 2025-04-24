'use client';

import { User } from '@supabase/supabase-js';
import { useState, useRef, useEffect } from 'react';
import { ActivityCard } from './ActivityCard';

interface Props {
    user: User | null | undefined;
}

export default function Break(props: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle intersection observer to track which card is currently visible
    useEffect(() => {
        if (!containerRef.current) return;

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.7, // When 70% of the item is visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
                    setCurrentIndex(index);
                }
            });
        }, options);

        // Observe all card elements
        const cardElements = containerRef.current.querySelectorAll('.tiktok-card');
        cardElements.forEach(card => {
            observer.observe(card);
        });

        return () => {
            cardElements.forEach(card => {
                observer.unobserve(card);
            });
        };
    }, []);

    // Activities data - moved from inline to make code cleaner
    const activities = [
        {
            title: "6 Minutes Meditation Break",
            description: "Relax quickly",
            level: "For Beginners",
            views: 12563,
            audioSrc: "/activities/meditation.mp3",
            colorScheme: "meditation" as const,
        },
        {
            title: "5 Minutes Focus Booster",
            description: "Enhance concentration",
            level: "All Levels",
            views: 9842,
            audioSrc: "/focus.mp3",
            colorScheme: "focus" as const,
        },
        {
            title: "10 Minutes Energy Boost",
            description: "Revitalize your mind",
            level: "Intermediate",
            views: 8741,
            audioSrc: "/energy.mp3",
            colorScheme: "energy" as const,
        },
        {
            title: "3 Minutes Breathing Exercise",
            description: "Quick stress relief",
            level: "For Everyone",
            views: 15427,
            audioSrc: "/breathing.mp3",
            colorScheme: "breathing" as const,
        },
        {
            title: "10 Minutes Creative Flow",
            description: "Spark your imagination",
            level: "Advanced",
            views: 6932,
            audioSrc: "/creative.mp3",
            colorScheme: "creative" as const,
        },
        {
            title: "4 Minutes Deep Relaxation",
            description: "Unwind and reset",
            level: "All Levels",
            views: 11208,
            audioSrc: "/relaxation.mp3",
            colorScheme: "relaxation" as const,
        }
    ];

    return (
        <div
            ref={containerRef}
            className="h-[calc(100vh-80px)] overflow-y-scroll snap-y snap-mandatory"
        >
            {activities.map((activity, index) => (
                <div
                    key={index}
                    data-index={index}
                    className="h-full w-full snap-start snap-always tiktok-card"
                >
                    <ActivityCard
                        title={activity.title}
                        description={activity.description}
                        level={activity.level}
                        views={activity.views}
                        audioSrc={activity.audioSrc}
                        colorScheme={activity.colorScheme}
                        className="h-full"
                        isActive={currentIndex === index}
                        activityId="unique-activity-id"
                        likeCount={42}
                        commentCount={7}
                        shareUrl="https://Weko.ai/break"
                        // onLike={async (id) => {
                        //     // Handle like in your database
                        //     await updateLikeInDatabase(id);
                        // }}
                        // onComment={(id) => {
                        //     // Open comment modal or handle comments
                        //     openCommentModal(id);
                        // }}
                    />
                </div>
            ))}
        </div>
    );
}