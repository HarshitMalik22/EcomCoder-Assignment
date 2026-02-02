import { z } from "zod";

export const urlSchema = z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)" });

// Validation helper
export function validateUrl(url: string) {
    const result = urlSchema.safeParse(url);
    if (!result.success) {
        return { isValid: false, error: result.error.errors[0].message };
    }

    // Additional checks (e.g., must be http/https)
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { isValid: false, error: "Only HTTP/HTTPS URLs are supported" };
        }
    } catch {
        return { isValid: false, error: "Invalid URL format" };
    }

    return { isValid: true, error: null };
}

export type UrlValidationResult = ReturnType<typeof validateUrl>;
