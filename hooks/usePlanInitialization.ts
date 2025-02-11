import { useState, useEffect, useRef } from 'react';
import { OpenAIService } from '@/utils/openai-service';
import { format } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { Message, PlanData } from '../types/plan';

export const usePlanInitialization = (planData: PlanData, onStreamUpdate: (messages: Message[]) => void) => {
    const [error, setError] = useState<Error | null>(null);
    const supabase = createClient();
    const openAIService = OpenAIService.getInstance();
    const [isInitializing, setIsInitializing] = useState(false);

    // Add planData and onStreamUpdate to dependency array
    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            // Prevent multiple simultaneous initializations
            if (isInitializing || !isMounted) {
                return;
            }

            setIsInitializing(true);
            openAIService.resetThread();

            try {
                if (isMounted) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error('No user found');

                    const prompt = generateInitialPrompt(planData);

                    let assistantResponse = '';
                    if (isMounted) {
                        console.log('Initializing plan with prompt:', prompt);
                        await openAIService.sendMessage(prompt, (chunk) => {
                            // Only update if component is still mounted
                            if (isMounted) {
                                assistantResponse += chunk;
                                onStreamUpdate([{ role: 'assistant', content: assistantResponse }]);
                            }
                        });
                    }

                    if (isMounted) {
                        const newThreadID = openAIService.getThreadID();
                        if (!newThreadID) throw new Error('Failed to create thread');

                        await createPlanInDatabase(user.id, newThreadID, planData);
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

        // Cleanup function to prevent state updates after unmount
        return () => {
            isMounted = false;
        };
    }, [planData, onStreamUpdate]); // Add dependencies

    return { error, isInitializing };
};


const generateInitialPrompt = (planData: PlanData): string => {
    return `Create a ${planData.type === 'custom' ? planData.customType : planData.type} plan with the following goals: ${planData.goals.join(', ')}. The plan is for ${planData.description} and ${planData.deadlineDate ? `The deadline is ${format(planData.deadlineDate, 'MMMM d, yyyy')}` : `should last for ${planData.durationValue} ${planData.durationUnit}`}. Today is the ${format(new Date(), 'MMMM d, yyyy')}.`;
};

const createPlanInDatabase = async (userId: string, threadId: string, planData: PlanData) => {
    const supabase = createClient();
    const { error } = await supabase
        .from('plans')
        .insert({
            user_id: userId,
            goals: planData.goals,
            deadline: planData.deadlineDate ? format(planData.deadlineDate, 'yyyy-MM-dd') : null,
            priority: 'medium',
            status: 'active',
            progress: 0,
            thread_id: threadId,
            duration_type: planData.durationType,
            duration_unit: planData.durationUnit,
            duration_value: planData.durationValue,
            title: planData.title,
            description: planData.description,
            type: planData.type,
            custom_type: planData.customType
        });

    if (error) throw error;
};