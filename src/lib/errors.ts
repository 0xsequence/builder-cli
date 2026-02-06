/**
 * Extract a readable error message from an unknown thrown value.
 * Handles Error instances, plain objects with message/error/reason fields
 * (common in SDK responses), and falls back to JSON.stringify for arbitrary objects.
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object') {
    // Common SDK error shapes: { message, error, reason, code, status }
    const obj = error as Record<string, unknown>
    if (typeof obj.message === 'string') return obj.message
    if (typeof obj.error === 'string') return obj.error
    if (typeof obj.reason === 'string') return obj.reason
    // Last resort: serialize the whole object
    try {
      return JSON.stringify(error, null, 2)
    } catch {
      return Object.prototype.toString.call(error)
    }
  }
  return String(error)
}
