import { Message } from '@/types/plan';
import React from 'react';

export const MessageBubble = ({ message }: { message: Message }) => (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div
            className={`max-w-[80%] px-4 py-2 rounded-lg ${message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
        >
            <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
    </div>
);