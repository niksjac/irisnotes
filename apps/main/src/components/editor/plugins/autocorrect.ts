import { Plugin, PluginKey } from "prosemirror-state";
import type { EditorState, Transaction } from "prosemirror-state";
import { autocorrectStore } from "../autocorrect-store";

const autocorrectPluginKey = new PluginKey("autocorrect");

/**
 * Matches \XXXX through \XXXXXX (4–6 hex digits) for Unicode code point entry.
 * The pattern is anchored so it only matches at word boundary (start of line or after space).
 */
const UNICODE_HEX_RE = /\\([0-9a-fA-F]{4,6})$/;

/**
 * Try to convert a `\hex` sequence at the end of textUpToCursor into
 * the corresponding Unicode character. Returns null if no match or
 * invalid code point.
 */
function tryUnicodeHex(
	textUpToCursor: string,
	cursorInParent: number,
	fullText: string,
): { triggerStart: number; replacement: string } | null {
	const m = UNICODE_HEX_RE.exec(textUpToCursor);
	if (!m?.[1]) return null;

	const codePoint = parseInt(m[1], 16);
	// Reject surrogates and out-of-range values
	if (codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return null;

	const triggerStart = cursorInParent - m[0].length;
	// Word boundary check
	if (triggerStart > 0) {
		const charBefore = fullText[triggerStart - 1];
		if (charBefore !== " " && charBefore !== "\t") return null;
	}

	return { triggerStart, replacement: String.fromCodePoint(codePoint) };
}

/**
 * ProseMirror plugin that watches for typed text and replaces trigger
 * strings with their configured replacement the moment the last
 * character of the trigger is typed.
 *
 * Example: trigger = "\alpha" — typing `\alph` then `a` fires the
 * replacement immediately (no trailing space needed).
 *
 * The trigger must sit at the start of the line or be preceded by a
 * space / tab so it doesn't fire inside normal words.
 *
 * Reads rules from the module-level autocorrectStore so they can be
 * updated at runtime without recreating the editor.
 */
export function autocorrectPlugin(): Plugin {
	return new Plugin({
		key: autocorrectPluginKey,
		appendTransaction(
			transactions: readonly Transaction[],
			oldState: EditorState,
			newState: EditorState,
		): Transaction | null {
			// Only react to document changes caused by user input
			const docChanged = transactions.some((tr) => tr.docChanged);
			if (!docChanged || oldState.doc.eq(newState.doc)) return null;

			// Skip transactions from Alt+X reverse lookup to avoid revert loop
			if (transactions.some((tr) => tr.getMeta("reverseUnicodeLookup"))) return null;

			const rules = autocorrectStore.get();

			const { $from } = newState.selection;
			const parent = $from.parent;
			if (!parent.isTextblock) return null;

			const parentStart = $from.start();
			const cursorInParent = $from.parentOffset;
			const text = parent.textContent;

			// Need at least one character
			if (cursorInParent < 1) return null;

			// Text up to (and including) the cursor position
			const textUpToCursor = text.slice(0, cursorInParent);

			// 1. Try TOML-configured rules (sorted longest-first)
			for (const rule of rules) {
				if (rule.trigger.length > cursorInParent) continue;
				if (!textUpToCursor.endsWith(rule.trigger)) continue;

				// Ensure the trigger is at start of line or preceded by whitespace
				const triggerStart = cursorInParent - rule.trigger.length;
				if (triggerStart > 0) {
					const charBefore = text[triggerStart - 1];
					if (charBefore !== " " && charBefore !== "\t") continue;
				}

				// Replace the trigger text with the replacement
				const from = parentStart + triggerStart;
				const to = parentStart + cursorInParent;
				const tr = newState.tr;
				tr.insertText(rule.replacement, from, to);
				return tr;
			}

			// 2. Try Unicode hex code: \XXXX through \XXXXXX (4-6 hex digits)
			const hex = tryUnicodeHex(textUpToCursor, cursorInParent, text);
			if (hex) {
				const from = parentStart + hex.triggerStart;
				const to = parentStart + cursorInParent;
				const tr = newState.tr;
				tr.insertText(hex.replacement, from, to);
				return tr;
			}

			return null;
		},
	});
}
