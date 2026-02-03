// app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scraper';
import { validateUrl } from '@/lib/validators';
import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';
import { sanitizeErrorMessage } from '@/lib/errors/error-handler';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { url } = body;

        // Basic Validation
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const validation = validateUrl(url);
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const formattedUrl = validation.formattedUrl;

        // Advanced SSRF Protection: DNS Resolution
        try {
            const parsed = new URL(formattedUrl!);
            const hostname = parsed.hostname;

            // Resolve DNS
            const { address } = await dns.lookup(hostname);

            // Check resolved IP
            if (ipaddr.isValid(address)) {
                const addr = ipaddr.parse(address);
                const range = addr.range();

                if (range === 'private' || range === 'loopback' || range === 'linkLocal' || range === 'uniqueLocal') {
                    return NextResponse.json({ error: `Access disallowed: Resolved to private IP (${address})` }, { status: 403 });
                }
            }
        } catch (e) {
            return NextResponse.json({ error: 'Failed to resolve domain' }, { status: 400 });
        }

        // Call the scraper with the validated formatted URL
        const data = await scrapeUrl(formattedUrl!);

        return NextResponse.json(data);
    } catch (error: any) {
        // Handle specific scraper errors
        if (error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
            return NextResponse.json({ error: 'Domain not found' }, { status: 400 });
        }

        return NextResponse.json(
            { error: sanitizeErrorMessage(error.message) },
            { status: 500 }
        );
    }
}