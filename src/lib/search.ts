import type { Peptide } from '../state/types';

/**
 * Pure, deterministic peptide filter.
 * - `query`: case-insensitive substring; matched against name, nickname, category, and blurb.
 *   Empty or whitespace-only query applies no text filter.
 * - `category`: when non-null, requires an EXACT category match.
 * Returns a new array; never mutates `peptides`.
 */
export function filterPeptides(
  peptides: Peptide[],
  query: string,
  category: string | null,
): Peptide[] {
  const q = query.trim().toLowerCase();

  return peptides.filter((p) => {
    if (category !== null && p.category !== category) return false;
    if (q === '') return true;
    const haystack = [p.name, p.nickname ?? '', p.category, p.blurb].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}
