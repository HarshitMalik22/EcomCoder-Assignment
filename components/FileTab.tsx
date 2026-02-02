
import React from 'react';

interface FileTabProps {
    files: { name: string; content: string }[];
    activeFileIndex: number;
    onSelectFile: (index: number) => void;
    className?: string;
}

export const FileTab: React.FC<FileTabProps> = ({ files, activeFileIndex, onSelectFile, className = '' }) => {
    return (
        <div className={`flex border-b border-gray-200 overflow-x-auto ${className}`}>
            {files.map((file, index) => {
                const isActive = index === activeFileIndex;
                return (
                    <button
                        key={file.name}
                        onClick={() => onSelectFile(index)}
                        className={`
                            px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                            ${isActive
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        {file.name}
                    </button>
                );
            })}
        </div>
    );
};
