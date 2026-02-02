"use client";

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, RefreshCw } from 'lucide-react';

interface ChatInterfaceProps {
    onSendMessage: (msg: string) => void;
    isLoading: boolean;
    history?: { timestamp: number; prompt?: string; code: string }[];
    onRevert?: (code: string) => void;
}

export default function ChatInterface({ onSendMessage, isLoading, history, onRevert }: ChatInterfaceProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history?.length]);

    return (
        <div className="flex flex-col gap-4 w-full h-full">
            {/* History Display */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                {(!history || history.length === 0) && (
                    <div className="text-center text-zinc-500 text-sm py-10">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No changes yet. Describe what you want to improve.</p>
                    </div>
                )}

                {history?.map((item, index) => (
                    item.prompt ? (
                        <div key={item.timestamp} className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="self-end bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%] text-sm">
                                {item.prompt}
                            </div>
                            {index < history.length - 1 && onRevert && (
                                <button
                                    onClick={() => onRevert(item.code)}
                                    className="self-start flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Revert to this version
                                </button>
                            )}
                        </div>
                    ) : null
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative group shrink-0">
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
        </div>
    );
}
