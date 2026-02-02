
import React, { useEffect, useState } from 'react';
import { ConversationStore } from '@/lib/context/conversation-store';
import { Clock, MessageSquare } from 'lucide-react';

interface IterationHistoryProps {
    className?: string;
    onHistoryUpdate?: () => void;
}

export const IterationHistory: React.FC<IterationHistoryProps> = ({ className = '', onHistoryUpdate }) => {
    const [history, setHistory] = useState(ConversationStore.getHistory());

    useEffect(() => {
        // Poll for updates or rely on parent trigger. Ideally we'd use a real state manager (Zustand/Context).
        // For now, load once.
        setHistory(ConversationStore.getHistory());

        const handleStorage = () => {
            setHistory(ConversationStore.getHistory());
        };

        window.addEventListener('storage', handleStorage); // Only works across tabs usually
        return () => window.removeEventListener('storage', handleStorage);
    }, [onHistoryUpdate]);

    if (history.length === 0) {
        return (
            <div className={`text-center text-gray-500 py-4 ${className}`}>
                <p className="text-sm">No iteration history yet.</p>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className} max-h-64 overflow-y-auto`}>
            {history.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                        className={`
                            max-w-[80%] rounded-lg p-3 text-sm
                            ${msg.role === 'user'
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                            }
                        `}
                    >
                        <p>{msg.content}</p>
                        <span className="text-[10px] opacity-70 mt-1 block">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};
