/**
 * Clean-up for pasted HTML, and "paste keeping source formatting".
 *
 * Browsers put the computed style of copied page content inline, e.g. a link
 * copied from a web page arrives as
 *   <a href="…" style="font-family: arial; font-size: 16px; …">
 * The fontSize and fontFamily marks parse those styles, so pasted text kept the
 * source page's font instead of the note's. A normal paste (Ctrl+V) therefore
 * drops font-size and font-family from HTML copied outside IrisNotes; bold,
 * colours, links etc. stay. Paste keeping source formatting
 * (Ctrl+Shift+Alt+V, or the editor's right-click menu) keeps them too.
 *
 * HTML copied inside IrisNotes is never stripped: headings are fontSize marks
 * (ADR-0005) and must survive copy/paste between notes. ProseMirror marks its
 * own clipboard HTML with a data-pm-slice attribute.
 */

import { invoke } from "@tauri-apps/api/core";
import { DOMParser } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import { localizeImagesInHtml } from "./image-utils";

const FOREIGN_FONT_STYLES = ["font-size", "font-family"];

export function stripForeignFontStyles(html: string): string {
	if (html.includes("data-pm-slice")) return html;
	if (!/font-(size|family)/i.test(html)) return html;

	const template = document.createElement("template");
	template.innerHTML = html;
	for (const el of template.content.querySelectorAll<HTMLElement>("[style]")) {
		for (const prop of FOREIGN_FONT_STYLES) el.style.removeProperty(prop);
		if (!el.getAttribute("style")?.trim()) el.removeAttribute("style");
	}
	return template.innerHTML;
}

/**
 * Line-based model clean-up for pasted HTML:
 * 1. Strip trailing <br> before </p> (prevents extra empty paragraphs)
 * 2. Convert remaining <br> to </p><p> (no hard_break; each line is a paragraph)
 * 3. Normalize <p>&nbsp;</p> to <p></p> (nbsp is just a browser hack
 *    to keep empty paragraphs visible; ProseMirror handles empty <p> fine)
 * 4. Strip default-black color that browsers inject into clipboard HTML
 * 5. Clean up empty style attributes
 * 6. Unless `keepFonts`, drop font-size/font-family from HTML copied outside
 *    IrisNotes, so pasted text takes the note's font
 */
export function normalizePastedHtml(html: string, { keepFonts = false } = {}): string {
	return (keepFonts ? html : stripForeignFontStyles(html))
		.replace(/<br\s*\/?>\s*<\/p>/gi, "</p>")
		.replace(/<br\s*\/?>/gi, "</p><p>")
		.replace(/<p>\s*&nbsp;\s*<\/p>/gi, "<p></p>")
		.replace(/\s*color:\s*rgb\(0,\s*0,\s*0\);?/gi, "")
		.replace(/\s*color:\s*#000000;?/gi, "")
		.replace(/\s*style="\s*"/g, "");
}

/**
 * Paste the clipboard's HTML with its own fonts and sizes. A key handler can't
 * start a native paste, so the clipboard is read through the backend
 * (wl-paste / xclip). Without HTML on the clipboard, pastes its plain text.
 * Returns the number of images that couldn't be imported.
 */
export async function pasteKeepingSourceFormatting(view: EditorView): Promise<number> {
	let html = "";
	try {
		html = await invoke<string>("read_clipboard_target", { target: "text/html" });
	} catch {
		// No HTML on the clipboard
	}

	if (!html.trim()) {
		const text = await invoke<string>("read_clipboard_target", { target: "UTF8_STRING" });
		if (text) view.pasteText(text);
		view.focus();
		return 0;
	}

	const localized = await localizeImagesInHtml(normalizePastedHtml(html, { keepFonts: true }));
	const container = document.createElement("div");
	container.innerHTML = localized.html;
	const slice = DOMParser.fromSchema(view.state.schema).parseSlice(container, {
		context: view.state.selection.$from,
	});
	view.dispatch(view.state.tr.replaceSelection(slice).scrollIntoView());
	view.focus();
	return localized.failedCount;
}
