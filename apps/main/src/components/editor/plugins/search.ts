import { Plugin, PluginKey, EditorState, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";

export const searchPluginKey = new PluginKey<SearchState>("search");

interface SearchState {
	query: string;
	matches: Array<{ from: number; to: number }>;
	currentMatchIndex: number;
	decorations: DecorationSet;
}

/**
 * Find all occurrences of a search query in the document
 */
function findMatches(
	doc: EditorState["doc"],
	query: string
): Array<{ from: number; to: number }> {
	if (!query) return [];

	const matches: Array<{ from: number; to: number }> = [];
	const lowerQuery = query.toLowerCase();

	doc.descendants((node, pos) => {
		if (node.isText && node.text) {
			const text = node.text.toLowerCase();
			let index = 0;
			while ((index = text.indexOf(lowerQuery, index)) !== -1) {
				matches.push({
					from: pos + index,
					to: pos + index + query.length,
				});
				index += 1; // Move past this match to find overlapping matches
			}
		}
	});

	return matches;
}

/**
 * Create decorations for all matches
 */
function createDecorations(
	doc: EditorState["doc"],
	matches: Array<{ from: number; to: number }>,
	currentMatchIndex: number
): DecorationSet {
	if (matches.length === 0) return DecorationSet.empty;

	const decorations = matches.map((match, index) => {
		const isCurrent = index === currentMatchIndex;
		return Decoration.inline(match.from, match.to, {
			class: isCurrent ? "search-match search-match-current" : "search-match",
		});
	});

	return DecorationSet.create(doc, decorations);
}

/**
 * Create the search plugin
 */
export function searchPlugin(): Plugin<SearchState> {
	return new Plugin<SearchState>({
		key: searchPluginKey,
		state: {
			init(): SearchState {
				return {
					query: "",
					matches: [],
					currentMatchIndex: -1,
					decorations: DecorationSet.empty,
				};
			},
			apply(tr, state, _oldState, newState): SearchState {
				const meta = tr.getMeta(searchPluginKey);
				
				if (meta?.type === "setQuery") {
					const query = meta.query as string;
					const matches = findMatches(newState.doc, query);
					const currentMatchIndex = matches.length > 0 ? 0 : -1;
					const decorations = createDecorations(
						newState.doc,
						matches,
						currentMatchIndex
					);
					return { query, matches, currentMatchIndex, decorations };
				}
				
				if (meta?.type === "nextMatch") {
					if (state.matches.length === 0) return state;
					const nextIndex = (state.currentMatchIndex + 1) % state.matches.length;
					const decorations = createDecorations(
						newState.doc,
						state.matches,
						nextIndex
					);
					return { ...state, currentMatchIndex: nextIndex, decorations };
				}
				
				if (meta?.type === "prevMatch") {
					if (state.matches.length === 0) return state;
					const prevIndex =
						(state.currentMatchIndex - 1 + state.matches.length) %
						state.matches.length;
					const decorations = createDecorations(
						newState.doc,
						state.matches,
						prevIndex
					);
					return { ...state, currentMatchIndex: prevIndex, decorations };
				}
				
				if (meta?.type === "close") {
					return {
						query: "",
						matches: [],
						currentMatchIndex: -1,
						decorations: DecorationSet.empty,
					};
				}

				// If document changed, re-search with current query
				if (tr.docChanged && state.query) {
					const matches = findMatches(newState.doc, state.query);
					// Try to keep current match index valid
					const currentMatchIndex =
						matches.length > 0
							? Math.min(state.currentMatchIndex, matches.length - 1)
							: -1;
					const decorations = createDecorations(
						newState.doc,
						matches,
						currentMatchIndex >= 0 ? currentMatchIndex : 0
					);
					return { ...state, matches, currentMatchIndex, decorations };
				}

				// Map decorations through document changes
				if (tr.docChanged) {
					return {
						...state,
						decorations: state.decorations.map(tr.mapping, tr.doc),
					};
				}

				return state;
			},
		},
		props: {
			decorations(state) {
				return this.getState(state)?.decorations ?? DecorationSet.empty;
			},
		},
	});
}

/**
 * Set the search query
 */
export function setSearchQuery(view: EditorView, query: string) {
	view.dispatch(
		view.state.tr.setMeta(searchPluginKey, { type: "setQuery", query })
	);
	
	// Scroll to first match (but don't steal focus from search input)
	const state = searchPluginKey.getState(view.state);
	if (state && state.matches.length > 0) {
		const match = state.matches[0];
		if (match) {
			// Use scrollIntoView without changing selection to avoid focus issues
			const coords = view.coordsAtPos(match.from);
			if (coords) {
				const editorRect = view.dom.getBoundingClientRect();
				// Only scroll if match is outside visible area
				if (coords.top < editorRect.top || coords.bottom > editorRect.bottom) {
					view.dom.scrollTo({
						top: view.dom.scrollTop + (coords.top - editorRect.top) - 100,
						behavior: "smooth",
					});
				}
			}
		}
	}
}

/**
 * Go to next match
 */
export function nextMatch(view: EditorView) {
	view.dispatch(view.state.tr.setMeta(searchPluginKey, { type: "nextMatch" }));
	
	// Get updated state after dispatch
	setTimeout(() => {
		const state = searchPluginKey.getState(view.state);
		if (state && state.matches.length > 0 && state.currentMatchIndex >= 0) {
			const match = state.matches[state.currentMatchIndex];
			if (match) {
				view.dispatch(
					view.state.tr.setSelection(TextSelection.create(view.state.doc, match.from))
				);
			}
		}
	}, 0);
}

/**
 * Go to previous match
 */
export function prevMatch(view: EditorView) {
	view.dispatch(view.state.tr.setMeta(searchPluginKey, { type: "prevMatch" }));
	
	// Get updated state after dispatch
	setTimeout(() => {
		const state = searchPluginKey.getState(view.state);
		if (state && state.matches.length > 0 && state.currentMatchIndex >= 0) {
			const match = state.matches[state.currentMatchIndex];
			if (match) {
				view.dispatch(
					view.state.tr.setSelection(TextSelection.create(view.state.doc, match.from))
				);
			}
		}
	}, 0);
}

/**
 * Close search and clear highlights
 */
export function closeSearch(view: EditorView) {
	view.dispatch(view.state.tr.setMeta(searchPluginKey, { type: "close" }));
}

/**
 * Get current search state
 */
export function getSearchState(state: EditorState): SearchState | undefined {
	return searchPluginKey.getState(state);
}
