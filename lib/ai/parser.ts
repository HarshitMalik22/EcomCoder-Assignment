export function parseGeneratedCode(response: string): string {
    let code = response.trim();

    // Extract strictly between first ``` and last ``` if present
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

    return code.trim();
}
