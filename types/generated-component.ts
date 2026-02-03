export interface GeneratedComponent {
    id: string;
    code: string;
    name: string;
    description?: string;
    installCommand?: string; // dependencies
    previewHeight?: string;
    history?: { timestamp: number; code: string; prompt?: string }[];
}

export interface SectionImagePlaceholder {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
}

export interface GenerationRequest {
    // model?: 'claude' | 'openai' | 'gemini'; // Deprecated: Always uses Gemini

    sectionData: {
        id: string;
        type: string;
        screenshot?: string;
        html?: string;
        images?: SectionImagePlaceholder[];
    };
    customPrompt?: string; // from chat iteration
}
