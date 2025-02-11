import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Check, ChevronLeft } from 'lucide-react';
import { OpenAIService } from '@/utils/openai-service';
import { MessageBubble } from './MessageBubble';
import { Message, PlanData } from '@/types/plan';
import { usePlanInitialization } from '@/hooks/usePlanInitialization';

export default function NewPlanChat({ planData }: { planData: PlanData }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const openAIService = OpenAIService.getInstance();
    const { error, isInitializing } = usePlanInitialization(planData, setMessages);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setInput('');
        setIsLoading(true);

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            let assistantResponse = '';
            await openAIService.sendMessage(userMessage, (chunk) => {
                assistantResponse += chunk;
                setMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
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

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-h-screen bg-secondary-100">
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
                        placeholder="Ask for plan changes..."
                        disabled={isLoading || isInitializing}
                        className="flex-1 p-4"
                        style={{ fontSize: '1.1rem' }}
                    />
                    <Button type="submit" disabled={isLoading || isInitializing}>
                        {isLoading || isInitializing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
                <div className='flex flex-row justify-between mt-2'>
                    <Button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2"
                        variant="outline"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </Button>
                    {!isLoading && !isInitializing && (
                        <Button
                            type="submit"
                            className='bg-green-700 hover:bg-green-500'
                            disabled={isLoading || isInitializing}
                        >
                            <Check className="h-4 w-4" /> <p>Activate Plan</p>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}