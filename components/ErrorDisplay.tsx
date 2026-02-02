
import React from 'react';
import { AppError } from '@/lib/errors/error-handler';

interface ErrorDisplayProps {
    error: Error | AppError | string | null;
    onRetry?: () => void;
    className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, className = '' }) => {
    if (!error) return null;

    const message = typeof error === 'string' ? error : error.message;
    const title = error instanceof AppError ? formatErrorTitle(error.code) : 'An error occurred';

    return (
        <div className={`p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 ${className}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">{title}</h3>
                    <div className="mt-1 text-sm text-red-700">
                        {message}
                    </div>

                    {onRetry && (
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={onRetry}
                                className="text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

function formatErrorTitle(code: string): string {
    return code
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}
