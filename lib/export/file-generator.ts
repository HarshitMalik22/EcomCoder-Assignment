
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { formatCode } from '@/lib/formatters/code-formatter';

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

export async function generateZip(files: { name: string; content: string }[], zipName: string = 'components') {
    const zip = new JSZip();

    for (const file of files) {
        // Try to format
        try {
            const formatted = await formatCode(file.content);
            zip.file(file.name, formatted);
        } catch (e) {
            zip.file(file.name, file.content);
        }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${zipName}.zip`);
}
