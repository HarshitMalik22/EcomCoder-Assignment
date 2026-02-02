
import { logger } from '@/lib/logger';

interface RetryOptions {
    maxRetries?: number;
    baseDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: any) => boolean;
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        backoffFactor = 2,
        shouldRetry = () => true,
    } = options;

    let attempt = 0;

    while (true) {
        try {
            return await fn();
        } catch (error) {
            attempt++;

            if (attempt > maxRetries || !shouldRetry(error)) {
                throw error;
            }

            const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);

            logger.warn(`Retry attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`, {
                error: error instanceof Error ? error.message : String(error)
            });

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
