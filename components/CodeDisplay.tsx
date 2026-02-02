"use client";

import { SandpackProvider, SandpackLayout, SandpackCodeEditor } from "@codesandbox/sandpack-react";
import { atomDark } from "@codesandbox/sandpack-themes";

interface CodeDisplayProps {
    code: string;
}

export default function CodeDisplay({ code }: CodeDisplayProps) {
    return (
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg h-full flex flex-col">
            <SandpackProvider
                template="react-ts"
                theme={atomDark}
                files={{
                    "App.tsx": {
                        code,
                        active: true
                    }
                }}
                options={{
                    classes: {
                        "sp-layout": "!bg-zinc-950 !border-none !h-full",
                        "sp-editor": "!h-auto !min-h-full"
                    }
                }}
            >
                <SandpackLayout className="!h-full !block">
                    <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pb-10">
                        <SandpackCodeEditor
                            showLineNumbers
                            showInlineErrors
                            readOnly
                            wrapContent
                            className="!font-mono !text-sm !h-auto"
                        />
                    </div>
                </SandpackLayout>
            </SandpackProvider>
        </div>
    );
}
