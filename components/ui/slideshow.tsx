'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface SlideProps {
    children: React.ReactNode;
}

export const Slide: React.FC<SlideProps> = ({ children }) => {
    const ref = useRef(null);

    // Using IntersectionObserver directly since there may be issues with the import
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0.6 }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    return (
        <div
            ref={ref}
            className="min-h-[100vh] w-full flex items-center justify-center scroll-snap-align-start"
            data-active={isInView ? "true" : "false"}
        >
            <div className="w-full max-w-6xl px-4 sm:px-6 py-12 md:py-16">
                {children}
            </div>
        </div>
    );
};

interface SlideshowProps {
    children: React.ReactNode;
    className?: string;
    projectSlug?: string;
    gradient?: string;
}

export const Slideshow: React.FC<SlideshowProps> = ({
    children,
    className,
    projectSlug = "weko",
    gradient = "linear-gradient(135deg, #3B82F6 0%, #3730A3 100%)"
}) => {
    const slides = React.Children.toArray(children);
    const [currentSlide, setCurrentSlide] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInViewport, setIsInViewport] = useState(false);

    // Check if Slideshow is in viewport
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInViewport(entry.isIntersecting);
            },
            { threshold: 0.1 } // Even a small part visible will trigger
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, []);

    // Update active slide based on which slide is most visible in viewport
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
                        const slideIndex = Array.from(containerRef.current?.querySelectorAll('[data-active]') || [])
                            .findIndex(slide => slide === entry.target);

                        if (slideIndex !== -1) {
                            setCurrentSlide(slideIndex);
                        }
                    }
                });
            },
            { threshold: 0.4 }
        );

        const slideElements = containerRef.current?.querySelectorAll('[data-active]');
        slideElements?.forEach(slide => {
            observer.observe(slide);
        });

        return () => {
            slideElements?.forEach(slide => {
                observer.unobserve(slide);
            });
        };
    }, []);

    // Apply text-white class to elements whenever the slideshows are mounted
    useEffect(() => {
        if (!containerRef.current) return;

        // Select all text elements that should be white
        const textElements = containerRef.current.querySelectorAll(
            'h1, h2, h3, h4, h5, h6, p, span, strong, em, li, a:not([class*="bg-"]), div:not([class*="bg-"])'
        );

        // Add text-white class to each element
        textElements.forEach(el => {
            if (el instanceof HTMLElement) {
                el.classList.add('text-white');
            }
        });
    }, []);

    const scrollToSlide = (index: number) => {
        const slideElements = containerRef.current?.querySelectorAll('[data-active]');
        if (slideElements && slideElements[index]) {
            slideElements[index].scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full overflow-x-hidden text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_p]:text-white [&_strong]:text-white [&_span]:text-white [&_div]:text-white",
                className
            )}
            style={{
                background: gradient,
                scrollSnapType: 'y mandatory',
                color: 'white'
            }}
        >
            {/* Slides Container */}
            {slides}

            {/* Navigation Dots - Only visible when component is in viewport */}
            {isInViewport && (
                <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
                    {slides.map((_, index) => (
                        <button
                            key={`dot_${index}`}
                            onClick={() => scrollToSlide(index)}
                            className={cn(
                                "transition-all duration-300",
                                currentSlide === index
                                    ? "w-3 h-8 rounded-full bg-white" // Expanded size when active
                                    : "w-3 h-3 rounded-full bg-white/50 hover:bg-white/70"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Progressive scroll hint */}
            <motion.div
                className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-20 text-white flex flex-col items-center gap-1 md:gap-2"
                initial={{ opacity: 1 }}
                animate={{ opacity: currentSlide > 0 ? 0 : 1 }}
                transition={{ duration: 0.5 }}
            >
                <span className="text-xs md:text-sm font-medium">Scroll to explore</span>
                <svg width="16" height="10" viewBox="0 0 20 12" xmlns="http://www.w3.org/2000/svg" className="animate-bounce">
                    <path d="M10 12L0 2L2 0L10 8L18 0L20 2L10 12Z" fill="currentColor" />
                </svg>
            </motion.div>
        </div>
    );
};