import { BREAKPOINTS } from '@/utils/helpers';
import { useState, useEffect } from 'react';

export const useScreenSize = () => {
    const [screenSize, setScreenSize] = useState('lg');

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < BREAKPOINTS.sm) {
                setScreenSize('sm');
            } else if (width < BREAKPOINTS.md) {
                setScreenSize('md');
            } else {
                setScreenSize('lg');
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return screenSize;
};