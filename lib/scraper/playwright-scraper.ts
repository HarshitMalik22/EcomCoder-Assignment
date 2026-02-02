import { chromium, Browser, Page } from 'playwright';
import { ScrapedSection, ScrapedPageResult, ScrapeOptions } from '@/types/scraper';

export class PlaywrightScraper {
    private browser: Browser | null = null;

    async scrape(url: string, options: ScrapeOptions = { url }): Promise<ScrapedPageResult> {
        this.browser = await chromium.launch({ headless: true });
        const page = await this.browser.newPage();

        try {
            await page.setViewportSize({ width: 1440, height: 900 });
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
            await page.waitForLoadState('domcontentloaded');

            const title = await page.title();

            let fullPageScreenshot: string | undefined;
            if (options.includeScreenshots) {
                const buffer = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 50 });
                fullPageScreenshot = buffer.toString('base64');
            }

            // Client-side identification phase
            const rawSections = await page.evaluate(() => {
                const getSelector = (el: Element): string => {
                    if (el.id) return `#${el.id}`;
                    if (el.className && typeof el.className === 'string' && el.className.trim().length > 0) {
                        return '.' + el.className.trim().split(' ').join('.');
                    }
                    return el.tagName.toLowerCase();
                };

                const cleanHtml = (element: Element) => {
                    const clone = element.cloneNode(true) as Element;
                    const removables = clone.querySelectorAll('script, style, iframe, noscript, svg');
                    removables.forEach(el => el.remove());
                    // Remove internal attributes
                    const allElements = clone.querySelectorAll('*');
                    allElements.forEach(el => {
                        Array.from(el.attributes).forEach(attr => {
                            if (attr.name.startsWith('on') || attr.name.startsWith('data-')) {
                                el.removeAttribute(attr.name);
                            }
                        });
                    });
                    return clone.outerHTML;
                };

                const selectors = [
                    'section', 'header', 'footer', 'nav', 'main', 'aside',
                    '[role="banner"]', '[role="main"]', '[role="contentinfo"]', '[role="complementary"]',
                    'main > *', 'body > div', '.section', '.hero', '.container', '.content-block'
                ];

                const candidates = Array.from(document.querySelectorAll(selectors.join(', ')));
                const uniqueCandidates = new Set(candidates);
                const results: any[] = [];
                let counter = 0;

                for (const el of uniqueCandidates) {
                    if (!(el instanceof HTMLElement)) continue;

                    const rect = el.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(el);

                    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || rect.height < 50 || rect.width < 100) {
                        continue;
                    }

                    if (el.tagName === 'DIV' && rect.height > document.documentElement.scrollHeight * 0.95) {
                        continue;
                    }

                    // Assign ID for screenshotting later
                    const uniqueId = `scraped-section-${counter++}`;
                    el.setAttribute('data-scraped-id', uniqueId);

                    results.push({
                        id: uniqueId, // Use this ID for matching
                        tagName: el.tagName.toLowerCase(),
                        selector: getSelector(el),
                        html: cleanHtml(el),
                        text: el.innerText || '',
                        boundingBox: {
                            x: rect.x,
                            y: rect.y + window.scrollY,
                            width: rect.width,
                            height: rect.height
                        }
                    });
                }
                return results;
            });

            // Post-processing in Node context: Capture screenshots
            const processedSections: ScrapedSection[] = [];
            for (const section of rawSections) {
                let screenshotBase64: string | undefined;

                if (options.includeScreenshots) {
                    try {
                        const locator = page.locator(`[data-scraped-id="${section.id}"]`);
                        if (await locator.count() > 0) {
                            // Take screenshot of the specific element
                            const buffer = await locator.first().screenshot({ type: 'jpeg', quality: 60, timeout: 5000 });
                            screenshotBase64 = buffer.toString('base64');
                        }
                    } catch (e) {
                        console.warn(`Failed to capture screenshot for section ${section.id}:`, e);
                    }
                }

                processedSections.push({
                    ...section,
                    screenshot: screenshotBase64
                });
            }

            return {
                url,
                title,
                fullPageScreenshot,
                html: await page.content(),
                sections: processedSections
            };

        } catch (error) {
            console.error('Playwright Scrape Error:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

export const playwrightScraper = new PlaywrightScraper();

export const scrapeUrl = async (url: string) => {
    return playwrightScraper.scrape(url, { url, includeScreenshots: true });
};