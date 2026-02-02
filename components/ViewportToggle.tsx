"use client";

import { Monitor, Smartphone, Tablet } from "lucide-react";

interface ViewportToggleProps {
    mode: 'desktop' | 'tablet' | 'mobile';
    onChange: (mode: 'desktop' | 'tablet' | 'mobile') => void;
}

export default function ViewportToggle({ mode, onChange }: ViewportToggleProps) {
    return (
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/10">
            <button
                onClick={() => onChange('desktop')}
                className={`p-2 rounded-md transition-all ${mode === 'desktop' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
                title="Desktop"
            >
                <Monitor className="w-4 h-4" />
            </button>
            <button
                onClick={() => onChange('tablet')}
                className={`p-2 rounded-md transition-all ${mode === 'tablet' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
                title="Tablet"
            >
                <Tablet className="w-4 h-4" />
            </button>
            <button
                onClick={() => onChange('mobile')}
                className={`p-2 rounded-md transition-all ${mode === 'mobile' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
                title="Mobile"
            >
                <Smartphone className="w-4 h-4" />
            </button>
        </div>
    );
}
