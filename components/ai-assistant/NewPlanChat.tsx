"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { OpenAIService } from '@/utils/openai-service';
import { useSupabase } from '@/lib/supabase-provider';
import { useRouter } from 'next/navigation';

type Message = {
    role: 'user' | 'assistant';
    content: string;
}

export default function NewPlanChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const openAIService = OpenAIService.getInstance();
    const { supabase, session } = useSupabase();
    const router = useRouter();

    // Auto-scroll to bottom when messages update
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial greeting
    useEffect(() => {
        setMessages([
            {
                role: 'assistant',
                content: "Hello! I'm here to help you create a new plan. Let's start with your main goal. What would you like to achieve?"
            }
        ]);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);

        // Add user message immediately
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            let assistantResponse = '';
            await openAIService.sendMessage(userMessage, (chunk) => {
                assistantResponse += chunk;
                setMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages[newMessages.length - 1].role === 'assistant') {
                        newMessages[newMessages.length - 1].content = assistantResponse;
                    } else {
                        newMessages.push({ role: 'assistant', content: assistantResponse });
                    }
                    return newMessages;
                });
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I encountered an error. Please try again."
            }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const MessageBubble = ({ message }: { message: Message }) => (
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

    return (
        <div className="flex flex-col h-screen max-h-screen bg-gray-50">
            <div className="p-4 bg-white border-b">
                <h1 className="text-2xl font-bold">Create New Plan</h1>
                <p className="text-gray-600">Chat with AI to define your plan</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto">
                    {messages.map((message, index) => (
                        <MessageBubble key={index} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-4 bg-white border-t">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}