'use client';

import { User } from '@supabase/supabase-js';
import { useState, useRef, useEffect } from 'react';
import { ChatRoom } from './ChatRoom';
import { ActivityCard } from './ActivityCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    user: User | null | undefined;
}

export default function Break(props: Props) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [cardWidth, setCardWidth] = useState(320); // Default card width
    const [cardsPerView, setCardsPerView] = useState(2); // Default number of cards visible

    // Calculate card width and visible cards count
    useEffect(() => {
        const calculateDimensions = () => {
            const container = scrollContainerRef.current;
            if (!container) return;

            // Get the first card element
            const cardElements = container.querySelectorAll('.activity-card');
            if (cardElements.length === 0) return;

            // Calculate actual card width including gap
            const firstCard = cardElements[0] as HTMLElement;
            const cardRect = firstCard.getBoundingClientRect();
            const cardWithGap = cardRect.width + 16; // 16px is the gap value
            setCardWidth(cardWithGap);

            // Calculate how many cards fit in the view
            const containerWidth = container.clientWidth;
            const visibleCards = Math.floor(containerWidth / cardWithGap);
            setCardsPerView(Math.max(1, visibleCards));
        };

        calculateDimensions();

        // Recalculate on resize
        window.addEventListener('resize', calculateDimensions);
        return () => window.removeEventListener('resize', calculateDimensions);
    }, []);

    // Update arrow visibility whenever scroll happens
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        };

        // Initial check
        handleScroll();

        // Add event listener
        container.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);

        // Cleanup
        return () => {
            container.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    // Scroll handlers with exact card positioning
    const scrollLeft = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        try {
            // Calculate scroll amount based on visible cards
            const scrollAmount = cardWidth * cardsPerView;

            // Get current scroll position
            const currentPosition = container.scrollLeft;

            // Calculate target position (aligned to card boundary)
            const targetPosition = Math.floor(currentPosition / cardWidth) * cardWidth - scrollAmount;

            // Smooth scroll to target
            container.scrollTo({
                left: Math.max(0, targetPosition),
                behavior: 'smooth'
            });
        } catch (error) {
            console.error("Error scrolling left:", error);
            // Simple fallback
            container.scrollLeft -= cardWidth * cardsPerView;
        }
    };

    const scrollRight = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        try {
            // Calculate scroll amount based on visible cards
            const scrollAmount = cardWidth * cardsPerView;

            // Get current scroll position
            const currentPosition = container.scrollLeft;

            // Calculate target position (aligned to card boundary)
            const targetPosition = Math.ceil(currentPosition / cardWidth) * cardWidth + scrollAmount;

            // Smooth scroll to target
            container.scrollTo({
                left: Math.min(container.scrollWidth - container.clientWidth, targetPosition),
                behavior: 'smooth'
            });
        } catch (error) {
            console.error("Error scrolling right:", error);
            // Simple fallback
            container.scrollLeft += cardWidth * cardsPerView;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="relative px-10">
                {/* Left arrow with improved clickable area */}
                <div
                    className={`absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-pointer z-20 ${showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        } transition-opacity duration-200`}
                    onClick={scrollLeft}
                    aria-hidden={!showLeftArrow}
                >
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-10 w-10 rounded-full shadow-md bg-background/90 backdrop-blur-sm border-border"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </div>

                {/* Right arrow with improved clickable area */}
                <div
                    className={`absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-pointer z-20 ${showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        } transition-opacity duration-200`}
                    onClick={scrollRight}
                    aria-hidden={!showRightArrow}
                >
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-10 w-10 rounded-full shadow-md bg-background/90 backdrop-blur-sm border-border"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>

                {/* Scroll container with consistent card width */}
                <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide scroll-smooth snap-x"
                >
                    <ActivityCard
                        title="6 Minutes Meditation Break"
                        description="Relax quickly"
                        level="For Beginners"
                        views={12563}
                        audioSrc="/activities/meditation.mp3"
                        colorScheme="meditation"
                        className="min-w-[280px] sm:min-w-[320px] md:min-w-[380px] flex-shrink-0 activity-card snap-start"
                    />
                    <ActivityCard
                        title="5 Minutes Focus Booster"
                        description="Enhance concentration"
                        level="All Levels"
                        views={9842}
                        audioSrc="/focus.mp3"
                        colorScheme="focus"
                        className="min-w-[280px] sm:min-w-[320px] md:min-w-[380px] flex-shrink-0 activity-card snap-start"
                    />
                    <ActivityCard
                        title="10 Minutes Energy Boost"
                        description="Revitalize your mind"
                        level="Intermediate"
                        views={8741}
                        audioSrc="/energy.mp3"
                        colorScheme="energy"
                        className="min-w-[280px] sm:min-w-[320px] md:min-w-[380px] flex-shrink-0 activity-card snap-start"
                    />
                    <ActivityCard
                        title="3 Minutes Breathing Exercise"
                        description="Quick stress relief"
                        level="For Everyone"
                        views={15427}
                        audioSrc="/breathing.mp3"
                        colorScheme="breathing"
                        className="min-w-[280px] sm:min-w-[320px] md:min-w-[380px] flex-shrink-0 activity-card snap-start"
                    />
                    <ActivityCard
                        title="8 Minutes Creative Flow"
                        description="Spark your imagination"
                        level="Advanced"
                        views={6932}
                        audioSrc="/creative.mp3"
                        colorScheme="creative"
                        className="min-w-[280px] sm:min-w-[320px] md:min-w-[380px] flex-shrink-0 activity-card snap-start"
                    />
                    <ActivityCard
                        title="4 Minutes Deep Relaxation"
                        description="Unwind and reset"
                        level="All Levels"
                        views={11208}
                        audioSrc="/relaxation.mp3"
                        colorScheme="relaxation"
                        className="min-w-[280px] sm:min-w-[320px] md:min-w-[380px] flex-shrink-0 activity-card snap-start"
                    />
                </div>
            </div>
            {/* <ChatRoom /> */}
        </div>
    );
}