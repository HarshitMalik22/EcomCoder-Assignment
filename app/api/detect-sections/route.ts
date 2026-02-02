import { NextRequest, NextResponse } from 'next/server';
import { SectionDetector } from '@/lib/section-detector';
import { ScrapedSection } from '@/types/scraper';
import { PlaywrightScraper } from '@/lib/scraper/playwright-scraper';

export const maxDuration = 60; // 1 minute timeout

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        let { sections, url } = body;

        // If URL provided, scrape first
        let fullPageScreenshot: string | undefined;

        if (url && (!sections || sections.length === 0)) {
            // Validate URL before scraping
            try {
                const parsedUrl = new URL(url);
                if (!parsedUrl.hostname.includes('.') && parsedUrl.hostname !== 'localhost') {
                    return NextResponse.json(
                        { error: `Invalid domain "${parsedUrl.hostname}". Please enter a complete URL like "${parsedUrl.hostname}.com"` },
                        { status: 400 }
                    );
                }
            } catch {
                return NextResponse.json(
                    { error: 'Invalid URL format. Please enter a valid URL like https://example.com' },
                    { status: 400 }
                );
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
                return NextResponse.json(
                    { error: `Failed to scrape site: ${(error as Error).message}` },
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
