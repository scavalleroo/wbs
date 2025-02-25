import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronLeft, Check, MoreVertical, Trash2, CalendarPlus } from 'lucide-react';
import { OpenAIService } from '@/utils/openai-service';
import { Message, MessageConstructor, Plan, PlanOpenAI } from '@/types/plan';
import PlanTimeline from '../ai-chat/plans/PlanTimeLine';
import { MessageBubble } from '../ai-chat/plans/MessageBubble';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlanService } from './service';

export default function PlanDetailsContent({ planData }: { planData: Plan }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const openAIService = OpenAIService.getInstance(false);
    const router = useRouter();

    useEffect(() => {
        const loadThreadMessages = async () => {
            if (!planData.thread_id) {
                setIsLoadingMessages(false);
                return;
            }

            try {
                await openAIService.loadExistingThread(planData.thread_id);
                const threadMessages = await openAIService.getThreadMessages(planData.thread_id);

                const convertedMessages = threadMessages
                    .filter((msg, index) => !(index === 0 && msg.role === 'user'))
                    .map(threadMessage => {
                        if (threadMessage.role === 'assistant') {
                            try {
                                const content = threadMessage.content[0];
                                if (content.type === 'text') {
                                    const parsedResponse = JSON.parse(content.text.value);
                                    return MessageConstructor.createAssistantMessage(parsedResponse);
                                }
                            } catch (e) {
                                return MessageConstructor.createAssistantMessage(
                                    null,
                                    threadMessage.content[0].type === 'text'
                                        ? threadMessage.content[0].text.value
                                        : 'Message content not available'
                                );
                            }
                        } else {
                            return MessageConstructor.createUserMessage(
                                threadMessage.content[0].type === 'text'
                                    ? threadMessage.content[0].text.value
                                    : 'Message content not available'
                            );
                        }
                    });

                setMessages(convertedMessages.filter((msg): msg is Message => msg !== undefined));
            } catch (error) {
                console.error('Error loading thread messages:', error);
            } finally {
                setIsLoadingMessages(false);
            }
        };

        loadThreadMessages();
    }, [planData.thread_id]);

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
                try {
                    let response = JSON.parse(assistantResponse);
                    response.plan.loading = false;
                    setMessages(prev => MessageConstructor.updateMessageResponse(prev, response));
                } catch {
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

    const handleDeletePlan = async () => {
        setIsDeleting(true);
        try {
            await PlanService.deletePlan(planData.id);
            // Redirect to the plans list page
            router.push('/dashboard/main');
            router.refresh();
        } catch (error) {
            console.error('Error deleting plan:', error);
        } finally {
            setIsDeleting(false);
            setShowDeleteAlert(false);
        }
    };

    const handleActivatePlan = async () => {
        setIsLoading(true);
        try {
            const lastMessage = messages.at(-1);
            if (!lastMessage?.response?.plan) {
                throw new Error('No valid plan found in the last message');
            }

            await PlanService.insertPlanActivities(Number(planData.id), lastMessage.response.plan);
            router.push('/dashboard/main');
            router.refresh();
        } catch (error) {
            console.error('Error activating plan:', error);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col md:h-[calc(100vh-118px)] h-[calc(100vh-90px)] max-h-screen bg-secondary-100 w-full">
            <div className="flex-1 overflow-y-auto p-4">
                <div className="mx-auto">
                    {isLoadingMessages ? (
                        <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            message.role === 'assistant' ? (
                                message.response?.plan &&
                                <PlanTimeline key={index} plan={message.response.plan} />
                            ) : (
                                <MessageBubble key={index} message={message} />
                            )
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-2 bg-white border-t">
                <div className="flex justify-between items-center max-w-full px-4">
                    <div className="flex-1 max-w-3xl mx-auto">
                        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                    }}
                                    placeholder="Ask for plan changes..."
                                    disabled={isLoading || isLoadingMessages}
                                    className="w-full p-4 resize-none overflow-hidden rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    style={{
                                        fontSize: '1.1rem',
                                        minHeight: '56px',
                                        maxHeight: '200px'
                                    }}
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (input.trim() && !isLoading && !isLoadingMessages) {
                                                handleSubmit(e);
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading || isLoadingMessages}
                                className="h-10 w-10 p-0 flex-shrink-0"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </form>
                    </div>
                    <div className="ml-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => setShowDeleteAlert(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Plan
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    disabled={isLoading || isLoadingMessages}
                                    onClick={handleActivatePlan}
                                >
                                    <CalendarPlus className="h-4 w-4 mr-1" /> <p>Add to Weko calendar</p>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this plan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the plan
                            and all its associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePlan}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}