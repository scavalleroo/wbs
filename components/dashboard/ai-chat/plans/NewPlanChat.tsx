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
    const inputRef = useRef<HTMLInputElement>(null);
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
                            goals: null,
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
        <div className="flex flex-col h-[calc(100vh-140px)] max-h-screen bg-secondary-100">
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto">
                    {messages.map((message, index) => (
                        message.role === 'assistant' ? (
                            message.response?.plan &&
                            <PlanTimeline key={index} plan={message.response.plan} />
                        ) : (
                            <MessageBubble key={index} message={message} />
                        )
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-4 bg-background border-t border-border">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask for plan changes..."
                        disabled={isLoading || isInitializing}
                        className="flex-1 p-4 bg-background"
                        style={{ fontSize: '1.1rem' }}
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || isInitializing}
                        variant="default"
                    >
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
                </div>
            </div>
        </div>
    );
}