import { z } from "zod";

export const urlSchema = z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)" });

// Validation helper
export function validateUrl(inputUrl: string) {
    let urlToValidate = inputUrl.trim();

    // Auto-prepend https:// if missing protocol
    if (!/^https?:\/\//i.test(urlToValidate)) {
        urlToValidate = `https://${urlToValidate}`;
    }

    const result = urlSchema.safeParse(urlToValidate);
    if (!result.success) {
        return { isValid: false, error: result.error.errors[0].message };
    }

    // Additional checks
    try {
        const parsed = new URL(urlToValidate);

        // Must be http/https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { isValid: false, error: "Only HTTP/HTTPS URLs are supported" };
        }

        // Check for valid domain with TLD (must contain at least one dot)
        // This catches cases like "supabase" which becomes "https://supabase/" but isn't resolvable
        const hostname = parsed.hostname;
        if (!hostname.includes('.') && hostname !== 'localhost') {
            return {
                isValid: false,
                error: `Invalid domain "${hostname}". Did you mean "${hostname}.com"?`
            };
        }

        // Check for common TLDs or localhost
        const validTldPattern = /\.(com|org|net|io|dev|co|app|edu|gov|mil|biz|info|me|tv|ai|xyz|tech|blog|site|online|store|shop|cloud|design|agency|studio|space|world|life|today|news|media|social|digital|global|pro|group|team|solutions|services|consulting|capital|ventures|fund|finance|health|care|law|legal|marketing|page|rocks|codes|systems|network|software|tools|zone|ly|gg|to|fm|email|link|click|run|build|host|pub|live|video|audio|music|photo|art|gallery|graphics|creative|work|works|company|business|careers|jobs|events|tickets|travel|tours|flights|hotels|food|restaurant|cafe|bar|pizza|beer|wine|coffee|health|fitness|yoga|gym|sport|sports|games|gaming|play|fun|kids|baby|pet|pets|dog|cat|fashion|style|beauty|hair|makeup|skin|wedding|party|gift|gifts|flowers|jewelry|watch|watches|shoes|clothing|home|house|garden|auto|car|cars|bike|moto|parts|repair|realty|property|properties|estate|mortgage|insurance|loans|money|cash|pay|bank|credit|invest|trade|crypto|nft|blockchain|web3|uk|de|fr|es|it|nl|be|at|ch|au|nz|ca|mx|br|ar|in|jp|kr|cn|hk|sg|my|th|ph|vn|id|ru|pl|cz|se|no|dk|fi|ie|pt|gr|tr|za|ae|sa|eg|il|ng)$/i;

        if (!validTldPattern.test(hostname) && hostname !== 'localhost' && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            // It has a dot but might not be a valid TLD - still allow it but warn
            // This is a soft check - we'll let it through as some TLDs might not be in our list
        }

    } catch {
        return { isValid: false, error: "Invalid URL format" };
    }

    return { isValid: true, error: null, formattedUrl: urlToValidate };
}

export type UrlValidationResult = ReturnType<typeof validateUrl>;
