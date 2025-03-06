"use client";

import { useState, useEffect } from 'react';

/**
 * A hook that creates a debounced value that only updates after a specified delay
 * has passed since the last time the input value changed.
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds (default is 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay has elapsed
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}