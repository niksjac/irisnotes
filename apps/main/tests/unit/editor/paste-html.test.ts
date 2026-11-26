import { describe, expect, it } from "vitest";
import { DOMParser } from "prosemirror-model";
import { editorSchema } from "@/components/editor/schema";
import { normalizePastedHtml, stripForeignFontStyles } from "@/components/editor/paste-html";

function marksOf(html: string): string[] {
	const div = document.createElement("div");
	div.innerHTML = html;
	const slice = DOMParser.fromSchema(editorSchema).parseSlice(div);
	const names = new Set<string>();
	slice.content.descendants((node) => {
		node.marks.forEach((mark) => names.add(mark.type.name));
	});
	return [...names].sort();
}

const browserLink = `<meta charset="utf-8"><a href="https://example.com" style="color: rgb(26, 13, 171); font-family: arial, sans-serif; font-size: 16px; font-weight: 400;">Example</a>`;

describe("pasted HTML fonts", () => {
	it("drops the source page's font from a link copied in a browser", () => {
		expect(marksOf(browserLink)).toContain("fontSize");
		const cleaned = normalizePastedHtml(browserLink);
		expect(marksOf(cleaned)).not.toContain("fontSize");
		expect(marksOf(cleaned)).not.toContain("fontFamily");
		expect(marksOf(cleaned)).toContain("link");
		expect(cleaned).toContain("color: rgb(26, 13, 171)");
	});

	it("keeps the source fonts when asked (paste keeping source formatting)", () => {
		const kept = marksOf(normalizePastedHtml(browserLink, { keepFonts: true }));
		expect(kept).toContain("fontSize");
		expect(kept).toContain("fontFamily");
	});

	it("keeps font sizes copied inside IrisNotes (headings are fontSize marks)", () => {
		const html = `<p data-pm-slice="1 1 []"><span style="font-size: 24px">Heading</span></p>`;
		expect(stripForeignFontStyles(html)).toBe(html);
	});

	it("removes style attributes left empty", () => {
		expect(stripForeignFontStyles(`<span style="font-size: 16px">x</span>`)).toBe("<span>x</span>");
	});
});
