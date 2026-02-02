"use client";

import { useState, KeyboardEvent } from 'react';
import { ArrowRight, Globe, Loader2, Sparkles } from 'lucide-react';
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

        // Simulate initial check or navigation
        // Next steps will involve scraping, for now we just prepare the UI state
        try {
            // In a real flow, we might ping the scrape API here or just navigate to restart the flow
            addToast("Validating URL...", "info");

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // Success
            addToast("URL verified! Starting analysis...", "success");

            // Navigate to generation page
            router.push(`/generate?url=${encodeURIComponent(formattedUrl || url)}`);
            // Keep loading state until navigation happens
            // setIsLoading(false);
        } catch (e) {
            addToast("Failed to verify URL", "error");
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAnalyze();
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center bg-white dark:bg-zinc-900 rounded-xl shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 p-2">
                    <div className="pl-4 pr-2 text-gray-500">
                        <Globe className="w-5 h-5" />
                    </div>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="https://example.com"
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 h-12 text-lg px-2"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !url}
                        className="ml-2 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-500/25"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Analyzing</span>
                            </>
                        ) : (
                            <>
                                <span>Generate</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Quick Validation Hint */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span>Enter a website URL to generate AI components instantly</span>
            </div>
        </div>
    );
}
