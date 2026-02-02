
export function transformCode(code: string): string {
    let cleanCode = code;

    // 1. Remove Markdown code blocks if present
    const markdownRegex = /```(?:tsx|ts|jsx|js|react)?\n([\s\S]*?)```/;
    const match = code.match(markdownRegex);
    if (match) {
        cleanCode = match[1];
    }

    // 2. Remove "use client" if present (Sandpack handles this, but good to clean)
    cleanCode = cleanCode.replace(/"use client";|'use client';/g, '');

    // 3. Ensure React is imported if missing (though Sandpack template might handle it, explicitly adding safe)
    if (!cleanCode.includes("import React") && !cleanCode.includes("import * as React")) {
        cleanCode = `import React from 'react';\n${cleanCode}`;
    }

    // 4. Ensure Lucide icons are imported correctly if used
    // This is a heuristic. If we see <IconName />, we might want to check imports.
    // For now, we assume the AI generates correct imports.

    return cleanCode.trim();
}

export function extractComponentMetadata(code: string) {
    // Basic regex analysis to find component name, props, etc.
    const componentNameMatch = code.match(/export (?:default )?(?:function|const|class) (\w+)/);
    const componentName = componentNameMatch ? componentNameMatch[1] : 'App';

    return {
        componentName,
        isDefaultExport: code.includes('export default'),
    };
}
