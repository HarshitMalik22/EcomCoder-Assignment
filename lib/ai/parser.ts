export function parseGeneratedCode(response: string): string {
    let code = response.trim();

    // 1. Try to match valid markdown blocks with language specifiers
    const fencedMatch = code.match(/```(?:tsx|typescript|jsx|javascript|react)?\s*([\s\S]*?)```/i);
    if (fencedMatch) {
        return fencedMatch[1].trim();
    }

    // 2. Try to match generic markdown blocks without language specifiers
    const genericMatch = code.match(/```([\s\S]*?)```/);
    if (genericMatch) {
        return genericMatch[1].trim();
    }

    // 3. Fallback: If the code starts with ``` but wasn't caught (e.g. unclosed), strip it
    if (code.startsWith('```')) {
        return code.replace(/^```(?:tsx|typescript|jsx|javascript|react)?\s*/i, '').replace(/```$/, '').trim();
    }

    // 4. Last Resort Heuristic: Look for code start patterns if the string contains conversational text
    // If it starts with "Here is...", try to find the first "import" or "export"
    const codeStartRegex = /^(import|export|const|function|class)\s/m;
    const match = code.match(codeStartRegex);
    if (match && match.index !== undefined && match.index > 0) {
        // We found a code start pattern later in the string
        console.warn('Parser found conversational text before code, trimming...');
        return code.substring(match.index).trim();
    }

    return code.trim();
}
