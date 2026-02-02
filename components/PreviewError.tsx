
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface PreviewErrorProps {
    message: string;
    details?: string;
    onDismiss?: () => void;
}

export const PreviewError: React.FC<PreviewErrorProps> = ({ message, details, onDismiss }) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4">
            <div className="bg-zinc-900 border border-red-500/50 rounded-lg shadow-2xl max-w-md w-full p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-red-500/10 p-3 rounded-full">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">Preview Error</h3>
                <p className="text-zinc-400 mb-4">{message}</p>

                {details && (
                    <div className="bg-zinc-950 rounded p-3 text-left overflow-auto max-h-40 mb-4">
                        <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                            {details}
                        </pre>
                    </div>
                )}

                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                        Dismiss
                    </button>
                )}
            </div>
        </div>
    );
};
