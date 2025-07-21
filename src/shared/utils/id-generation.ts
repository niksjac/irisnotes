/**
 * Deterministic ID generation utilities
 * Replaces Math.random() based ID generation with predictable, incrementing IDs
 */

let idCounter = 0;

/**
 * Generates a deterministic ID with an optional prefix
 * @param prefix - The prefix for the ID (default: 'id')
 * @returns A deterministic ID string
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${++idCounter}`;
};

/**
 * Generates a cryptographically secure ID when available
 * Falls back to deterministic ID for older browsers
 * @returns A secure or deterministic ID string
 */
export const generateSecureId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return generateId('secure');
};

/**
 * Resets the internal counter (useful for testing)
 */
export const resetIdCounter = (): void => {
  idCounter = 0;
};

/**
 * Gets the current counter value (useful for debugging)
 */
export const getCurrentCounter = (): number => {
  return idCounter;
};
