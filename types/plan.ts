export type Plan = {
    id: string
    user_id: string
    goals: string[]
    deadline: Date | undefined
    status: 'creation' | 'active' | 'completed' | 'paused'
    progress: number
    created_at: string
    updated_at: string
    thread_id: string | null
    title: string
    user_resources: string
    startDate: Date | undefined
}

export interface DailyTask {
    date: Date;
    description: string;
}

export interface PlanActivity {
    id: number;
    created_at: string;
    plan_id: number;
    scheduled_date: string;
    description: string;
    status: string;
    daily_tasks: Record<string, string>;
    metric_type: string;
    metric_target: string;
    actual_result: string | null;
    completion_notes: string | null;
    updated_at: string;
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


// Enum types for better type safety
export enum PlanGranularity {
    DayByDay = 'dayByDay',
    WeekByWeek = 'weekByWeek',
    MonthByMonth = 'monthByMonth',
    Year = 'year'
}

export enum DetailLevel {
    Low = 'low',
    Medium = 'medium',
    High = 'high'
}

export enum TaskStatus {
    NotStarted = 'Not Started',
    InProgress = 'In Progress',
    Completed = 'Completed',
    Delayed = 'Delayed'
}

// Metric type
export interface Metric {
    type: string;
    value: string;
}

// Task type
export interface Task {
    description: string;
    status: TaskStatus;
    metric: Metric;
    daily_tasks: { [key: string]: string } | null;
}

// Tasks map type with dynamic period keys
export interface Tasks {
    [period: string]: Task;

}

// Main plan type
export interface PlanOpenAI {
    granularity: PlanGranularity | null;
    detailLevel: DetailLevel | null;
    title: string | null;
    goals: string | null;
    deadline: string | null;
    tasks: Tasks | null;
    error: string | null;
    loading: boolean;
}

// Response wrapper type
export interface PlanResponse {
    plan: PlanOpenAI;
}