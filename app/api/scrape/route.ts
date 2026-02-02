// app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scraper';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { url } = body;

        // Basic Validation
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        try {
            new URL(url); // Validates URL format
        } catch (e) {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        // Call the scraper
        const data = await scrapeUrl(url);

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}