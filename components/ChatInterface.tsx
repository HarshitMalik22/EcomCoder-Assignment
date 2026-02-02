"use client";

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, RefreshCw } from 'lucide-react';

interface ChatInterfaceProps {
    onSendMessage: (msg: string) => void;
    isLoading: boolean;
    history?: { role: 'user' | 'assistant', content: string }[];
}

export default function ChatInterface({ onSendMessage, isLoading }: ChatInterfaceProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = () => {
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    return (
        <div className="flex flex-col gap-4 w-full">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI Refinement
            </h3>

            <div className="relative group">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe changes (e.g., 'Make the background darker', 'Add a shadow')"
                    className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl p-4 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none min-h-[50px] max-h-[150px] transition-all"
                    disabled={isLoading}
                    rows={1}
                />

                <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-3 bottom-0.5 top-0.5 my-auto h-8 w-8 flex items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:bg-transparent disabled:text-zinc-600 transition-all"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>

            <p className="text-xs text-zinc-500 text-center">
                Press Enter to submit. Shift+Enter for new line.
            </p>
        </div>
    );
}
