import * as cheerio from 'cheerio';
import { ScrapedPageResult } from '@/types/scraper';

export class CheerioScraper {
    async scrape(url: string): Promise<ScrapedPageResult> {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; LevelUpBot/1.0)',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            // Cleanup
            $('script').remove();
            $('iframe').remove();
            $('style').remove(); // Maybe keep style if needed, but usually noise for static analysis

            const title = $('title').text() || 'No title';

            return {
                url,
                title,
                html: $.html(),
            };
        } catch (error) {
            console.error("Cheerio scraping failed:", error);
            throw error;
        }
    }
}

export const cheerioScraper = new CheerioScraper();
