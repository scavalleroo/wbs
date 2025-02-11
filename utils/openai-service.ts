import OpenAI from 'openai';
import { Assistant } from 'openai/resources/beta/assistants.mjs';
import { Thread } from 'openai/resources/beta/threads/threads';

export class OpenAIService {
    private static instance: OpenAIService;
    private openaiClient: OpenAI;
    private assistant: Assistant | null = null;
    private thread: Thread | null = null;
    private initializationPromise: Promise<void>;

    private constructor() {
        this.openaiClient = new OpenAI({
            apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            dangerouslyAllowBrowser: true,
        });

        // Initialize the assistant asynchronously
        this.initializationPromise = this.initializeAssistant();
    }

    private async initializeAssistant(): Promise<void> {
        try {
            this.assistant = await this.openaiClient.beta.assistants.retrieve(
                process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID!
            );
        } catch (error) {
            console.error('Failed to initialize assistant:', error);
            throw error;
        }
    }

    public static getInstance(): OpenAIService {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService();
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

            // Create a message in the thread
            await this.openaiClient.beta.threads.messages.create(thread.id, {
                role: "user",
                content: input
            });

            // Create and stream the run
            const stream = await this.openaiClient.beta.threads.runs.create(
                thread.id,
                {
                    assistant_id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID!,
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

    public resetThread(): void {
        console.log('Resetting thread');
        this.thread = null;
    }

    public getThreadID(): string | null {
        return this.thread?.id || null
    }
}