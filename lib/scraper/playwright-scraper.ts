import { chromium, Browser, Page } from 'playwright';
import { ScrapedSection, ScrapedPageResult, ScrapeOptions } from '@/types/scraper';

/**
 * Apply stealth techniques to make the browser less detectable
 * This replaces the puppeteer-extra-plugin-stealth which has compatibility issues
 */
async function applyStealthScripts(page: Page): Promise<void> {
    await page.addInitScript(() => {
        // Override navigator.webdriver
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });

        // Override navigator.plugins to have a length > 0
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
        });

        // Override navigator.languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
        });

        // Mock chrome runtime
        (window as any).chrome = {
            runtime: {},
        };

        // Override permissions query
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) =>
            parameters.name === 'notifications'
                ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
                : originalQuery(parameters);

        // Spoof WebGL vendor and renderer
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter: number) {
            if (parameter === 37445) {
                return 'Intel Inc.';
            }
            if (parameter === 37446) {
                return 'Intel Iris OpenGL Engine';
            }
            return getParameter.call(this, parameter);
        };
    });
}

/**
 * Dismiss cookie consent overlays so screenshots are clean. We never click "Accept" –
 * only "Decline" / "Reject" / "Necessary only", or we hide/remove the banner from the DOM.
 */
async function dismissCookieBannerForScreenshot(page: Page): Promise<void> {
    try {
        const declineSelectors = [
            'button:has-text("Decline")',
            'button:has-text("Reject")',
            'button:has-text("Reject all")',
            'button:has-text("Only necessary")',
            'button:has-text("Necessary only")',
            'button:has-text("No thanks")',
            'button:has-text("Decline all")',
            '[aria-label*="Decline" i]',
            '[aria-label*="Reject" i]',
            'a:has-text("Decline")',
            'a:has-text("Reject")',
        ];
        for (const selector of declineSelectors) {
            const btn = page.locator(selector).first();
            if ((await btn.count()) > 0) {
                await btn.click({ timeout: 2000 }).catch(() => {});
                await page.waitForTimeout(400);
                return;
            }
        }

        await page.evaluate(() => {
            const bannerPhrases = ['we value your privacy', 'cookie', 'cookies', 'gdpr', 'consent'];
            const acceptPhrases = ['accept', 'allow all', 'agree'];

            const candidates = document.querySelectorAll(
                '[role="dialog"], [class*="modal"], [class*="banner"], [class*="consent"], [class*="cookie"], [id*="cookie"], [id*="consent"]'
            );
            for (const el of Array.from(candidates)) {
                if (!(el instanceof HTMLElement)) continue;
                const text = (el.innerText || el.textContent || '').toLowerCase();
                const looksLikeBanner = bannerPhrases.some(p => text.includes(p));
                const hasAcceptButton = acceptPhrases.some(p => text.includes(p));
                if (looksLikeBanner && (hasAcceptButton || text.length < 600)) {
                    el.style.setProperty('display', 'none', 'important');
                }
            }
        });
    } catch {
        // Non-fatal: scraping continues even if banner stays
    }
}

/**
 * Block cookies: strip Set-Cookie from document responses so we never store cookies.
 * We do not accept cookie banners or consent – no cookies are requested or stored.
 * Only document requests are intercepted to keep scraping fast.
 */
async function blockCookies(page: Page): Promise<void> {
    await page.route('**/*', async (route) => {
        if (route.request().resourceType() !== 'document') {
            await route.continue();
            return;
        }
        const response = await route.fetch().catch(() => null);
        if (!response) {
            await route.abort();
            return;
        }
        const raw = response.headers();
        const headers: Record<string, string> = {};
        for (const name of Object.keys(raw)) {
            if (name.toLowerCase() !== 'set-cookie') headers[name] = raw[name];
        }
        await route.fulfill({
            status: response.status(),
            headers,
            body: await response.body(),
        });
    });
}

export class PlaywrightScraper {
    private browser: Browser | null = null;

    async scrape(url: string, options: ScrapeOptions = { url }): Promise<ScrapedPageResult> {
        this.browser = await chromium.launch({
            headless: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-sync',
                '--disable-default-apps',
                '--mute-audio',
                '--no-first-run',
            ],
            timeout: 30000,
        });

        const context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US',
            timezoneId: 'America/New_York',
            ignoreHTTPSErrors: true,
            javaScriptEnabled: true,
        });

        await context.clearCookies();

        const page = await context.newPage();

        try {
            await applyStealthScripts(page);

            // Block cookies: strip Set-Cookie from all responses – we never store or accept cookies
            await blockCookies(page);

            await page.setExtraHTTPHeaders({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
            });

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

            // Light scroll to trigger lazy content
            await page.mouse.wheel(0, 300);

            try {
                await page.waitForLoadState('networkidle', { timeout: 8000 });
            } catch {
                await page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
            }

            await page.waitForTimeout(800);

            await dismissCookieBannerForScreenshot(page);
            await page.waitForTimeout(300);

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

                    const base = document.location.origin;
                    const resolveSrc = (src: string | null): string => {
                        if (!src || !src.trim()) return '';
                        const s = src.trim();
                        if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
                        if (s.startsWith('//')) return document.location.protocol + s;
                        return base + (s.startsWith('/') ? s : '/' + s);
                    };
                    const imgs = el.querySelectorAll('img');
                    const images = Array.from(imgs).map((img) => {
                        const i = img as HTMLImageElement;
                        const src = resolveSrc(i.currentSrc || i.getAttribute('src'));
                        if (!src) return null;
                        const w = i.getAttribute('width');
                        const h = i.getAttribute('height');
                        return {
                            src,
                            alt: i.getAttribute('alt') || undefined,
                            width: w ? parseInt(w, 10) : (i.naturalWidth || undefined),
                            height: h ? parseInt(h, 10) : (i.naturalHeight || undefined),
                        };
                    }).filter((x): x is NonNullable<typeof x> => x !== null);

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
                        },
                        images: images.length ? images : undefined
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
}

export const playwrightScraper = new PlaywrightScraper();

export const scrapeUrl = async (url: string) => {
    return playwrightScraper.scrape(url, { url, includeScreenshots: true });
};