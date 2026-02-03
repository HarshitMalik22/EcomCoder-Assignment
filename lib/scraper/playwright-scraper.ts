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
                await btn.click({ timeout: 2000 }).catch(() => { });
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



export class PlaywrightScraper {
    private browser: Browser | null = null;

    private async autoScroll(page: Page): Promise<void> {
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const delay = 100;

                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight - window.innerHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, delay);
            });
        });
    }

    async scrape(url: string, options: ScrapeOptions = { url }): Promise<ScrapedPageResult> {
        // Use remote browser service in production (Vercel), local browser in development
        const browserWSEndpoint = process.env.BROWSER_WS_ENDPOINT;

        if (browserWSEndpoint) {
            // Connect to remote browser service (e.g., Browserless.io)
            console.log('Connecting to remote browser service...');
            this.browser = await chromium.connectOverCDP(browserWSEndpoint, {
                timeout: 30000,
            });
        } else {
            // Local development: launch local browser
            console.log('Launching local browser...');
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
        }

        const context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US',
            timezoneId: 'America/New_York',
            ignoreHTTPSErrors: true,
            javaScriptEnabled: true,
            deviceScaleFactor: 1,
        });

        await context.clearCookies();

        const page = await context.newPage();

        try {
            await applyStealthScripts(page);
            // Relaxed cookie blocking: We simply clear cookies at start. 
            // Intercepting headers caused Next.js hydration crashes on some sites.

            // Allow normal headers to look more like a real user
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
            });

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

            // Robust Auto-Scroll
            try {
                await this.autoScroll(page);
            } catch (e) {
                console.warn('Auto-scroll failed or timed out, continuing...', e);
            }

            try {
                await page.waitForLoadState('networkidle', { timeout: 6000 });
            } catch {
                await page.waitForLoadState('load', { timeout: 4000 }).catch(() => { });
            }
            await page.waitForTimeout(1000);

            await dismissCookieBannerForScreenshot(page);
            await page.waitForTimeout(500);

            const title = await page.title();

            let fullPageScreenshot: string | undefined;
            if (options.includeScreenshots) {
                try {
                    const buffer = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 50 });
                    fullPageScreenshot = buffer.toString('base64');
                } catch (e) {
                    console.warn('Full page screenshot failed:', e);
                }
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
                    const removables = clone.querySelectorAll('script, style, iframe, noscript, svg, [aria-hidden="true"]');
                    removables.forEach(el => el.remove());
                    const allElements = clone.querySelectorAll('*');
                    allElements.forEach(el => {
                        Array.from(el.attributes).forEach(attr => {
                            if (attr.name.startsWith('on') || attr.name.startsWith('data-') || attr.name === 'class') {
                                el.removeAttribute(attr.name);
                            }
                        });
                    });
                    return clone.outerHTML;
                };

                const structuralSelectors = ['header', 'footer', 'nav', 'main', 'aside', 'section', 'article'];
                // Expanded selectors for modern frameworks
                const layoutSelectors = [
                    '[role="banner"]', '[role="main"]', '[role="contentinfo"]',
                    'main > *',
                    '#__next > *', '#root > *', '#app > *',
                    'body > div:not(#__next):not(#root):not(#app)',
                    // Common useful classes
                    '.section', '.container', '.wrapper', '.content'
                ];

                const candidates = Array.from(document.querySelectorAll([...structuralSelectors, ...layoutSelectors].join(', ')));

                // Helper: Check if element is "visually significant"
                const isVisuallySignificant = (el: Element, strict = true) => {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);

                    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
                    if (rect.width < 50 || rect.height < 50) return false;

                    // Must have some content or be a container
                    if (el.textContent?.trim().length === 0 && el.children.length === 0) return false;

                    return true;
                };

                let meaningfulSections: HTMLElement[] = [];
                const processed = new Set<HTMLElement>();

                // --- RECURSIVE FLATTENER ---
                // Identify the "real" layout nodes by effectively removing wrappers.
                // A wrapper is defined as an element that:
                // 1. Has only 1 significant child.
                // 2. OR has multiple children, but they are just tiny spacers + 1 main child.
                // 3. OR is the functionality same size as its child.

                const flattenTree = (element: HTMLElement, depth: number): HTMLElement[] => {
                    if (depth > 20) return [element]; // Safety break

                    const children = Array.from(element.children) as HTMLElement[];
                    const validChildren = children.filter(child => isVisuallySignificant(child));

                    // CASE 1: Single Child Wrapper -> Drill down
                    if (validChildren.length === 1) {
                        const child = validChildren[0];
                        // If child is basically same size as parent, or parent is just a transparent box
                        return flattenTree(child, depth + 1);
                    }

                    // CASE 2: Multi-child Layout (Grid/Flex) -> This IS the layout level
                    if (validChildren.length > 1) {
                        // Check if these children are actually parts of a single logical section (e.g. Header + subheader)
                        // OR if they are distinct major sections (Header, Hero, Footer)

                        // Heuristic: If this element covers the whole viewport height, it's likely a Page Wrapper, not a Section.
                        // We want to return the CHILDREN as the sections.
                        const rect = element.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;

                        // If element is Huge (height > 80% viewport) AND has multiple valid children, 
                        // it's likely a container of sections. Return children.
                        if (rect.height > viewportHeight * 0.8) {
                            let flatChildren: HTMLElement[] = [];
                            validChildren.forEach(vc => {
                                flatChildren = flatChildren.concat(flattenTree(vc, depth + 1));
                            });
                            return flatChildren;
                        }

                        // Otherwise, this element itself might be a "Section" (e.g. a Card Grid)
                        // BUT, if we are at the top level (Body/Root), we ALWAYS want children.
                        const isRoot = ['BODY', 'MAIN', '__next', 'root', 'app'].some(s => element.id === s || element.tagName === s);
                        if (isRoot) {
                            let flatChildren: HTMLElement[] = [];
                            validChildren.forEach(vc => {
                                flatChildren = flatChildren.concat(flattenTree(vc, depth + 1));
                            });
                            return flatChildren;
                        }

                        // If it's a generic div but looks like a Section (has heading, manageable height), keep it.
                        return [element];
                    }

                    // CASE 3: No valid children (Leaf node with text/content) -> This is a Section
                    return [element];
                };

                // Start strict search from known roots
                const roots = Array.from(document.querySelectorAll('body, #__next, #root, #app, main'));
                // Sort roots by specificity (prefer #__next/#root over body)
                roots.sort((a, b) => {
                    const score = (id: string) => ['__next', 'root', 'app'].some(s => id.includes(s)) ? 2 : 1;
                    return score(b.id) - score(a.id);
                });

                const primaryRoot = roots.find(r => r.id === '__next' || r.id === 'root' || r.id === 'app') || document.body;

                // Initial Flattening
                meaningfulSections = flattenTree(primaryRoot as HTMLElement, 0);

                // --- POST-FILTERING ---
                // Now we have a list of potential sections. Filter out garbage.
                meaningfulSections = meaningfulSections.filter(el => {
                    // 1. Visually significant
                    if (!isVisuallySignificant(el)) return false;

                    const rect = el.getBoundingClientRect();
                    // 2. Not too thin (e.g. horizontal rules, tiny spacers)
                    if (rect.height < 50) return false;

                    // 3. Not full-screen overlays (unless they are the only content)
                    // (This helps avoid modals obscuring content, though we might want them?)
                    const style = window.getComputedStyle(el);
                    if (style.position === 'fixed' && style.zIndex !== 'auto' && parseInt(style.zIndex) > 100) return false;

                    // 4. Must contain SOME textual content or an image
                    const hasText = el.innerText.trim().length > 0;
                    const hasImg = el.querySelector('img') !== null;
                    if (!hasText && !hasImg) return false;

                    // 5. Exclude nested duplicates. 
                    // The recursive flatten should have handled this, but safety check:
                    // We actually WANT the deepest significant nodes, so if A contains B, and both are in list,
                    // it means our flattener decided both were distinct blocks? 
                    // Actually, flattener returns leaves or block-containers. They shouldn't overlap strictly.
                    return true;
                });

                // --- DEDUPLICATION (Just in case) ---
                // If Section A contains Section B, and B covers > 80% of A, discard A.
                const finalSections: HTMLElement[] = [];
                meaningfulSections.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height); // larger first

                for (const candidate of meaningfulSections) {
                    let kept = true;
                    for (const existing of finalSections) {
                        if (existing.contains(candidate)) {
                            // Candidate is inside an existing section. 
                            // Usually we want the OUTER one if we decided to stop there.
                            // BUT, if the outer one was "too big" we might want inner. 
                            // With our new logic, if we returned both, it's a bug in flatten. 
                            // Let's assume larger is better if they are truly distinct sections?
                            // No, usually finer grain is better for "Components".
                            // Let's skip candidate if it's already covered.
                            kept = false;
                            break;
                        }
                        if (candidate.contains(existing)) {
                            // Candidate contains existing.
                            // If candidate is just a wrapper, we prefer existing.
                            const cRect = candidate.getBoundingClientRect();
                            const eRect = existing.getBoundingClientRect();
                            if ((eRect.width * eRect.height) / (cRect.width * cRect.height) > 0.6) {
                                // Existing is > 60% of Candidate. Prefer inner existing.
                                kept = false;
                                break;
                            }
                        }
                    }
                    if (kept) finalSections.push(candidate);
                }

                meaningfulSections = finalSections;

                const results: any[] = [];
                let counter = 0;

                // Sort visually (Top to Bottom)
                meaningfulSections.sort((a, b) => {
                    return a.getBoundingClientRect().y - b.getBoundingClientRect().y;
                });

                for (const el of meaningfulSections) {
                    const rect = el.getBoundingClientRect();

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