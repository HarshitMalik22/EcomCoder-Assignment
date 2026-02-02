// Change the import from 'playwright' to 'playwright-extra'
import { chromium } from 'playwright-extra';
import { Browser, Page } from 'playwright';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ScrapedSection, ScrapedPageResult, ScrapeOptions } from '@/types/scraper';

// Enable the Stealth Plugin
chromium.use(stealthPlugin());

export class PlaywrightScraper {
    private browser: Browser | null = null;

    async scrape(url: string, options: ScrapeOptions = { url }): Promise<ScrapedPageResult> {
        this.browser = await chromium.launch({
            headless: true, // Stealth plugin makes headless look like headful
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
            ]
        });

        // standard Playwright context creation
        const context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US',
            timezoneId: 'America/New_York',
            // permissions: ['geolocation'], // Granting permissions sometimes looks more human
        });

        const page = await context.newPage();

        try {
            // Note: We REMOVED the manual 'navigator.webdriver' override because 
            // the stealth plugin handles this much more comprehensively.

            // Add comprehensive headers
            await page.setExtraHTTPHeaders({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.google.com/',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            });

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // --- EVASION: HUMAN BEHAVIOR SIMULATION ---
            // 1. Move mouse randomly to trigger "human" event listeners
            await this.simulateHumanMouseMovements(page);

            // 2. Random small scroll to trigger lazy loading and interaction observers
            await page.mouse.wheel(0, 500);
            await page.waitForTimeout(1000 + Math.random() * 2000); // Random wait
            // ------------------------------------------

            try {
                await page.waitForLoadState('load', { timeout: 10000 });
            } catch (e) {
                console.warn("Load state 'load' timed out, continuing with 'domcontentloaded'");
            }

            // Wait specifically for animations/fade-ins
            await page.waitForTimeout(2000);

            const title = await page.title();

            let fullPageScreenshot: string | undefined;
            if (options.includeScreenshots) {
                const buffer = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 50 });
                fullPageScreenshot = buffer.toString('base64');
            }

            // Client-side identification phase (Your existing logic)
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

                const structuralSelectors = ['header', 'footer', 'nav', 'main', 'aside', 'section'];
                const layoutSelectors = [
                    '[role="banner"]', '[role="main"]', '[role="contentinfo"]',
                    'main > *',
                    'body > div:not(#__next):not(#root)',
                ];

                const candidates = Array.from(document.querySelectorAll([...structuralSelectors, ...layoutSelectors].join(', ')));
                let uniqueCandidates = Array.from(new Set(candidates)) as HTMLElement[];

                uniqueCandidates = uniqueCandidates.filter(el => {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
                    if (rect.width < 100 || rect.height < 50) return false;
                    return true;
                });

                const finalElements: HTMLElement[] = [];
                const discardSet = new Set<HTMLElement>();

                for (let i = 0; i < uniqueCandidates.length; i++) {
                    const outer = uniqueCandidates[i];
                    if (discardSet.has(outer)) continue;

                    for (let j = 0; j < uniqueCandidates.length; j++) {
                        if (i === j) continue;
                        const inner = uniqueCandidates[j];
                        if (discardSet.has(inner)) continue;

                        if (outer.contains(inner)) {
                            const outerRect = outer.getBoundingClientRect();
                            const innerRect = inner.getBoundingClientRect();
                            const outerArea = outerRect.width * outerRect.height;
                            const innerArea = innerRect.width * innerRect.height;

                            if (outer.tagName === 'MAIN' || outer.tagName === 'BODY') {
                                discardSet.add(outer);
                            }
                            else {
                                if (innerArea / outerArea > 0.7) {
                                    discardSet.add(inner);
                                }
                            }
                        }
                    }
                }

                const results: any[] = [];
                let counter = 0;

                uniqueCandidates.sort((a, b) => {
                    const rectA = a.getBoundingClientRect();
                    const rectB = b.getBoundingClientRect();
                    return rectA.y - rectB.y;
                });

                for (const el of uniqueCandidates) {
                    if (discardSet.has(el)) continue;
                    const rect = el.getBoundingClientRect();
                    if (rect.height > document.documentElement.scrollHeight * 0.9) continue;

                    const uniqueId = `scraped-section-${counter++}`;
                    el.setAttribute('data-scraped-id', uniqueId);

                    results.push({
                        id: uniqueId,
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
            }, options.includeScreenshots);

            const processedSections: ScrapedSection[] = [];
            for (const section of rawSections) {
                let screenshotBase64: string | undefined;

                if (options.includeScreenshots) {
                    try {
                        const locator = page.locator(`[data-scraped-id="${section.id}"]`);
                        if (await locator.count() > 0) {
                            const buffer = await locator.first().screenshot({ type: 'jpeg', quality: 60, timeout: 5000 });
                            screenshotBase64 = buffer.toString('base64');
                        }
                    } catch (e) {
                        console.warn(`Failed to capture screenshot for section ${section.id}:`, e);
                    }
                }

                processedSections.push({ ...section, screenshot: screenshotBase64 });
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

    /**
     * Simulates imperfect human mouse movement to trick behavior-based detectors.
     */
    private async simulateHumanMouseMovements(page: Page) {
        // Simple bezier-like curve simulation or just random points
        const width = 1920;
        const height = 1080;

        // Move to center-ish
        await page.mouse.move(width / 2 + Math.random() * 100, height / 2 + Math.random() * 100, { steps: 5 });

        // Jitter
        for (let i = 0; i < 3; i++) {
            await page.mouse.move(
                width / 2 + Math.random() * 200 - 100,
                height / 2 + Math.random() * 200 - 100,
                { steps: 25 } // steps creates the "drag" effect vs instant teleport
            );
        }
    }
}

export const playwrightScraper = new PlaywrightScraper();

export const scrapeUrl = async (url: string) => {
    return playwrightScraper.scrape(url, { url, includeScreenshots: true });
};