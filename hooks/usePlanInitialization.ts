import { useState, useEffect, useRef } from 'react';
import { OpenAIService } from '@/utils/openai-service';
import { format } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { Message, MessageConstructor, Plan } from '../types/plan';

export const usePlanInitialization = (planData: Plan, onStreamUpdate: (messages: Message[]) => void) => {
    const [error, setError] = useState<Error | null>(null);
    const supabase = createClient();
    const openAIService = OpenAIService.getInstance();
    const [isInitializing, setIsInitializing] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            if (isInitializing || !isMounted) {
                return;
            }

            setIsInitializing(true);
            openAIService.resetThread();
            let responseTitle: string | undefined;

            try {
                if (isMounted) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error('No user found');

                    const prompt = generateInitialPrompt(planData);

                    let assistantResponse = '';
                    if (isMounted) {
                        console.log('Initializing plan with prompt:', prompt);
                        await openAIService.sendMessage(prompt, (chunk) => {
                            if (isMounted) {
                                assistantResponse += chunk;
                                let initialMessage;
                                try {
                                    console.log('Assistant response 1:', assistantResponse);
                                    let response = JSON.parse(assistantResponse);
                                    response.plan.loading = false;
                                    responseTitle = response.plan.title;  // Store the title
                                    initialMessage = MessageConstructor.createAssistantMessage(response);
                                } catch {
                                    console.log('Assistant response 2:', assistantResponse);
                                    initialMessage = MessageConstructor.createAssistantMessage({ plan: { loading: true } }, null);
                                }
                                onStreamUpdate([initialMessage]);
                            }
                        });
                    }

                    if (isMounted) {
                        const newThreadID = openAIService.getThreadID();
                        if (!newThreadID) throw new Error('Failed to create thread');

                        // Pass the responseTitle to createPlanInDatabase
                        await createPlanInDatabase(user.id, newThreadID, planData, responseTitle);
                        console.log('Plan initialization completed successfully');
                    }
                }
            } catch (err) {
                console.error('Plan initialization failed:', err);
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Unknown error'));
                }
            } finally {
                if (isMounted) {
                    setIsInitializing(false);
                }
            }
        };

        initialize();

        return () => {
            isMounted = false;
        };
    }, [planData, onStreamUpdate]);

    return { error, isInitializing };
};

const generateInitialPrompt = (planData: Plan): string => {
    return `Goals: ${planData.goals.join(', ')} 
    Readiness Level: ${planData.user_resources}
    Deadline: ${format(planData.end_date || new Date(), 'MMMM d, yyyy')}
    Current Date: ${format(new Date(), 'MMMM d, yyyy')}, and today is a ${format(new Date(), 'EEEE')}
    Current Time: ${format(new Date(), 'HH:mm:ss')}`;
};

const createPlanInDatabase = async (
    userId: string,
    threadId: string,
    planData: Plan,
    responseTitle?: string
) => {
    const supabase = createClient();
    const { error } = await supabase
        .from('plans')
        .insert({
            user_id: userId,
            goals: planData.goals,
            end_date: planData.end_date ? format(planData.end_date, 'yyyy-MM-dd') : null,
            thread_id: threadId,
            title: responseTitle || planData.title, // Use responseTitle if available, fall back to planData.title
            user_resources: planData.user_resources,
            start_date: format(new Date(), 'yyyy-MM-dd')
        });

    if (error) throw error;
};