"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Download, Code, Eye, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import SectionSelector from '@/components/SectionSelector';
import LivePreview from '@/components/LivePreview';
import ChatInterface from '@/components/ChatInterface';
import CodeDisplay from '@/components/CodeDisplay';
import CopyButton from '@/components/CopyButton';
import { useToast } from '@/components/ui/Toast';
import { SectionMetadata } from '@/types/section';
import { GeneratedComponent } from '@/types/generated-component';
import { generateDownload } from '@/lib/export/file-generator';

function GeneratePageContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get('url');

    const [step, setStep] = useState<'detecting' | 'selecting' | 'generating' | 'preview'>('detecting');
    const [sections, setSections] = useState<SectionMetadata[]>([]);
    const [fullPageScreenshot, setFullPageScreenshot] = useState<string | undefined>();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [generatedComponents, setGeneratedComponents] = useState<GeneratedComponent[]>([]);
    const [activeComponentId, setActiveComponentId] = useState<string | null>(null);
    const [isRefining, setIsRefining] = useState(false);
    const [isCodePanelOpen, setIsCodePanelOpen] = useState(true);
    const [previewMode, setPreviewMode] = useState<'generated' | 'original'>('generated');
    const { addToast } = useToast();

    // 1. Detect Sections on Load
    useEffect(() => {
        if (!url) return;

        const detect = async () => {
            try {
                const res = await fetch('/api/detect-sections', {
                    method: 'POST',
                    body: JSON.stringify({ url }),
                });
                const data = await res.json();

                if (!res.ok) throw new Error(data.error);

                setSections(data.data.sections);
                setFullPageScreenshot(data.data.fullPageScreenshot);
                setStep('selecting');
                addToast(`Found ${data.data.sections.length} sections`, 'success');
            } catch (e) {
                addToast((e as Error).message, 'error');
                // Stay on detecting or show error
            }
        };

        detect();
    }, [url, addToast]);

    // 2. Generate Components
    const handleGenerate = async (ids: string[]) => {
        setSelectedIds(ids);
        setStep('generating');

        try {
            // Process sequentially to avoid rate limits? Or parallel.
            // We'll do parallel for now.
            const promises = ids.map(async (id) => {
                const section = sections.find(s => s.id === id);
                if (!section) return null;

                const res = await fetch('/api/generate', {
                    method: 'POST',
                    body: JSON.stringify({ sectionData: section }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data.data as GeneratedComponent;
            });

            const results = (await Promise.all(promises)).filter(c => c !== null) as GeneratedComponent[];

            setGeneratedComponents(results);
            if (results.length > 0) {
                setActiveComponentId(results[0].id);
                setStep('preview');
                addToast("Components generated successfully!", "success");
            }
        } catch (e) {
            addToast("Failed to generate components", 'error');
            setStep('selecting');
        }
    };

    // 3. Refine Component
    const handleRefine = async (instruction: string) => {
        if (!activeComponentId) return;
        setIsRefining(true);

        try {
            const current = generatedComponents.find(c => c.id === activeComponentId);
            if (!current) return;

            const res = await fetch('/api/refine', {
                method: 'POST',
                body: JSON.stringify({
                    code: current.code,
                    instruction,
                    id: current.id
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Update component
            setGeneratedComponents(prev => prev.map(c =>
                c.id === activeComponentId ? { ...c, code: data.data.code } : c
            ));

            addToast("Component updated!", "success");
        } catch (e) {
            addToast("Refinement failed", "error");
        } finally {
            setIsRefining(false);
        }
    };

    const handleBack = () => {
        if (step === 'preview') {
            setStep('selecting');
        } else if (step === 'generating') {
            setStep('selecting');
        } else {
            // If detecting or selecting, go back home
            window.location.href = '/';
        }
    };

    if (!url) {
        return <div className="p-10 text-center">No URL provided</div>;
    }

    const activeComponent = generatedComponents.find(c => c.id === activeComponentId);

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto space-y-8" suppressHydrationWarning>
                {/* Header */}
                <div className="flex items-center justify-between" suppressHydrationWarning>
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-xl font-bold truncate max-w-md">{url}</h1>
                    <div className="w-20"></div>
                </div>

                {/* LOADING STATE - DETECTING */}
                {step === 'detecting' && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                        <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
                        <h2 className="text-2xl font-semibold">Scanning Website...</h2>
                        <p className="text-zinc-500 mt-2">Analyzing structure, capturing screenshots, and identifying components.</p>
                    </div>
                )}

                {/* SELECT STATE */}
                {step === 'selecting' && (
                    <SectionSelector
                        sections={sections}
                        onGenerate={handleGenerate}
                        isGenerating={false}
                    />
                )}

                {/* GENERATING STATE */}
                {step === 'generating' && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                        <div className="relative">
                            <div className="absolute inset-0 bg-violet-500 blur-xl opacity-20 animate-pulse"></div>
                            <Loader2 className="w-16 h-16 text-violet-500 animate-spin relative z-10" />
                        </div>
                        <h2 className="text-2xl font-semibold mt-8">Generating AI Components...</h2>
                        <p className="text-zinc-500 mt-2">Writing React code, generating Tailwind styles, and optimizing accessibility.</p>
                    </div>
                )}

                {/* PREVIEW STATE */}
                {step === 'preview' && activeComponent && (
                    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-8 duration-700">

                        {/* LEFT COLUMN: Checkbox / Toggle for Code Panel */}
                        <div
                            className={`flex flex-col gap-4 transition-all duration-300 ease-in-out overflow-hidden ${isCodePanelOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 min-w-0'
                                }`}
                            style={{
                                width: isCodePanelOpen ? '35%' : '0px',
                                minWidth: isCodePanelOpen ? '350px' : '0px',
                                display: 'flex'
                            }}
                        >
                            <div className="flex items-center justify-between min-w-[350px]">
                                <div className="flex items-center gap-2">
                                    <Code className="w-5 h-5 text-zinc-400" />
                                    <span className="font-semibold">Code</span>
                                </div>
                                <div className="flex gap-2">
                                    <CopyButton text={activeComponent.code} />
                                    <button
                                        onClick={() => generateDownload(activeComponent.name, activeComponent.code)}
                                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden min-w-[350px]">
                                <CodeDisplay key={activeComponent.code.length} code={activeComponent.code} />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Preview (65%) */}
                        <div className="flex-1 flex flex-col gap-4 min-w-0">
                            {/* Header: Toggle & Tabs */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 w-full">
                                        <button
                                            onClick={() => setIsCodePanelOpen(!isCodePanelOpen)}
                                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors flex-shrink-0"
                                            title={isCodePanelOpen ? "Close Code Panel" : "Open Code Panel"}
                                        >
                                            {isCodePanelOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                                        </button>

                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
                                            {generatedComponents.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        setActiveComponentId(c.id);
                                                        setPreviewMode('generated');
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeComponentId === c.id
                                                        ? 'bg-white text-black border-white'
                                                        : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white'
                                                        }`}
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Comparison Tabs */}
                                <div className="flex bg-zinc-900 rounded-lg p-1 w-fit">
                                    <button
                                        onClick={() => setPreviewMode('generated')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${previewMode === 'generated'
                                            ? 'bg-zinc-800 text-white shadow-sm'
                                            : 'text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        Live Preview
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode('original')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${previewMode === 'original'
                                            ? 'bg-zinc-800 text-white shadow-sm'
                                            : 'text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        Original Screenshot
                                    </button>
                                </div>
                            </div>

                            {/* Preview Area */}
                            <div className="flex-1 border border-white/10 rounded-xl overflow-hidden bg-zinc-900/50 shadow-2xl relative">
                                {previewMode === 'generated' ? (
                                    <LivePreview code={activeComponent.code} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center p-8 bg-black">
                                        {sections.find(s => s.id === activeComponent.id)?.screenshot ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={`data:image/jpeg;base64,${sections.find(s => s.id === activeComponent.id)?.screenshot}`}
                                                alt="Original Screenshot"
                                                className="max-w-full max-h-full object-contain rounded-lg border border-white/10"
                                            />
                                        ) : (
                                            <div className="text-zinc-500">No screenshot available</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Chat / Refine */}
                            <div className="mt-auto">
                                <ChatInterface
                                    onSendMessage={handleRefine}
                                    isLoading={isRefining}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function GeneratePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
            <GeneratePageContent />
        </Suspense>
    );
}
