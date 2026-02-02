
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
