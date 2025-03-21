import { JSONContent } from "novel";

export const mostPopularDomains = [
    { name: "Facebook", domain: "facebook.com" },
    { name: "Instagram", domain: "instagram.com" },
    { name: "Twitter", domain: "twitter.com" },
    { name: "YouTube", domain: "youtube.com" },
    { name: "TikTok", domain: "tiktok.com" },
    { name: "Reddit", domain: "reddit.com" },
    { name: "Netflix", domain: "netflix.com" },
    { name: "Twitch", domain: "twitch.tv" }
];

// Default content for new notes
export const defaultEditorContent: JSONContent = {
    type: 'doc',
    content: [
        {
            type: 'paragraph',
            content: []
        }
    ]
};

export const firstLoginEditorContent: JSONContent = {
    type: 'doc',
    content: [
        {
            type: 'paragraph',
            content: [
                {
                    type: 'text',
                    text: 'Must Do:'
                }
            ]
        },
        {
            type: 'paragraph',
            content: [
                {
                    type: 'text',
                    text: 'Could Do:'
                }
            ]
        }
    ]
};

// Shared color scheme for all wellness reports
export const reportColors = {
    // Card border accents
    cardBorders: {
      focus: "border-purple-500",
      digital: "border-indigo-500", 
      wellness: "border-blue-500",
    },
    
    // Card header text
    headers: {
      focus: {
        light: "text-purple-600",
        dark: "text-purple-400"
      },
      digital: {
        light: "text-indigo-600",
        dark: "text-indigo-400"
      },
      wellness: {
        light: "text-blue-600",
        dark: "text-blue-400"
      }
    },
    
    // Main chart colors
    chartMain: {
      focus: "#9F7AEA", // Purple-400
      digital: "#818CF8", // Indigo-400
      wellness: "#60A5FA", // Blue-400
    },
    
    // Score levels (consistent across all charts)
    scoreLevels: {
      excellent: {
        color: "#10B981", // Emerald-500
        background: "rgba(16, 185, 129, 0.2)"
      },
      good: {
        color: "#60A5FA", // Blue-400
        background: "rgba(96, 165, 250, 0.2)"
      },
      fair: {
        color: "#F59E0B", // Amber-500
        background: "rgba(245, 158, 11, 0.2)"  
      },
      poor: {
        color: "#EF4444", // Red-500
        background: "rgba(239, 68, 68, 0.2)"
      }
    },
    
    // Wellness metrics
    wellness: {
      overall: "#60A5FA", // Blue-400
      mood: "#F59E0B",    // Amber-500
      sleep: "#8B5CF6",   // Purple-500
      nutrition: "#10B981", // Emerald-500
      exercise: "#3B82F6", // Blue-500
      social: "#EC4899",   // Pink-500
    }
  };
  
  // Helper function to get score color
  export const getScoreColor = (score: number | null) => {
    if (score === null) return "text-neutral-400";
    if (score >= 80) return `text-${reportColors.scoreLevels.excellent.color}`;
    if (score >= 60) return `text-${reportColors.scoreLevels.good.color}`;
    if (score >= 40) return `text-${reportColors.scoreLevels.fair.color}`;
    return `text-${reportColors.scoreLevels.poor.color}`;
  };