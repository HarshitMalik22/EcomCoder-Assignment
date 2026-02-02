
interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

interface ConversationState {
    messages: ConversationMessage[];
    componentVersion: number;
}

const STORAGE_KEY = 'ecomcoder_conversation_context';

export class ConversationStore {
    static saveState(state: ConversationState) {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    static loadState(): ConversationState | null {
        if (typeof window === 'undefined') return null;
        const stored = sessionStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    static clearState() {
        if (typeof window === 'undefined') return;
        sessionStorage.removeItem(STORAGE_KEY);
    }

    static addMessage(role: 'user' | 'assistant', content: string): ConversationMessage {
        const message: ConversationMessage = {
            id: crypto.randomUUID(),
            role,
            content,
            timestamp: Date.now(),
        };

        const currentState = this.loadState() || { messages: [], componentVersion: 0 };
        currentState.messages.push(message);
        this.saveState(currentState);

        return message;
    }

    static getHistory(): ConversationMessage[] {
        const state = this.loadState();
        return state?.messages || [];
    }
}
