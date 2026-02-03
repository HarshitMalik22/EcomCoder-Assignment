"use client";

import React from 'react';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface ScrapeErrorModalProps {
    error: string;
    onRetry: () => void;
    onBack: () => void;
}

export default function ScrapeErrorModal({ error, onRetry, onBack }: ScrapeErrorModalProps) {
    // Sanitize error - if it's too long, truncate it
    const displayError = error.length > 500 ? error.substring(0, 500) + '...' : error;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                        <div className="p-2 rounded-full bg-red-500/10">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Scraping Failed</h2>
                    </div>

                    <p className="text-zinc-400 mb-6 leading-relaxed">
                        We hit a problem while trying to analyze the website. This can happen due to bot protection, complex layouts, or temporary connection issues.
                    </p>

                    <div className="bg-black/40 rounded-lg p-4 mb-6 border border-white/5">
                        <p className="text-xs font-mono text-zinc-500 uppercase mb-2 tracking-wider font-bold">Technical Details</p>
                        <div className="max-h-40 overflow-y-auto text-[13px] text-red-400/90 font-mono break-words leading-relaxed custom-scrollbar">
                            {displayError}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onRetry}
                            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-amber-500/10"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                        <button
                            onClick={onBack}
                            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl font-medium transition-colors border border-white/10"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 bg-white/5 border-t border-white/5">
                    <p className="text-xs text-zinc-500 text-center">
                        Tip: Some sites (like Aceternity) have strong bot protection. Try another URL.
                    </p>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
