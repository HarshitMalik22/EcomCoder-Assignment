"use client";

import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackCodeEditor } from "@codesandbox/sandpack-react";
import { atomDark } from "@codesandbox/sandpack-themes";
import { useState } from "react";
import ViewportToggle from "./ViewportToggle";
import { Loader2 } from "lucide-react";

interface LivePreviewProps {
    code: string;
    showEditor?: boolean;
}

export default function LivePreview({ code, showEditor = false }: LivePreviewProps) {
    const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    const containerWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px',
    };

    // Basic HTML template with Tailwind CDN
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      /* Fix for font loading if needed */
      body { -webkit-font-smoothing: antialiased; }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Live Preview</h3>
                <ViewportToggle mode={viewport} onChange={setViewport} />
            </div>

            <div className="w-full border border-white/10 rounded-xl overflow-hidden bg-zinc-950 relative shadow-2xl">
                <LivePreviewErrorBoundary>
                    <SandpackProvider
                        template="react-ts"
                        theme={atomDark}
                        files={{
                            "App.tsx": code,
                            "public/index.html": indexHtml,
                        }}
                        customSetup={{
                            dependencies: {
                                "lucide-react": "latest",
                                "clsx": "latest",
                                "tailwind-merge": "latest",
                            },
                        }}
                        options={{
                            externalResources: ["https://cdn.tailwindcss.com"],
                            classes: {
                                "sp-layout": "!block !bg-zinc-950 !border-none !h-full",
                                "sp-wrapper": "!h-full",
                            }
                        }}
                    >
                        <SandpackLayout>
                            <div className="flex justify-center bg-zinc-900/50 p-8 transition-all duration-300 h-full min-h-[600px] overflow-auto">
                                <div
                                    className="transition-all duration-500 ease-in-out relative origin-top border border-white/5 shadow-2xl bg-white"
                                    style={{
                                        width: containerWidths[viewport],
                                        height: 'max-content',
                                        minHeight: '100%'
                                    }}
                                >
                                    <SandpackPreview
                                        showNavigator={false}
                                        showOpenInCodeSandbox={false}
                                        className="!h-full min-h-[600px] w-full"
                                        showRefreshButton={true}
                                    />
                                </div>
                            </div>
                            {showEditor && (
                                <div className="border-t border-white/10">
                                    <SandpackCodeEditor className="!h-[400px]" />
                                </div>
                            )}
                        </SandpackLayout>
                    </SandpackProvider>
                </LivePreviewErrorBoundary>
            </div>
        </div>
    );
}

class LivePreviewErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("LivePreview Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-[600px] bg-zinc-950 text-red-400 p-8 text-center">
                    <div className="bg-red-500/10 p-4 rounded-full mb-4">
                        <Loader2 className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Preview Crashed</h3>
                    <p className="text-zinc-500 mb-4 max-w-md">
                        The generated code has a runtime error. This usually happens when the AI uses a library or component that isn't available in the sandbox.
                    </p>
                    <div className="bg-zinc-900 p-4 rounded-lg text-left overflow-auto max-w-full w-full max-h-[200px] font-mono text-xs border border-white/5">
                        {this.state.error?.toString()}
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

import React from 'react';
