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