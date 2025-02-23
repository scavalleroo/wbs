export type Plan = {
    id: string
    user_id: string
    goal: string
    status: 'creation' | 'active' | 'completed' | 'paused'
    created_at: string
    updated_at: string
    thread_id: string | null
    title: string
    user_resources: string
    start_date: Date | undefined
    end_date: Date | undefined
    action: string,
    objective: string,
    outcome: string,
    criteria: string,
}

export interface PlanActivity {
    id: number;
    created_at: string;
    plan: Plan;
    scheduled_timestamp: Date;
    description: string;
    status: 'To do' | 'In Progress' | 'Completed';
    notes: string | null;
    updated_at: string;
    duration?: number;
    metric_type?: string;
    metric_target?: number;
}

export interface Message {
    role: 'user' | 'assistant';
    content: string | null;
    response: PlanResponse | null;
}

export class MessageConstructor {
    private message: Message;

    constructor(role: 'user' | 'assistant', content: string | null = null, response: PlanResponse | null = null) {
        this.message = {
            role,
            content,
            response
        };
    }

    setResponse(response: any): void {
        this.message.response = response;
    }

    getMessage(): Message {
        return { ...this.message };
    }

    static createUserMessage(content: string): Message {
        return new MessageConstructor('user', content, null).getMessage();
    }

    static createAssistantMessage(response: any = null, content: string | null = null): Message {
        return new MessageConstructor('assistant', content, response).getMessage();
    }

    static updateMessageResponse(messages: Message[], assistantResponse: PlanResponse): Message[] {
        const newMessages = [...messages];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
            newMessages[newMessages.length - 1].response = assistantResponse;
        } else {
            newMessages.push(MessageConstructor.createAssistantMessage(assistantResponse));
        }
        return newMessages;
    }
}

// Metric type
export interface Metric {
    type: string;
    value: string;
}

// Task type
export interface Task {
    description: string;
    metric: Metric;
    daily_tasks: { [key: string]: string };
}

// Tasks map type with dynamic period keys
export interface Tasks {
    [period: string]: Task;
}

// Main plan type
export interface PlanOpenAI {
    title: string | null;
    goals: string | null;
    end_date: string | null;
    error: string | null;
    loading: boolean;
    tasks: Task[];
}

// Response wrapper type
export interface PlanResponse {
    plan: PlanOpenAI;
}

export type FormData = {
    startDate?: Date;
    endDate?: Date;
    specificGoal: string;
    measurableActions: string;
    achievableCriteria: string;
    relevantObjective: string;
    customGoal: string;
    customActions: string;
    customCriteria: string;
    customObjective: string;
    currentStep: string;
    generatedText: {
        afterStartDate: string;
        afterSpecificGoal: string;
        afterMeasurableActions: string;
        afterAchievableCriteria: string;
        afterRelevantObjective: string;
    };
};

export type AIResponse = {
    nextText: string;
    options?: { value: string, label: string }[];
    finalPrompt?: boolean;
};

export type GoalStepProps = {
    stepLabel: string;
    currentStep: string;
    isCurrentStepActive: boolean;
    isLoading: boolean;
    fieldValue: string;
    customFieldValue: string;
    options: { value: string, label: string }[];
    onSelectChange: (value: string) => void;
    onCustomInputChange: (value: string) => void;
    onCustomInputSubmit: () => void;
    customPlaceholder: string;
};

export type DatePickerProps = {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    minDate?: Date;
    placeholder: string;
};

export type InlineSelectProps = {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string, label: string }[];
};

export const initialFormData: FormData = {
    startDate: undefined,
    endDate: undefined,
    specificGoal: '',
    measurableActions: '',
    achievableCriteria: '',
    relevantObjective: '',
    customGoal: '',
    customActions: '',
    customCriteria: '',
    customObjective: '',
    currentStep: 'initial', // initial, start_date, specific_goal, etc.
    generatedText: {
        afterStartDate: "I aim to",
        afterSpecificGoal: "by",
        afterMeasurableActions: "in",
        afterAchievableCriteria: "which I will track using",
        afterRelevantObjective: "to be completed by"
    }
};

export const STEPS = {
    INITIAL: 'initial',
    START_DATE: 'start_date',
    SPECIFIC_GOAL: 'specific_goal',
    MEASURABLE_ACTIONS: 'measurable_actions',
    ACHIEVABLE_CRITERIA: 'achievable_criteria',
    RELEVANT_OBJECTIVE: 'relevant_objective',
    END_DATE: 'end_date',
    COMPLETE: 'complete'
};