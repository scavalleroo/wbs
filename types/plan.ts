export type Plan = {
    id: string
    user_id: string
    goals: string[]
    status: 'creation' | 'active' | 'completed' | 'paused'
    created_at: string
    updated_at: string
    thread_id: string | null
    title: string
    user_resources: string
    start_date: Date | undefined
    end_date: Date | undefined
}

export interface PlanActivity {
    id: number;
    created_at: string;
    plan: Plan;
    scheduled_timestamp: string;
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
    daily_tasks: { [key: string]: string } | null;
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