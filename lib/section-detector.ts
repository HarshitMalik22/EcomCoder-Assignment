
import { SectionMetadata, SectionType } from '@/types/section';
import { ScrapedSection } from '@/types/scraper';

interface KeywordWeight {
    word: string;
    weight: number;
}

const SECTION_KEYWORDS: Record<SectionType, KeywordWeight[]> = {
    hero: [
        { word: 'welcome', weight: 2 },
        { word: 'get started', weight: 3 },
        { word: 'sign up', weight: 2 },
        { word: 'hero', weight: 4 }, // often in class names
        { word: 'intro', weight: 2 },
    ],
    header: [
        { word: 'nav', weight: 3 },
        { word: 'header', weight: 4 },
        { word: 'menu', weight: 2 },
        { word: 'logo', weight: 1 },
    ],
    footer: [
        { word: 'copyright', weight: 3 },
        { word: 'privacy', weight: 2 },
        { word: 'terms', weight: 2 },
        { word: 'footer', weight: 5 },
        { word: 'social', weight: 1 },
        { word: '©', weight: 3 },
    ],
    features: [
        { word: 'features', weight: 4 },
        { word: 'benefits', weight: 3 },
        { word: 'includes', weight: 2 },
        { word: 'why us', weight: 3 },
        { word: 'capabilities', weight: 2 },
    ],
    pricing: [
        { word: 'pricing', weight: 5 },
        { word: 'plan', weight: 3 },
        { word: 'subscribe', weight: 3 },
        { word: 'yearly', weight: 2 },
        { word: 'monthly', weight: 2 },
        { word: '$', weight: 1 },
        { word: 'free', weight: 2 },
        { word: 'enterprise', weight: 2 },
    ],
    testimonials: [
        { word: 'testimonial', weight: 5 },
        { word: 'reviews', weight: 4 },
        { word: 'what they say', weight: 3 },
        { word: 'customers', weight: 2 },
        { word: 'clients', weight: 2 },
        { word: 'feedback', weight: 2 },
    ],
    faq: [
        { word: 'faq', weight: 5 },
        { word: 'frequently', weight: 4 },
        { word: 'questions', weight: 3 },
        { word: 'answers', weight: 2 },
        { word: 'help', weight: 2 },
    ],
    contact: [
        { word: 'contact', weight: 5 },
        { word: 'email', weight: 2 },
        { word: 'phone', weight: 2 },
        { word: 'message', weight: 2 },
        { word: 'address', weight: 2 },
        { word: 'touch', weight: 2 },
    ],
    unknown: [],
};

// Increased weights for semantic HTML tags
const HTML_TAG_WEIGHTS: Record<string, Partial<Record<SectionType, number>>> = {
    'HEADER': { header: 15 },  // Increased from 10 to 15
    'FOOTER': { footer: 15 },  // Increased from 10 to 15
    'NAV': { header: 8 },
    'MAIN': { hero: 2 },  // MAIN often contains hero content
    'ARTICLE': {},
    'SECTION': {},
    'DIV': {},
};

export class SectionDetector {

    detect(sections: ScrapedSection[]): SectionMetadata[] {
        // Get page height for position-based detection
        const pageHeight = sections.length > 0
            ? Math.max(...sections.map(s => s.boundingBox.y + s.boundingBox.height))
            : 0;

        return sections.map(section => this.analyzeSection(section, pageHeight));
    }

    private analyzeSection(section: ScrapedSection, pageHeight: number): SectionMetadata {
        const text = section.text.toLowerCase();
        const html = section.html.toLowerCase();
        const classes = section.selector.toLowerCase();
        const tagName = section.tagName.toUpperCase();

        const scores: Record<SectionType, number> = {
            hero: 0,
            header: 0,
            footer: 0,
            features: 0,
            pricing: 0,
            testimonials: 0,
            faq: 0,
            contact: 0,
            unknown: 0,
        };

        // 1. Tag Name Analysis (with increased weights for semantic tags)
        const tagWeights = HTML_TAG_WEIGHTS[tagName];
        if (tagWeights) {
            Object.entries(tagWeights).forEach(([type, score]) => {
                scores[type as SectionType] += score;
            });
        }

        // 2. Keyword Analysis (Text & Classes)
        Object.entries(SECTION_KEYWORDS).forEach(([type, keywords]) => {
            const sectionType = type as SectionType;
            if (sectionType === 'unknown') return;

            keywords.forEach(({ word, weight }) => {
                // Check text content
                if (text.includes(word)) {
                    scores[sectionType] += weight;
                }
                // Check classes/HTML (higher weight for class names)
                if (classes.includes(word) || html.includes(`class="${word}"`) || html.includes(`id="${word}"`)) {
                    scores[sectionType] += weight * 2;
                }
            });
        });

        // 3. Position Heuristics - Enhanced with page height awareness
        const { y, height } = section.boundingBox;

        // Hero: Must be at the very top AND have substantial height
        if (y < 100 && height > 400) {
            scores.hero += 3;
        }

        // Header: Very top, relatively short height (top 10% of page)
        if (y < 50 && height < 150) {
            scores.header += 4;
        }
        // Additional header detection: in top 10% of page
        if (pageHeight > 0 && y < pageHeight * 0.1 && height < 200) {
            scores.header += 2;
        }

        // Footer: In bottom 20% of page
        if (pageHeight > 0) {
            const elementBottomY = y + height;
            if (elementBottomY > pageHeight * 0.8) {
                scores.footer += 3;
            }
            // Strong footer signal: very bottom of page
            if (elementBottomY >= pageHeight * 0.95) {
                scores.footer += 2;
            }
        }

        // 4. Content-based heuristics
        // CTA buttons often indicate hero sections
        if (html.includes('get started') || html.includes('sign up') || html.includes('try for free')) {
            if (y < 500) {
                scores.hero += 2;
            }
        }

        // 5. Content validation check
        const hasContent = text.trim().length > 0 || section.screenshot;

        // Determine best fit
        let maxScore = 0;
        let bestType: SectionType = 'unknown';

        Object.entries(scores).forEach(([type, score]) => {
            if (score > maxScore) {
                maxScore = score;
                bestType = type as SectionType;
            }
        });

        // If section has no text and no screenshot, mark confidence as 0
        if (!hasContent) {
            maxScore = 0;
            bestType = 'unknown';
        }

        // Threshold for "unknown" - be stricter
        if (maxScore < 4) {
            bestType = 'unknown';
        }

        // Normalize confidence (0-1), roughly
        const confidence = Math.min(maxScore / 20, 1);

        return {
            id: section.id,
            type: bestType,
            confidence: parseFloat(confidence.toFixed(2)),
            boundingBox: section.boundingBox,
            screenshot: section.screenshot,
            html: section.html,
            text: section.text,
            images: section.images,
        };
    }
}
