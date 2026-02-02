import { chromium, Browser, Page } from 'playwright';
import { ScrapedPageResult, ScrapeOptions } from '@/types/scraper';

/**
 * Limitations:
 * - Does not handle pages requiring authentication (login).
 * - CAPTCHA protected sites may block the request.
 * - Extremely heavy JS sites might timeout.
 * - content-visibility: auto might hide sections.
 */
export class PlaywrightScraper {
    private browser: Browser | null = null;

    async init() {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'], // Safe for containers
            });
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async scrape(url: string, options: ScrapeOptions = { url }): Promise<ScrapedPageResult> {
        if (!this.browser) await this.init();

        const context = await this.browser!.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });

        const page = await context.newPage();

        try {
            // Navigate with timeout
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

            const title = await page.title();

            // Clean up scripts to reduce noise
            await page.evaluate(() => {
                document.querySelectorAll('script, iframe, noscript').forEach(el => el.remove());
            });

            const html = await page.content();

            let fullPageScreenshot: string | undefined;
            if (options.includeScreenshots) {
                const buffer = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 80 });
                fullPageScreenshot = buffer.toString('base64');
            }

            return {
                url,
                title,
                html,
                fullPageScreenshot,
            };

        } catch (error) {
            console.error("Scraping failed:", error);
            throw new Error(`Failed to scrape ${url}: ${(error as Error).message}`);
        } finally {
            await page.close();
            await context.close();
        }
    }
}

export const playwrightScraper = new PlaywrightScraper();
