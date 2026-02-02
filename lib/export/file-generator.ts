export function generateDownload(filename: string, content: string) {
    if (typeof window === 'undefined') return;

    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.tsx') ? filename : `${filename}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function copyToClipboard(content: string): Promise<void> {
    if (typeof navigator !== 'undefined') {
        return navigator.clipboard.writeText(content);
    }
    return Promise.reject("Clipboard API unavailable");
}
