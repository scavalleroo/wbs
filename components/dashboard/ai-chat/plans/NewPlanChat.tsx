import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronLeft } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { usePlanInitialization } from '@/hooks/usePlanInitialization';
import { OpenAIService } from '@/utils/openai-service';
import { Message, MessageConstructor, SmartPlan } from '@/types/plan';
import PlanTimeline from './PlanTimeLine';


export default function NewPlanChat({ smartPlan }: { smartPlan: SmartPlan }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const openAIService = OpenAIService.getInstance(false);
    const { error, isInitializing } = usePlanInitialization(smartPlan, setMessages);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setInput('');
        setIsLoading(true);

        const userMessage = input.trim();
        setMessages(prev => [...prev, MessageConstructor.createUserMessage(userMessage)]);

        try {
            let assistantResponse = '';
            await openAIService.sendMessage(userMessage, (chunk) => {
                assistantResponse += chunk;
                let initialMessage;
                try {
                    console.log('Assistant response 1:', assistantResponse);
                    let response = JSON.parse(assistantResponse);
                    response.plan.loading = false; // Set loading to false when response is successfully parsed
                    setMessages(prev => MessageConstructor.updateMessageResponse(prev, response));
                } catch {
                    console.log('Assistant response 2:', assistantResponse);
                    // Create a message with loading state set to true
                    setMessages(prev => MessageConstructor.updateMessageResponse(prev, {
                        plan: {
                            loading: true,
                            title: null,
                            goal: null,
                            end_date: null,
                            error: null,
                            tasks: []
                        }
                    }));
                }

            });
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [
                ...prev,
                MessageConstructor.createAssistantMessage(
                    null,
                    "I'm sorry, I encountered an error. Please try again."
                )
            ]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    if (error) {
        return <div className="text-red-500">Error: {error.message}</div>;
    }

    return (
        <div className="flex flex-col md:h-[calc(100vh-118px)] h-[calc(100vh-90px)] max-h-screen bg-secondary-100">
            <div className="flex-1 overflow-y-auto p-4">
                <div className="mx-auto">
                    {messages.map((message, index) => (
                        message.role === 'assistant' ? (
                            message.response?.plan &&
                            <PlanTimeline key={index} plan={message.response.plan} isGenerating={isLoading || isInitializing} />
                        ) : (
                            <MessageBubble key={index} message={message} />
                        )
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-4 bg-background border-t border-border">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    <div className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    // Auto-resize the textarea
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                }}
                                placeholder="Ask for plan changes..."
                                disabled={isLoading || isInitializing}
                                className="w-full p-4 resize-none overflow-hidden rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                style={{
                                    fontSize: 'clamp(14px, 2.5vw, 18px)', // Responsive font size
                                    minHeight: '56px',
                                    maxHeight: '200px'
                                }}
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (input.trim() && !isLoading && !isInitializing) {
                                            handleSubmit(e);
                                        }
                                    }
                                }}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading || isInitializing}
                            variant="default"
                            className="h-10 w-10 p-0 flex-shrink-0"
                        >
                            {isLoading || isInitializing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}