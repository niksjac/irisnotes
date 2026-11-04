/**
 * Text case cycling for ProseMirror (Shift+F3 by default)
 *
 * Cycles the selection — or the word at the cursor — through:
 *   lower case → UPPER CASE → Title Case → snake_case → kebab-case → camelCase → …
 *
 * The current case is detected from the text itself, so the cycle continues
 * from wherever the text is. Text with punctuation (e.g. "hello, world") only
 * cycles lower → UPPER → Title, because joining it into an identifier would
 * mangle the punctuation.
 */

import { type Command, TextSelection } from "prosemirror-state";
import type { Mark } from "prosemirror-model";
import { getWordAt } from "./line-commands";

/**
 * Split identifier-like text into lowercase words: "hello_world" → ["hello", "world"].
 * camelCase humps are split only in a single identifier ("helloWorld"), so mixed
 * case in separated words ("hELLo wOrld") isn't chopped up.
 */
function splitWords(text: string): string[] {
	const hasSeparators = /[\s_-]/u.test(text);
	const humped = hasSeparators
		? text
		: text
			.replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, "$1 $2")
			.replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2");
	return humped
		.split(/[\s_-]+/u)
		.filter(Boolean)
		.map((w) => w.toLowerCase());
}

function capitalize(word: string): string {
	const first = word.charAt(0);
	return first.toUpperCase() + word.slice(first.length);
}

/** Title-case prose without touching its punctuation or spacing */
function titleCasePreserving(text: string): string {
	return text.toLowerCase().replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu, (_m, pre: string, ch: string) => pre + ch.toUpperCase());
}

/** All case variants of `text`, in cycle order (may contain duplicates). */
export function caseVariants(text: string): string[] {
	const isIdentifierLike = /^[\p{L}\p{N}\s_-]+$/u.test(text);
	if (!isIdentifierLike) {
		return [text.toLowerCase(), text.toUpperCase(), titleCasePreserving(text)];
	}
	const words = splitWords(text);
	if (words.length === 0) return [text];
	return [
		words.join(" "),
		words.join(" ").toUpperCase(),
		words.map(capitalize).join(" "),
		words.join("_"),
		words.join("-"),
		words[0] + words.slice(1).map(capitalize).join(""),
	];
}

/** The next case of `text` in the cycle, or null if no other case differs. */
export function nextCase(text: string): string | null {
	const variants = caseVariants(text);
	// Unrecognised (mixed) case gives -1, so the cycle starts at lower case
	const current = variants.indexOf(text);
	for (let i = 1; i <= variants.length; i++) {
		const candidate = variants[(current + i) % variants.length];
		if (candidate !== undefined && candidate !== text) return candidate;
	}
	return null;
}

/**
 * Cycle the case of the selected text, or of the word at the cursor.
 * Works within a single text block; returns false otherwise.
 */
export const cycleCase: Command = (state, dispatch) => {
	const { selection, doc } = state;
	let { from, to } = selection;

	if (selection.empty) {
		const word = getWordAt(doc, from);
		if (!word) return false;
		({ from, to } = word);
	}

	const $from = doc.resolve(from);
	const $to = doc.resolve(to);
	if (!$from.sameParent($to) || !$from.parent.isTextblock) return false;

	const text = doc.textBetween(from, to, "");
	// Bail on inline non-text nodes (images, …) inside the range
	if (!text || text.length !== to - from) return false;

	const next = nextCase(text);
	if (next === null) return false;

	if (dispatch) {
		const tr = state.tr;
		if (next.length === text.length) {
			// Same length: replace node by node so mixed formatting is kept
			doc.nodesBetween(from, to, (node, pos) => {
				if (!node.isText) return true;
				const start = Math.max(from, pos);
				const end = Math.min(to, pos + node.nodeSize);
				if (start >= end) return false;
				const piece = next.slice(start - from, end - from);
				tr.replaceWith(start, end, state.schema.text(piece, node.marks));
				return false;
			});
		} else {
			// Length changed (e.g. snake_case): take the marks of the first character
			const marks: readonly Mark[] = doc.resolve(from + 1).marks();
			tr.replaceWith(from, to, state.schema.text(next, marks));
		}
		tr.setSelection(TextSelection.create(tr.doc, from, from + next.length));
		dispatch(tr.scrollIntoView());
	}
	return true;
};
