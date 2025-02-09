"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, CheckCheck, Check, ChevronLeft } from 'lucide-react';
import { OpenAIService } from '@/utils/openai-service';
import { PlanData } from './PlanCreationWizard';
import { format } from 'date-fns';
import { createClient } from '@/utils/supabase/client';

type Message = {
    role: 'user' | 'assistant';
    content: string;
}

export default function NewPlanChat({ planData }: { planData: PlanData }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const openAIService = OpenAIService.getInstance();

    // Auto-scroll to bottom when messages update
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!hasInitialized) {
            createPlan(planData);
            setHasInitialized(true);
        }
    }, [planData, hasInitialized]);


    const createPlan = async (planData: any) => {
        const prompt = `Create a ${planData.type === 'custom' ? planData.customType : planData.type} plan with the following goals: ${planData.goals.join(', ')}. The plan is for ${planData.description} and ${planData.deadlineDate ? `The deadline is ${format(planData.deadlineDate, 'MMMM d, yyyy')}` : `should last for ${planData.durationValue} ${planData.durationUnit}`}. Today is the ${format(new Date(), 'MMMM d, yyyy')}.`;

        if (prompt && messages.length === 0 && !isLoading) {
            setIsLoading(true); // Set loading at the start
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    console.error('No user found');
                    return;
                }

                // Send message to assistant
                console.log('Sending initial message to assistant:', prompt);
                await sendMessageToAssistant(prompt, false);
                const threadID = openAIService.getThreadID();

                console.log('Thread ID:', threadID);

                if (threadID) {
                    // Insert plan into Supabase
                    const { data, error } = await supabase
                        .from('plans')
                        .insert({
                            user_id: user.id,
                            goals: planData.goals,
                            deadline: planData.deadlineDate ? format(planData.deadlineDate, 'yyyy-MM-dd') : null,
                            priority: 'medium',
                            status: 'active',
                            progress: 0,
                            thread_id: threadID,
                            duration_type: planData.durationType,
                            duration_unit: planData.durationUnit,
                            duration_value: planData.durationValue,
                            title: planData.title,
                            description: planData.description,
                            type: planData.type,
                            custom_type: planData.customType
                        })
                        .select()
                        .single();

                    if (error) {
                        throw error;
                    }

                    console.log('Plan created successfully:', data);
                    return data;
                }
            } catch (error) {
                console.error('Error creating plan:', error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        sendMessageToAssistant(userMessage);
    };


    async function sendMessageToAssistant(userMessage: string, addToMessages = true) {
        setInput('');
        setIsLoading(true);

        if (addToMessages) {
            // Add user message immediately
            setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        }

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
    }

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
                        disabled={isLoading}
                        className="flex-1 p-4"
                        style={{ fontSize: '1.1rem' }}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
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
                    {!isLoading && (
                        <Button type="submit" className='bg-green-700 hover:bg-green-500' disabled={isLoading}>
                            <Check className="h-4 w-4" /> <p>Activate Plan</p>
                        </Button>
                    )}
                </div>
            </div>
        </div >
    );
}