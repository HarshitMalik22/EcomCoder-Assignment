import * as cheerio from 'cheerio';

export interface ExtractedAssets {
    images: string[];
    styles: string[]; // Inline styles and link hrefs
    meta: Record<string, string>;
}

export function extractAssets(html: string): ExtractedAssets {
    const $ = cheerio.load(html);
    const images: string[] = [];
    const styles: string[] = [];
    const meta: Record<string, string> = {};

    // Images
    $('img').each((_, el) => {
        const src = $(el).attr('src');
        if (src) images.push(src);
    });

    // Styles
    $('style').each((_, el) => {
        const content = $(el).html();
        if (content) styles.push(content);
    });

    $('link[rel="stylesheet"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) styles.push(href);
    });

    // Meta
    $('meta').each((_, el) => {
        const name = $(el).attr('name') || $(el).attr('property');
        const content = $(el).attr('content');
        if (name && content) {
            meta[name] = content;
        }
    });

    return { images, styles, meta };
}
