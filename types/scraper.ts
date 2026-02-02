export interface SectionImagePlaceholder {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
}

export interface ScrapedSection {
    id: string;
    selector: string;
    html: string;
    text: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    screenshot?: string; // Base64 or URL
    tagName: string;
    /** Image placeholders extracted from the section DOM for use in generated components */
    images?: SectionImagePlaceholder[];
}

export interface ScrapedPageResult {
    url: string;
    title: string;
    fullPageScreenshot?: string;
    html: string; // Full HTML if needed
    sections?: ScrapedSection[];
}

export interface ScrapeOptions {
    url: string;
    waitForSelector?: string;
    includeScreenshots?: boolean;
}
