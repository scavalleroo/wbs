import { clsx, type ClassValue } from "clsx"
import { format, isToday, isYesterday } from "date-fns";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// Utility function to format relative time
// Add this helper function at the top of the file
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Just now (less than 30 seconds ago)
  if (diffInSeconds < 30) {
    return 'just now';
  }
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  // Minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 min ago' : `${diffInMinutes} mins ago`;
  }
  
  // Hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hrs ago`;
  }
  
  // Days
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }
  
  // Months
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
  }
  
  // Years
  const diffInYears = Math.floor(diffInMonths / 12);
  return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
};

// Add this function to format dates in a user-friendly way
export const getFormattedDateLabel = (dateString: string) => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
      return "Today";
  } else if (isYesterday(date)) {
      return "Yesterday";
  } else {
      // Format as "Monday, March 15"
      return format(date, "EEEE, MMMM d");
  }
};