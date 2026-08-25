/**
 * Extracts a human-readable message from anything a Supabase call might
 * throw. Most Supabase errors extend Error, but postgrest-js falls back to a
 * plain { message, details, hint, code } object — not an Error instance —
 * when the underlying fetch itself fails (a network error, as opposed to an
 * HTTP error response), so `instanceof Error` alone misses that case and
 * silently swallows the real reason.
 */
export function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const message = (e as { message: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}
