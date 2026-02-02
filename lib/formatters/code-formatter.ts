import prettier from 'prettier';

export async function formatCode(code: string): Promise<string> {
    try {
        const formatted = await prettier.format(code, {
            parser: 'typescript',
            semi: true,
            singleQuote: true,
            trailingComma: 'all',
            printWidth: 100,
            tabWidth: 2,
        });
        return formatted;
    } catch (error) {
        console.warn("Prettier failed to format code, returning original:", error);
        return code; // Fallback
    }
}
