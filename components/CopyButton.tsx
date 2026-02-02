"use client";

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-all border border-white/5 hover:border-white/10"
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copied</span>
                </>
            ) : (
                <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Code</span>
                </>
            )}
        </button>
    );
}
