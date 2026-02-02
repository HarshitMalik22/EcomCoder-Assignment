
import { ScrapedPageResult, ScrapedSection } from '@/types/scraper';
import { logger } from '@/lib/logger';

export class FallbackHandler {
    static async handleFailure(url: string, error: Error): Promise<ScrapedPageResult> {
        logger.error(`Scraping failed for ${url}, attempting fallback...`, error);

        // In a real implementation, we might try a different scraper (e.g. ZenRows, generic heuristic)
        // or just return a basic failure object.

        return {
            url,
            title: 'Scraping Failed',
            html: `<!-- Transformation failed: ${error.message} -->`,
            sections: [
                {
                    id: 'error-fallback',
                    selector: 'body',
                    tagName: 'BODY',
                    html: `<div class="error">Could not scrape content. Please try manual input.</div>`,
                    text: 'Could not scrape content.',
                    boundingBox: { x: 0, y: 0, width: 0, height: 0 }
                }
            ]
        };
    }

    static createErrorSection(message: string): ScrapedSection {
        return {
            id: 'generated-error',
            selector: 'error',
            tagName: 'DIV',
            html: `<div class="error-message">${message}</div>`,
            text: message,
            boundingBox: { x: 0, y: 0, width: 0, height: 0 }
        };
    }
}
