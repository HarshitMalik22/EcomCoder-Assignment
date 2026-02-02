"use client";

import { useState, KeyboardEvent } from 'react';
import { ArrowRight, Globe, Loader2 } from 'lucide-react';
import { validateUrl } from '@/lib/validators';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

export default function URLInput() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const router = useRouter();

    const handleAnalyze = async () => {
        const { isValid, error, formattedUrl } = validateUrl(url);
        if (!isValid) {
            addToast(error || "Invalid URL", "error");
            return;
        }

        setIsLoading(true);
        try {
            addToast("Validating URL...", "info");
            await new Promise(resolve => setTimeout(resolve, 800));
            addToast("Starting analysis...", "success");
            router.push(`/generate?url=${encodeURIComponent(formattedUrl || url)}`);
        } catch (e) {
            addToast("Failed to verify URL", "error");
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleAnalyze();
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-3">
            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/30 transition-colors">
                <div className="pl-4 pr-2 text-zinc-500">
                    <Globe className="w-5 h-5" />
                </div>
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="https://example.com"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 h-12 px-2 text-base"
                    disabled={isLoading}
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !url}
                    className="ml-2 mr-2 flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 px-5 py-2.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analyzing</span>
                        </>
                    ) : (
                        <>
                            <span>Generate</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
            <p className="text-center text-xs text-zinc-500">
                Paste a page URL to detect sections and generate components.
            </p>
        </div>
    );
}
