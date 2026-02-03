
export class AppError extends Error {
    public code: string;
    public statusCode: number;
    public context?: any;

    constructor(message: string, code: string, statusCode: number = 500, context?: any) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ScrapingError extends AppError {
    constructor(message: string, context?: any) {
        super(message, 'SCRAPING_ERROR', 502, context); // 502 Bad Gateway often appropriate for upstream failures
    }
}

export class GenerationError extends AppError {
    constructor(message: string, context?: any) {
        super(message, 'GENERATION_ERROR', 503, context); // 503 Service Unavailable
    }
}

export class ValidationError extends AppError {
    constructor(message: string, context?: any) {
        super(message, 'VALIDATION_ERROR', 400, context);
    }
}

export class SectionDetectionError extends AppError {
    constructor(message: string, context?: any) {
        super(message, 'SECTION_DETECTION_ERROR', 500, context);
    }
}

export function handleError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error;
    }

    if (error instanceof Error) {
        return new AppError(error.message, 'INTERNAL_SERVER_ERROR', 500, { originalStack: error.stack });
    }

    return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500, { originalError: error });
}

export function sanitizeErrorMessage(message: string): string {
    if (!message) return 'An unknown error occurred';

    const lowerMessage = message.toLowerCase();

    // Playwright/Automation specific errors
    if (lowerMessage.includes('page.screenshot') || lowerMessage.includes('locator.screenshot')) {
        return 'Failed to capture page layout. The site might have strong bot protection (like Cloudflare) or is too complex to render.';
    }

    if (lowerMessage.includes('page.goto') || lowerMessage.includes('timeout')) {
        return 'The website took too long to load. This can happen if the site is slow or blocking automated scanning.';
    }

    if (lowerMessage.includes('err_name_not_resolved')) {
        return 'We couldn\'t find that website. Please check if the URL is correct.';
    }

    if (lowerMessage.includes('browser was closed') || lowerMessage.includes('target closed')) {
        return 'The connection to the browser was interrupted. Please try again.';
    }

    // Generic Playwright internal details cleanup
    if (message.includes('==========')) {
        return message.split('==========')[0].trim() || 'Scraping failed during browser execution.';
    }

    // Capture the first readable line if it's a multi-line technical log
    const lines = message.split('\n');
    if (lines.length > 1 && lines[0].length < 10) {
        // Sometimes the first line is just "Error:"
        return lines[1].trim();
    }

    // Final limit
    if (message.length > 300) {
        return message.substring(0, 300) + '...';
    }

    return message;
}
