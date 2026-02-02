export type SectionType =
    | 'hero'
    | 'header'
    | 'footer'
    | 'features'
    | 'pricing'
    | 'testimonials'
    | 'faq'
    | 'contact'
    | 'unknown';

export interface SectionImagePlaceholder {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
}

export interface SectionMetadata {
    id: string;
    type: SectionType;
    confidence: number;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    screenshot?: string; // Base64 of just this section
    html?: string;
    text?: string;
    /** Image placeholders from the section DOM for generated component placeholders */
    images?: SectionImagePlaceholder[];
}
