/**
 * Utility to parse API error messages
 */
export function parseErrorMessage(message: string | undefined): string {
    if (!message) return "An unexpected error occurred.";
    if (typeof message !== "string") return String(message);

    const trimmed = message.trim();
    if (trimmed.startsWith("{")) {
        try {
            const parsed = JSON.parse(trimmed);
            
            // Check for nested validation errors (RFC 9110 / .NET Validation format)
            if (parsed.errors && typeof parsed.errors === "object" && !Array.isArray(parsed.errors)) {
                const errorValues = Object.values(parsed.errors);
                for (const val of errorValues) {
                    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string" && val[0].trim()) {
                        return val[0].trim();
                    }
                    if (typeof val === "string" && val.trim()) {
                        return val.trim();
                    }
                }
            }
            
            // Check for top-level message/error/title/detail fields
            const msg = parsed.message || parsed.error || parsed.title || parsed.detail;
            if (msg && typeof msg === "string" && msg.trim()) {
                return msg.trim();
            }
        } catch {
            // Fall back to original string if JSON parsing fails
        }
    }
    return message;
}
