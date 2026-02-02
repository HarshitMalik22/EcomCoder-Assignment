
import React, { useEffect, useState } from 'react';
import { LocalComponentStorage, SavedComponent } from '@/lib/storage/local-storage';
import { Trash2, Edit, Calendar } from 'lucide-react';

interface SavedComponentsProps {
    onSelect: (component: SavedComponent) => void;
    className?: string;
}

export const SavedComponents: React.FC<SavedComponentsProps> = ({ onSelect, className = '' }) => {
    const [components, setComponents] = useState<SavedComponent[]>([]);

    useEffect(() => {
        setComponents(LocalComponentStorage.getAllComponents());
    }, []);

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this component?')) {
            LocalComponentStorage.deleteComponent(id);
            setComponents(LocalComponentStorage.getAllComponents());
        }
    };

    if (components.length === 0) {
        return (
            <div className={`p-8 text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg ${className}`}>
                <p>No saved components found.</p>
                <p className="text-sm mt-2">Generate and save components to see them here.</p>
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
            {components.map((comp) => (
                <div
                    key={comp.id}
                    onClick={() => onSelect(comp)}
                    className="group relative bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-medium truncate pr-8">{comp.name}</h3>
                        <button
                            onClick={(e) => handleDelete(e, comp.id)}
                            className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="text-xs text-zinc-500 flex items-center gap-2 mt-4">
                        <Calendar className="w-3 h-3" />
                        {new Date(comp.createdAt).toLocaleDateString()}
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            ))}
        </div>
    );
};
