/**
 * Compare two fractional index sort_order strings.
 *
 * The fractional-indexing library uses a character set where:
 * 0-9 < A-Z < a-z
 *
 * This requires ASCII/lexicographic comparison, NOT localeCompare
 * (which treats uppercase as coming after lowercase in many locales).
 */
export function compareSortOrder(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}
