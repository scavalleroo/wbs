import { Message } from '@/types/plan';
import React from 'react';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MessageBubble({ message }: { message: Message }) {
    return (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
            >
                <ReactMarkdown children={message.content} remarkPlugins={[remarkGfm]}></ReactMarkdown>
            </div>
        </div>
    );
};