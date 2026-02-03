import { NextRequest, NextResponse } from 'next/server';
import { SectionDetector } from '@/lib/section-detector';
import { ScrapedSection } from '@/types/scraper';
import { PlaywrightScraper } from '@/lib/scraper/playwright-scraper';
import { validateUrl } from '@/lib/validators';
import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';
import { sanitizeErrorMessage } from '@/lib/errors/error-handler';

export const maxDuration = 60; // 1 minute timeout

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        let { sections, url } = body;

        // If URL provided, scrape first
        let fullPageScreenshot: string | undefined;

        if (url && (!sections || sections.length === 0)) {
            // Validate URL before scraping
            const validation = validateUrl(url);
            if (!validation.isValid) {
                return NextResponse.json({ error: validation.error }, { status: 400 });
            }
            url = validation.formattedUrl; // Ensure we use the formatted URL

            // Advanced SSRF Protection: DNS Resolution
            try {
                const parsed = new URL(url);
                const hostname = parsed.hostname;

                // Resolve DNS
                const { address } = await dns.lookup(hostname);

                // Check resolved IP
                if (ipaddr.isValid(address)) {
                    // @ts-ignore
                    const addr = ipaddr.parse(address);
                    // @ts-ignore
                    const range = addr.range();

                    if (range === 'private' || range === 'loopback' || range === 'linkLocal' || range === 'uniqueLocal') {
                        return NextResponse.json({ error: `Access disallowed: Resolved to private IP (${address})` }, { status: 403 });
                    }
                }
            } catch (e) {
                return NextResponse.json({ error: 'Failed to resolve domain' }, { status: 400 });
            }

            console.log(`Detecting sections for URL: ${url}`);
            try {
                // We'll use a short timeout/lighter scrape since we just need sections
                const scraper = new PlaywrightScraper();
                const scrapeResult = await scraper.scrape(url, {
                    url,
                    includeScreenshots: true
                });
                sections = scrapeResult.sections || [];
                fullPageScreenshot = scrapeResult.fullPageScreenshot;
            } catch (error) {
                console.error('Scraping failed during detection:', error);
                const message = sanitizeErrorMessage((error as Error).message);
                return NextResponse.json(
                    { error: message },
                    { status: 502 }
                );
            }
        }

        if (!sections || !Array.isArray(sections)) {
            return NextResponse.json(
                { error: 'Invalid input: url or sections array is required' },
                { status: 400 }
            );
        }

        const detector = new SectionDetector();
        const detectedSections = detector.detect(sections);

        return NextResponse.json({
            data: {
                sections: detectedSections,
                fullPageScreenshot
            }
        });

    } catch (error) {
        console.error('Error in section detection API:', error);
        return NextResponse.json(
            { error: 'Internal server error while detecting sections' },
            { status: 500 }
        );
    }
}
