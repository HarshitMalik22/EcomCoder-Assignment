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
