"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Download, Code, Eye, PanelLeftClose, PanelLeftOpen, RefreshCw, RotateCcw } from 'lucide-react';
import SectionSelector from '@/components/SectionSelector';
import LivePreview from '@/components/LivePreview';
import ChatInterface from '@/components/ChatInterface';
import CodeDisplay from '@/components/CodeDisplay';
import CopyButton from '@/components/CopyButton';
import { useToast } from '@/components/ui/Toast';
import { SectionMetadata } from '@/types/section';
import { GeneratedComponent } from '@/types/generated-component';
import { DeployButtons } from '@/components/DeployButtons';
import { generateDownload } from '@/lib/export/file-generator';
import ScrapeErrorModal from '@/components/ScrapeErrorModal';

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
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isCodePanelOpen, setIsCodePanelOpen] = useState(true);
    const [previewMode, setPreviewMode] = useState<'generated' | 'original'>('generated');
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();

    // State Persistence
    const STORAGE_KEY = `ecomcoder_gen_state_${url ? encodeURIComponent(url) : 'default'}`;

    // 1. Detect Sections or Restore
    const detectSections = useCallback(async (forceRefresh = false) => {
        if (!url) return;

        if (forceRefresh) {
            sessionStorage.removeItem(STORAGE_KEY);
            setStep('detecting'); // Explicitly set detecting to show loader
            setError(null);
        } else {
            // Try to restore first
            try {
                const saved = sessionStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const state = JSON.parse(saved);
                    if (state.sections && state.sections.length > 0) {
                        setSections(state.sections);
                        setFullPageScreenshot(state.fullPageScreenshot);
                        setStep(state.step);
                        setSelectedIds(state.selectedIds || []);
                        setGeneratedComponents(state.generatedComponents || []);
                        setActiveComponentId(state.activeComponentId || null);
                        addToast("Restored previous session", "info");
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to restore state", e);
            }
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const res = await fetch('/api/detect-sections', {
                method: 'POST',
                body: JSON.stringify({ url }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const data = await res.json();

            if (!res.ok) {
                // Check if we already have some sections (partial failure)
                if (data.data?.sections && data.data.sections.length > 0) {
                    setSections(data.data.sections);
                    setFullPageScreenshot(data.data.fullPageScreenshot);
                    setStep('selecting');
                    addToast(`Warning: Some parts failed, but found ${data.data.sections.length} sections`, 'info');
                    return;
                }
                throw new Error(data.error || "Failed to analyze page");
            }

            setSections(data.data.sections);
            setFullPageScreenshot(data.data.fullPageScreenshot);
            setStep('selecting');
            addToast(`Found ${data.data.sections.length} sections`, 'success');
        } catch (e) {
            const msg = (e as Error).message;
            addToast(msg === 'Aborted' ? 'Request timed out' : msg, 'error');
            setError(msg === 'Aborted' ? 'Request timed out' : msg);
        }
    }, [url, addToast, STORAGE_KEY]);

    // Initial load
    useEffect(() => {
        // Only run if we are in detecting step (initial) or explicitly requested
        if (step === 'detecting' && sections.length === 0) {
            detectSections();
        }
    }, [detectSections, step, sections.length]);

    // Save state on change
    useEffect(() => {
        if (!url || sections.length === 0) return;

        // Persist a lightweight version of state to avoid exceeding storage quotas.
        // We intentionally drop large screenshot payloads from individual sections,
        // since they can be re-fetched if needed.
        const lightweightSections = sections.map(({ screenshot, ...rest }) => rest);

        const state = {
            step,
            sections: lightweightSections,
            fullPageScreenshot,
            selectedIds,
            generatedComponents,
            activeComponentId
        };

        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            console.warn("Failed to persist generator state to sessionStorage (likely quota exceeded). Continuing without persistence.", err);
        }
    }, [url, step, sections, fullPageScreenshot, selectedIds, generatedComponents, activeComponentId, STORAGE_KEY]);

    const [activeTab, setActiveTab] = useState<'code' | 'chat'>('code');

    // 2. Generate Components
    const handleGenerate = async (ids: string[]) => {
        setSelectedIds(ids);
        setStep('generating');
        setError(null);

        try {
            const promises = ids.map(async (id) => {
                const section = sections.find(s => s.id === id);
                if (!section) return null;

                const res = await fetch('/api/generate', {
                    method: 'POST',
                    body: JSON.stringify({ sectionData: section }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Generation failed");

                // Initialize history with v1
                const component = data.data as GeneratedComponent;
                component.history = [{ timestamp: Date.now(), code: component.code, prompt: 'Initial Generation' }];

                return component;
            });

            const results = (await Promise.all(promises)).filter(c => c !== null) as GeneratedComponent[];

            setGeneratedComponents(results);
            if (results.length > 0) {
                setActiveComponentId(results[0].id);
                setStep('preview');
                addToast("Components generated successfully!", "success");
            } else {
                throw new Error("No components were generated.");
            }
        } catch (e) {
            const msg = (e as Error).message || "Failed to generate components";
            addToast(msg, 'error');
            setError(msg);
            setStep('selecting'); // Go back to selection on error
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

            // Update component and history
            const newCode = data.data.code;
            const newHistoryItem = { timestamp: Date.now(), code: newCode, prompt: instruction };

            setGeneratedComponents(prev => prev.map(c =>
                c.id === activeComponentId ? {
                    ...c,
                    code: newCode,
                    history: [...(c.history || []), newHistoryItem]
                } : c
            ));

            addToast("Component updated!", "success");
        } catch (e) {
            addToast("Refinement failed", "error");
        } finally {
            setIsRefining(false);
        }
    };

    const handleRevert = (code: string) => {
        if (!activeComponentId) return;
        setGeneratedComponents(prev => prev.map(c =>
            c.id === activeComponentId ? { ...c, code } : c
        ));
        addToast("Reverted to previous version", "info");
    };

    // Regenerate active component
    const handleRegenerate = async () => {
        if (!activeComponentId) return;

        const section = sections.find(s => s.id === activeComponentId);
        if (!section) {
            addToast("Section not found", "error");
            return;
        }

        setIsRegenerating(true);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                body: JSON.stringify({ sectionData: section }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const newComponent = data.data as GeneratedComponent;
            const newHistoryItem = { timestamp: Date.now(), code: newComponent.code, prompt: 'Regenerated' };

            setGeneratedComponents(prev => prev.map(c =>
                c.id === activeComponentId ? {
                    ...c,
                    code: newComponent.code,
                    history: [...(c.history || []), newHistoryItem]
                } : c
            ));

            addToast("Component regenerated!", "success");
        } catch (e) {
            addToast("Regeneration failed: " + (e as Error).message, "error");
        } finally {
            setIsRegenerating(false);
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
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
                <p className="text-zinc-500">No URL provided. Go back and enter a URL.</p>
            </div>
        );
    }

    const activeComponent = generatedComponents.find(c => c.id === activeComponentId);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 overflow-hidden max-h-screen flex flex-col" suppressHydrationWarning>
            {/* Header - Compact */}
            <div className="flex items-center justify-between mb-4 shrink-0" suppressHydrationWarning>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    {step === 'selecting' && (
                        <button
                            onClick={() => detectSections(true)}
                            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm"
                            title="Rescan Website"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Rescan
                        </button>
                    )}
                    {step === 'preview' && (
                        <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="flex items-center gap-2 text-zinc-500 hover:text-amber-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Regenerate Component"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                        </button>
                    )}
                </div>

                <h1 className="text-lg font-bold truncate max-w-md opacity-80">{url}</h1>
                <div className="w-20"></div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 min-h-0 flex flex-col relative">

                {/* STATE: DETECTING */}
                {step === 'detecting' && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                        <h2 className="text-xl font-semibold">Scanning page…</h2>
                        <p className="text-zinc-500 text-sm mt-1">Detecting sections and capturing screenshots.</p>
                    </div>
                )}

                {/* STATE: SELECTING */}
                {step === 'selecting' && (
                    <div className="h-full overflow-y-auto">
                        <SectionSelector
                            sections={sections}
                            onGenerate={handleGenerate}
                            isGenerating={false}
                        />
                    </div>
                )}

                {/* STATE: GENERATING */}
                {step === 'generating' && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-6" />
                        <h2 className="text-xl font-semibold mt-6">Generating components…</h2>
                        <p className="text-zinc-500 text-sm mt-1">Writing React and Tailwind.</p>
                    </div>
                )}

                {/* STATE: PREVIEW */}
                {step === 'preview' && activeComponent && (
                    <div className="flex flex-col lg:flex-row gap-4 h-full">

                        {/* LEFT COLUMN: EDITOR & CHAT (Resizable/Toggleable) */}
                        <div
                            className={`flex flex-col gap-0 transition-all duration-300 ease-in-out bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden ${isCodePanelOpen ? 'w-[400px] xl:w-[450px]' : 'w-0 opacity-0 hidden'}`}
                        >
                            {/* Tabs Header */}
                            <div className="flex border-b border-white/5 bg-zinc-900/50">
                                <button
                                    onClick={() => setActiveTab('code')}
                                    // Toggle code view
                                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'code' ? 'border-amber-500 text-white bg-white/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Code
                                </button>
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'border-amber-500 text-white bg-white/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <span>Refine</span>
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-hidden relative">
                                {/* Code Tab */}
                                <div className={`absolute inset-0 ${activeTab === 'code' ? 'block' : 'hidden'}`}>
                                    <div className="h-full flex flex-col">
                                        <div className="p-2 border-b border-white/5 flex justify-end gap-2 bg-zinc-900/30">
                                            <CopyButton text={activeComponent.code} />
                                            <button
                                                onClick={() => generateDownload(activeComponent.name, activeComponent.code)}
                                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <DeployButtons component={activeComponent} />
                                        </div>
                                        <div className="flex-1 overflow-auto">
                                            <CodeDisplay
                                                code={activeComponent.code}
                                                previousCode={
                                                    activeComponent.history && activeComponent.history.length > 1
                                                        ? activeComponent.history[activeComponent.history.length - 2].code
                                                        : undefined
                                                }
                                                editable
                                                onChange={(nextCode) => {
                                                    setGeneratedComponents(prev =>
                                                        prev.map(c =>
                                                            c.id === activeComponent.id
                                                                ? { ...c, code: nextCode }
                                                                : c
                                                        )
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Tab */}
                                <div className={`absolute inset-0 p-4 ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
                                    <ChatInterface
                                        onSendMessage={handleRefine}
                                        isLoading={isRefining}
                                        history={activeComponent.history}
                                        onRevert={handleRevert}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PREVIEW (Flex-1) */}
                        <div className="flex-1 flex flex-col gap-4 min-w-0 h-full">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between shrink-0 bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsCodePanelOpen(!isCodePanelOpen)}
                                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                                        title={isCodePanelOpen ? "Close Sidebar" : "Open Sidebar"}
                                    >
                                        {isCodePanelOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                                    </button>

                                    <div className="h-4 w-[1px] bg-zinc-700 mx-2"></div>

                                    {/* Component Tabs */}
                                    <div className="flex gap-1 overflow-x-auto scrollbar-hide max-w-[400px]">
                                        {generatedComponents.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    setActiveComponentId(c.id);
                                                    setPreviewMode('generated');
                                                }}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeComponentId === c.id
                                                    ? 'bg-zinc-800 text-white shadow-sm'
                                                    : 'text-zinc-500 hover:text-zinc-300'
                                                    }`}
                                            >
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* View Mode Toggle */}
                                <div className="flex bg-zinc-950 rounded-md p-1 border border-white/5">
                                    <button
                                        onClick={() => setPreviewMode('generated')}
                                        className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all ${previewMode === 'generated'
                                            ? 'bg-zinc-800 text-white'
                                            : 'text-zinc-500 hover:text-white'
                                            }`}
                                    >
                                        Live Preview
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode('original')}
                                        className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all ${previewMode === 'original'
                                            ? 'bg-zinc-800 text-white'
                                            : 'text-zinc-500 hover:text-white'
                                            }`}
                                    >
                                        Original
                                    </button>
                                </div>
                            </div>

                            {/* Main Preview Frame */}
                            <div className="flex-1 border border-white/10 rounded-xl overflow-hidden bg-zinc-950 shadow-2xl relative min-h-0">
                                {previewMode === 'generated' ? (
                                    <div className="w-full h-full iframe-container">
                                        <LivePreview code={activeComponent.code} />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center p-8 bg-black overflow-hidden">
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
                        </div>
                    </div>
                )}
            </div>

            {/* Error Display Modal */}
            {error && (
                <ScrapeErrorModal
                    error={error}
                    onRetry={() => {
                        setError(null);
                        if (step === 'detecting') detectSections(true);
                        else if (step === 'generating') handleGenerate(selectedIds);
                        else detectSections(true);
                    }}
                    onBack={() => window.location.href = '/'}
                />
            )}
        </div>
    );
}

export default function GeneratePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading...</div>}>
            <GeneratePageContent />
        </Suspense>
    );
}
