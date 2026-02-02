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
}
