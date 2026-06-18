let counter = 0;

/**
 * Generate a unique id. Prefers crypto.randomUUID (browser + jsdom);
 * falls back to a time + counter string where unavailable.
 */
export const id = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  counter += 1;
  return `id-${Date.now().toString(36)}-${counter.toString(36)}`;
};
