import { NextRequest, NextResponse } from 'next/server';
import { playwrightScraper } from '@/lib/scraper/playwright-scraper';
import { validateUrl } from '@/lib/validators';
import { extractAssets } from '@/lib/scraper/extractor';

export const maxDuration = 60; // 60 seconds timeout for Vercel Pro, default is 10s

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url } = body;

        // Validate URL
        const validation = validateUrl(url);
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Scrape
        console.log(`Scraping URL: ${url}`);
        const result = await playwrightScraper.scrape(url, {
            url,
            includeScreenshots: true
        });

        // Extract Assets (Optional, but good for analysis)
        const assets = extractAssets(result.html);

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                assets
            }
        });

    } catch (error) {
        console.error("Scrape API Error:", error);

        // Check for timeout or specific errors
        const errorMessage = (error as Error).message;
        const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Navigation');

        if (isTimeout) {
            return NextResponse.json(
                { error: "The request timed out. The website might be too slow or blocking bots." },
                { status: 504 }
            );
        }

        return NextResponse.json(
            { error: "Failed to scrape the website. Please check the URL and try again." },
            { status: 500 }
        );
    }
}
