import OpenAI from 'openai';
import { Assistant } from 'openai/resources/beta/assistants.mjs';
import { Message } from 'openai/resources/beta/threads/messages.mjs';
import { Thread } from 'openai/resources/beta/threads/threads';

export class OpenAIService {
    private static instance: OpenAIService;
    private openaiClient: OpenAI;
    private assistant: Assistant | null = null;
    private thread: Thread | null = null;
    private initializationPromise: Promise<void>;

    public constructor(smartGoal: boolean = false) {
        this.openaiClient = new OpenAI({
            apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            dangerouslyAllowBrowser: true,
        });

        this.initializationPromise = this.initializeAssistant(smartGoal);
    }

    private async initializeAssistant(smartGoal: boolean): Promise<void> {
        try {
            this.assistant = await this.openaiClient.beta.assistants.retrieve(
                process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID_SMART_GOAL!
            );
        } catch (error) {
            console.error('Failed to initialize assistant:', error);
            throw error;
        }
    }

    public static getInstance(smartGoal: boolean = false): OpenAIService {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService(smartGoal);
        }
        return OpenAIService.instance;
    }

    private async ensureInitialized(): Promise<void> {
        await this.initializationPromise;
        if (!this.assistant) {
            throw new Error('Assistant failed to initialize');
        }
    }

    private async ensureThread(): Promise<Thread> {
        if (!this.thread) {
            console.log('Creating new thread');
            this.thread = await this.openaiClient.beta.threads.create();
        }
        return this.thread;
    }

    public async sendMessage(
        input: string,
        onStreamUpdate: (content: string) => void
    ): Promise<string> {
        try {
            await this.ensureInitialized();
            const thread = await this.ensureThread();

            console.log('Sending message:', input);
            await this.openaiClient.beta.threads.messages.create(thread.id, {
                role: "user",
                content: input
            });

            const stream = await this.openaiClient.beta.threads.runs.create(
                thread.id,
                {
                    assistant_id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID_SMART_GOAL!,
                    stream: true
                }
            );

            let fullResponse = '';

            for await (const event of stream) {
                if (event.event === 'thread.message.delta' && event.data.delta.content) {
                    const content = event.data.delta.content[0];
                    if (content.type === 'text') {
                        const chunk = content.text?.value || '';
                        fullResponse += chunk;
                        if (chunk) {
                            onStreamUpdate(chunk);
                        }
                    }
                }
            }

            return fullResponse;
        } catch (error) {
            console.error('Error in sendMessage:', error);
            throw error;
        }
    }

    public async getThreadMessages(threadId?: string): Promise<Message[]> {
        try {
            await this.ensureInitialized();
            const targetThreadId = threadId || this.thread?.id;

            if (!targetThreadId) {
                throw new Error('No thread ID available');
            }

            const response = await this.openaiClient.beta.threads.messages.list(
                targetThreadId,
                {
                    order: 'asc',  // Get messages in chronological order
                    limit: 100     // Adjust this limit as needed
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching thread messages:', error);
            throw error;
        }
    }

    public async loadExistingThread(threadId: string): Promise<void> {
        try {
            await this.ensureInitialized();
            // Verify the thread exists and is accessible
            const thread = await this.openaiClient.beta.threads.retrieve(threadId);
            this.thread = thread;
        } catch (error) {
            console.error('Error loading existing thread:', error);
            throw error;
        }
    }

    public resetThread(): void {
        console.log('Resetting thread');
        this.thread = null;
    }

    public getThreadID(): string | null {
        return this.thread?.id || null;
    }
}