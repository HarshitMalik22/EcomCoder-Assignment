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

            // Wait specifically for animations/fade-ins
            await page.waitForTimeout(2000);

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

                // Priority 1: Semantic Structural Elements
                const structuralSelectors = [
                    'header', 'footer', 'nav', 'main', 'aside', 'section'
                ];

                // Priority 2: Likely Section Containers (Direct children of structural elements)
                const layoutSelectors = [
                    '[role="banner"]', '[role="main"]', '[role="contentinfo"]',
                    'main > *', // Direct children of main are usually sections
                    'body > div:not(#__next):not(#root)', // Direct children of body (excluding app roots)
                ];

                // Gather candidates
                const candidates = Array.from(document.querySelectorAll([...structuralSelectors, ...layoutSelectors].join(', ')));

                // Deduplicate by reference immediately
                let uniqueCandidates = Array.from(new Set(candidates)) as HTMLElement[];

                // Filter out tiny/invisible elements immediately
                uniqueCandidates = uniqueCandidates.filter(el => {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);

                    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
                    if (rect.width < 100 || rect.height < 50) return false;

                    return true;
                });

                // Deduplication Strategy: Remove Nested Redundancy
                // If Element A contains Element B, and they are roughly the same size (B is > 80% of A),
                // we keep A (the parent) to capture the full background, and discard B.
                // UNLESS A is 'main' or 'body', in which case we prefer the children (B).

                const finalElements: HTMLElement[] = [];
                const discardSet = new Set<HTMLElement>();

                // Sort by size (area), largest first. This helps in checking "is contained by".
                // Actually, traversing DOM tree might be safer.
                // Let's simple n^2 check since n is small (usually < 50 candidates).

                for (let i = 0; i < uniqueCandidates.length; i++) {
                    const outer = uniqueCandidates[i];
                    if (discardSet.has(outer)) continue;

                    for (let j = 0; j < uniqueCandidates.length; j++) {
                        if (i === j) continue;
                        const inner = uniqueCandidates[j];
                        if (discardSet.has(inner)) continue;

                        // Check if inner is descendant of outer
                        if (outer.contains(inner)) {
                            const outerRect = outer.getBoundingClientRect();
                            const innerRect = inner.getBoundingClientRect();
                            const outerArea = outerRect.width * outerRect.height;
                            const innerArea = innerRect.width * innerRect.height;

                            // If Outer is a structural wrapper (Main/Body) and Inner is a section,
                            // we nearly ALWAYS want the Inner, unless Outer is small?
                            if (outer.tagName === 'MAIN' || outer.tagName === 'BODY') {
                                // Keep Inner, Discard Outer (we want the specific sections, not the big wrapper)
                                // But only discard outer if inner is 'significant'.
                                // Actually, let's just mark Main/Body as "containers" and never return them if they have children.
                                // Simplification: Don't return MAIN/BODY if we found *any* overlapping children.
                                discardSet.add(outer);
                            }
                            else {
                                // Standard Case: Outer is Section, Inner is Container/Div
                                // If Inner is almost same size as Outer (> 70%), it's a wrapper -> Keep Outer (background), Discard Inner.
                                if (innerArea / outerArea > 0.7) {
                                    discardSet.add(inner);
                                }
                                // If Inner is small (e.g. a button or small card inside section), keep both?
                                // Our detector usually captures "Rows" or "Sections". Small elements shouldn't be here due to our initial selectors.
                            }
                        }
                    }
                }

                // Final pass to build results, skipping discarded
                const results: any[] = [];
                let counter = 0;

                // Re-sort by position in document (Y coordinate)
                uniqueCandidates.sort((a, b) => {
                    const rectA = a.getBoundingClientRect();
                    const rectB = b.getBoundingClientRect();
                    return rectA.y - rectB.y;
                });

                for (const el of uniqueCandidates) {
                    if (discardSet.has(el)) continue;

                    // Final sanity check for "Way too big" elements that survived (e.g. accidentally kept a full page wrapper div)
                    const rect = el.getBoundingClientRect();
                    if (rect.height > document.documentElement.scrollHeight * 0.9) {
                        // Likely a global wrapper
                        continue;
                    }

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