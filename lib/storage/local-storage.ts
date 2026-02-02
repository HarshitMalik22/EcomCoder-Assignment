
export interface SavedComponent {
    id: string;
    name: string;
    code: string;
    createdAt: number;
    version: number;
}

const STORAGE_KEY = 'ecomcoder_saved_components';

export class LocalComponentStorage {
    static saveComponent(component: SavedComponent) {
        if (typeof window === 'undefined') return;

        const existing = this.getAllComponents();
        const updated = [component, ...existing.filter(c => c.id !== component.id)];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    static getAllComponents(): SavedComponent[] {
        if (typeof window === 'undefined') return [];

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load saved components', e);
            return [];
        }
    }

    static getComponent(id: string): SavedComponent | undefined {
        const all = this.getAllComponents();
        return all.find(c => c.id === id);
    }

    static deleteComponent(id: string) {
        if (typeof window === 'undefined') return;

        const existing = this.getAllComponents();
        const updated = existing.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
}
