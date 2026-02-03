/**
 * Sanitizes the generated code by removing forbidden imports and transforming
 * Next.js-specific components to vanilla React equivalents.
 */
function sanitizeCode(code: string): string {
    let sanitized = code;

    // Remove Next.js image import and transform Image to img
    sanitized = sanitized.replace(/import\s+Image\s+from\s+['"]next\/image['"];?\s*\n?/g, '');
    sanitized = sanitized.replace(/import\s+{\s*Image\s*}\s+from\s+['"]next\/image['"];?\s*\n?/g, '');

    // Remove Next.js link import and transform Link to a
    sanitized = sanitized.replace(/import\s+Link\s+from\s+['"]next\/link['"];?\s*\n?/g, '');
    sanitized = sanitized.replace(/import\s+{\s*Link\s*}\s+from\s+['"]next\/link['"];?\s*\n?/g, '');

    // Remove any next/* imports
    sanitized = sanitized.replace(/import\s+.*\s+from\s+['"]next\/[^'"]+['"];?\s*\n?/g, '');

    // Remove @/* path alias imports (they won't work in sandbox)
    sanitized = sanitized.replace(/import\s+.*\s+from\s+['"]@\/[^'"]+['"];?\s*\n?/g, '');

    // Transform <Image ... /> to <img ... />
    // Handle self-closing Image tags
    sanitized = sanitized.replace(/<Image\s+([^>]*?)\/>/g, (match, attrs) => {
        // Convert Next.js Image props to standard img props
        let imgAttrs = attrs
            .replace(/\bfill\b/g, '') // Remove 'fill' prop
            .replace(/\bpriority\b/g, '') // Remove 'priority' prop
            .replace(/\bplaceholder=["'][^"']*["']/g, '') // Remove placeholder prop
            .replace(/\bblurDataURL=["'][^"']*["']/g, '') // Remove blurDataURL prop
            .replace(/\bunoptimized\b/g, '') // Remove unoptimized prop
            .replace(/\bloader={[^}]*}/g, '') // Remove loader prop
            .replace(/\bsizes=["'][^"']*["']/g, '') // Remove sizes prop
            .replace(/\bquality={[^}]*}/g, '') // Remove quality prop
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        return `<img ${imgAttrs} />`;
    });

    // Handle Image tags with children (shouldn't happen but just in case)
    sanitized = sanitized.replace(/<Image\s+([^>]*)>([\s\S]*?)<\/Image>/g, (match, attrs, children) => {
        let imgAttrs = attrs
            .replace(/\bfill\b/g, '')
            .replace(/\bpriority\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        return `<img ${imgAttrs} />`;
    });

    // Transform <Link href="...">...</Link> to <a href="...">...</a>
    sanitized = sanitized.replace(/<Link\s+([^>]*)>/g, '<a $1>');
    sanitized = sanitized.replace(/<\/Link>/g, '</a>');

    // Remove any require() statements
    sanitized = sanitized.replace(/(?:const|let|var)\s+\w+\s*=\s*require\([^)]+\);?\s*\n?/g, '');

    // Ensure React is imported (some AIs forget this)
    if (!sanitized.includes("import React") && !sanitized.includes("from 'react'")) {
        sanitized = "import React from 'react';\n" + sanitized;
    }

    // Clean up any double newlines created by removed imports
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

    return sanitized;
}

/**
 * Extracts lucide-react icon names from import statements
 */
function extractLucideImports(code: string): Set<string> {
    const lucideImports = new Set<string>();
    const lucideImportMatch = code.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
    if (lucideImportMatch) {
        const icons = lucideImportMatch[1].split(',').map(s => s.trim());
        icons.forEach(icon => lucideImports.add(icon));
    }
    return lucideImports;
}

/**
 * Ensures a specific lucide-react icon is imported and removes any invalid
 * generic Icon imports that lucide-react does not actually export.
 */
function ensureLucideImport(code: string, iconName: string): string {
    let updated = code;

    const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/;
    const lucideMatch = updated.match(lucideImportRegex);

    if (lucideMatch) {
        const rawNames = lucideMatch[1]
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        // Remove any generic Icon import which would fail at runtime
        const namesWithoutIcon = rawNames.filter(name => name !== 'Icon');

        if (namesWithoutIcon.length > 0) {
            // Ensure our replacement icon is included
            if (!namesWithoutIcon.includes(iconName)) {
                namesWithoutIcon.push(iconName);
            }
            updated = updated.replace(
                lucideImportRegex,
                `import { ${namesWithoutIcon.join(', ')} } from 'lucide-react';`
            );
            return updated;
        } else {
            // Icon was the only import – remove the line entirely
            updated = updated.replace(lucideImportRegex, '');
        }
    }

    // No (valid) lucide-react named import left – add a fresh one
    const reactImportRegex = /import\s+React\s+from\s+['"]react['"];?\s*/;
    if (reactImportRegex.test(updated)) {
        updated = updated.replace(
            reactImportRegex,
            (match) => `${match}\nimport { ${iconName} } from 'lucide-react';\n`
        );
    } else {
        updated = `import { ${iconName} } from 'lucide-react';\n` + updated;
    }

    return updated;
}

/**
 * Normalizes generic <Icon /> usages to a concrete lucide-react icon so they
 * won't cause undefined component errors at runtime.
 */
function normalizeGenericIcons(code: string): string {
    let normalized = code;

    if (!/<Icon(\s|>|\/)/.test(normalized)) {
        return normalized;
    }

    const replacementIcon = 'Star';

    // Replace Icon tags with the concrete icon component
    normalized = normalized.replace(
        /<Icon(\s+[^>]*)>([\s\S]*?)<\/Icon>/g,
        `<${replacementIcon}$1>$2</${replacementIcon}>`
    );
    normalized = normalized.replace(
        /<Icon(\s+[^>]*)\/>/g,
        `<${replacementIcon}$1 />`
    );
    normalized = normalized.replace(
        /<Icon\s*>/g,
        `<${replacementIcon}>`
    );
    normalized = normalized.replace(
        /<\/Icon>/g,
        `</${replacementIcon}>`
    );

    // Ensure we have the corresponding lucide-react import
    normalized = ensureLucideImport(normalized, replacementIcon);

    return normalized;
}


/**
 * Detects undefined custom components in the JSX
 */
function detectUndefinedComponents(code: string): string[] {
    const undefinedComponents: string[] = [];

    // Extract lucide-react imports
    const lucideImports = extractLucideImports(code);

    // Standard HTML elements (lowercase) are fine
    // React fragments and built-ins are fine
    const builtInComponents = new Set(['Fragment', 'Suspense', 'StrictMode', 'Profiler']);

    // Find all PascalCase JSX tags
    const jsxTagRegex = /<([A-Z][a-zA-Z0-9]*)(?:\s|>|\/)/g;
    let match;

    // Get the function body to check for locally defined components
    const functionBodyMatch = code.match(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{([\s\S]*)\}/);
    // Also check for standard function definitions or const exports
    const allContent = code;

    // Find locally defined components (const ComponentName = ...)
    const localComponentRegex = /(?:const|let|var|function)\s+([A-Z][a-zA-Z0-9]*)\s*(?:=|:|\()/g;
    const localComponents = new Set<string>();
    let localMatch;
    while ((localMatch = localComponentRegex.exec(allContent)) !== null) {
        localComponents.add(localMatch[1]);
    }

    // Also check for the main exported function name
    const mainFunctionMatch = code.match(/export\s+default\s+function\s+([A-Z][a-zA-Z0-9]*)/);
    if (mainFunctionMatch) {
        localComponents.add(mainFunctionMatch[1]);
    }

    // Reset regex index
    jsxTagRegex.lastIndex = 0;

    while ((match = jsxTagRegex.exec(code)) !== null) {
        const componentName = match[1];

        // Skip if it's a built-in, lucide icon, or locally defined
        if (builtInComponents.has(componentName) ||
            lucideImports.has(componentName) ||
            localComponents.has(componentName)) {
            continue;
        }

        // This component is undefined
        if (!undefinedComponents.includes(componentName)) {
            undefinedComponents.push(componentName);
        }
    }

    return undefinedComponents;
}


/**
 * Validates the generated code for common issues that would break the preview.
 * Returns an object with isValid flag and any error messages.
 */
function validateCode(code: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for remaining forbidden imports
    if (/from\s+['"]next\//.test(code)) {
        errors.push('Code contains Next.js imports which are not available in the preview sandbox');
    }

    if (/from\s+['"]@\//.test(code)) {
        errors.push('Code contains path alias imports (@/) which are not available in the preview sandbox');
    }

    // Check for export default
    if (!code.includes('export default')) {
        errors.push('Code must have an export default function/component');
    }

    // Check for JSX
    if (!/<\w+/.test(code)) {
        errors.push('Code does not appear to contain any JSX elements');
    }

    // Check for undefined custom components
    const undefinedComponents = detectUndefinedComponents(code);
    if (undefinedComponents.length > 0) {
        warnings.push(`Code uses undefined components: ${undefinedComponents.join(', ')}. These have been auto-stubbed to prevent crashes.`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Automatically adds dummy definitions for undefined components to prevent runtime errors.
 */
function stubUndefinedComponents(code: string): string {
    const undefinedComponents = detectUndefinedComponents(code);

    if (undefinedComponents.length === 0) return code;

    let stubbedCode = code;
    const stubs = undefinedComponents.map(name => {
        return `const ${name} = ({ children, ...props }: any) => (
  <div {...props} className="p-4 border border-dashed border-red-400 rounded bg-red-50/10 text-red-400 text-xs">
    Running stub for: <strong>${name}</strong> (AI failed to define this)
    {children}
  </div>
);`;
    }).join('\n\n');

    // Insert stubs before the last closing brace or at the end of imports
    // Best place is usually before the export default, or at the top after imports.
    // Let's place them after imports.

    const lastImportIndex = stubbedCode.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
        const endOfImports = stubbedCode.indexOf('\n', lastImportIndex);
        stubbedCode = stubbedCode.slice(0, endOfImports + 1) + '\n// Auto-generated stubs for missing components\n' + stubs + '\n' + stubbedCode.slice(endOfImports + 1);
    } else {
        stubbedCode = stubs + '\n\n' + stubbedCode;
    }

    return stubbedCode;
}

export function parseGeneratedCode(response: string): string {
    let code = response.trim();

    // 1. Try to match valid markdown blocks with language specifiers
    const fencedMatch = code.match(/```(?:tsx|typescript|jsx|javascript|react)?\s*([\s\S]*?)```/i);
    if (fencedMatch) {
        code = fencedMatch[1].trim();
    } else {
        // 2. Try to match generic markdown blocks without language specifiers
        const genericMatch = code.match(/```([\s\S]*?)```/);
        if (genericMatch) {
            code = genericMatch[1].trim();
        } else if (code.startsWith('```')) {
            // 3. Fallback: If the code starts with ``` but wasn't caught (e.g. unclosed), strip it
            code = code.replace(/^```(?:tsx|typescript|jsx|javascript|react)?\s*/i, '').replace(/```$/, '').trim();
        } else {
            // 4. Last Resort Heuristic: Look for code start patterns if the string contains conversational text
            const codeStartRegex = /^(import|export|const|function|class)\s/m;
            const match = code.match(codeStartRegex);
            if (match && match.index !== undefined && match.index > 0) {
                console.warn('Parser found conversational text before code, trimming...');
                code = code.substring(match.index).trim();
            }
        }
    }

    // Sanitize the code to remove forbidden imports and fix common issues
    code = sanitizeCode(code);

    // Normalize common generic icon patterns (e.g., <Icon />) to concrete lucide icons
    code = normalizeGenericIcons(code);

    // Auto-stub undefined components (CRITICAL FIX for "Element type is invalid")
    code = stubUndefinedComponents(code);

    // Validate the code
    const validation = validateCode(code);
    if (!validation.isValid) {
        console.warn('Code validation errors:', validation.errors);
        // We could throw here, but let's try to return what we have so the user sees the error in the editor
    }
    if (validation.warnings.length > 0) {
        console.warn('Code validation warnings:', validation.warnings);
    }

    return code.trim();
}


