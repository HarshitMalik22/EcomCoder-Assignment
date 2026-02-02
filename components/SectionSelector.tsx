"use client";

import { useState } from 'react';
import { SectionMetadata } from '@/types/section';
import { Check, Layers, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface SectionSelectorProps {
    sections: SectionMetadata[];
    onGenerate: (selectedIds: string[]) => void;
    isGenerating?: boolean;
}

export default function SectionSelector({ sections, onGenerate, isGenerating }: SectionSelectorProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filter, setFilter] = useState<string>('all');

    const toggleSection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const filteredSections = filter === 'all'
        ? sections
        : sections.filter(s => s.type === filter);

    const uniqueTypes = Array.from(new Set(sections.map(s => s.type)));

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Layers className="w-6 h-6 text-violet-500" />
                        Select Sections to Generate
                    </h2>
                    <p className="text-zinc-400 text-sm">Convert specific parts or the whole page.</p>
                </div>

                <div className="flex gap-2 bg-zinc-900 rounded-lg p-1 border border-white/10">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-md text-sm transition-all ${filter === 'all' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                    >
                        All
                    </button>
                    {uniqueTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-3 py-1.5 rounded-md text-sm capitalize transition-all ${filter === type ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSections.map((section) => (
                    <div
                        key={section.id}
                        onClick={() => toggleSection(section.id)}
                        className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-300 ${selectedIds.includes(section.id)
                                ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-zinc-900'
                                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
                            }`}
                    >
                        {/* Header / Meta */}
                        <div className="absolute top-3 left-3 z-20 flex gap-2">
                            <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-white/10 capitalize">
                                {section.type}
                            </span>
                            <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-medium text-zinc-400 border border-white/10">
                                {Math.round(section.confidence * 100)}% Match
                            </span>
                        </div>

                        {/* Checkbox Overlay */}
                        <div className={`absolute top-3 right-3 z-20 px-2 py-2 rounded-full transition-all ${selectedIds.includes(section.id) ? 'bg-violet-600 text-white' : 'bg-zinc-800/80 text-zinc-500 group-hover:bg-zinc-700'
                            }`}>
                            <Check className={`w-4 h-4 transition-transform ${selectedIds.includes(section.id) ? 'scale-100' : 'scale-75'}`} />
                        </div>

                        {/* Selection Overlay */}
                        <div className={`absolute inset-0 bg-violet-600/10 z-10 transition-opacity ${selectedIds.includes(section.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-10'}`} />

                        {/* Preview Image */}
                        <div className="aspect-[16/10] bg-zinc-950 w-full overflow-hidden">
                            {section.screenshot ? (
                                <img
                                    src={`data:image/jpeg;base64,${section.screenshot}`}
                                    alt={section.type}
                                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                    <Layers className="w-12 h-12 opacity-20" />
                                </div>
                            )}
                        </div>

                        {/* Footer info (optional) */}
                        <div className="p-3 border-t border-white/5 bg-zinc-900/50">
                            <p className="text-xs text-zinc-500 truncate font-mono">ID: {section.id}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-4 sticky bottom-4 z-50 pointer-events-none">
                <button
                    onClick={() => onGenerate(selectedIds)}
                    disabled={selectedIds.length === 0 || isGenerating}
                    className="pointer-events-auto flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-xl shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating Components...
                        </>
                    ) : (
                        <>
                            Generate {selectedIds.length} Component{selectedIds.length !== 1 ? 's' : ''}
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
