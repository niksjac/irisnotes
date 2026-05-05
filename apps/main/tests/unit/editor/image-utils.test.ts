import { describe, expect, it } from "vitest";
import {
	extensionFromImageBytes,
	extensionFromMime,
	normalizeAssetImageUrl,
	parseImageSourcesFromText,
	shouldLocalizeImageSrc,
} from "@/components/editor/image-utils";

describe("image source parsing", () => {
	it("parses absolute image paths", () => {
		expect(parseImageSourcesFromText("/home/niklas/Pictures/example.png")).toEqual([
			{ kind: "file", path: "/home/niklas/Pictures/example.png", extension: "png" },
		]);
	});

	it("parses file URIs from file managers", () => {
		expect(parseImageSourcesFromText("file:///home/niklas/Pictures/example%20image.jpg")).toEqual([
			{ kind: "file", path: "/home/niklas/Pictures/example image.jpg", extension: "jpg" },
		]);
	});

	it("parses GNOME copied file lists", () => {
		expect(parseImageSourcesFromText("copy\nfile:///home/niklas/Pictures/example.webp")).toEqual([
			{ kind: "file", path: "/home/niklas/Pictures/example.webp", extension: "webp" },
		]);
	});

	it("parses asset protocol URLs", () => {
		expect(parseImageSourcesFromText("asset://localhost/abc123.png")).toEqual([
			{ kind: "asset", src: "asset://localhost/abc123.png", alt: "abc123.png" },
		]);
	});

	it("rejects path traversal in asset URLs", () => {
		expect(normalizeAssetImageUrl("asset://localhost/../secret.png")).toBeNull();
	});

	it("rejects malformed asset URL encoding", () => {
		expect(normalizeAssetImageUrl("asset://localhost/%E0%A4%A.png")).toBeNull();
	});

	it("ignores non-image text", () => {
		expect(parseImageSourcesFromText("/home/niklas/Documents/readme.txt")).toEqual([]);
		expect(parseImageSourcesFromText("just normal pasted text")).toEqual([]);
	});

	it("normalizes MIME targets with parameters", () => {
		expect(extensionFromMime("image/png;charset=utf-8")).toBe("png");
	});

	it("detects image extensions from bytes", () => {
		expect(extensionFromImageBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
		expect(extensionFromImageBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
		expect(extensionFromImageBytes(new TextEncoder().encode("<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>"))).toBe("svg");
	});

	it("flags transient image URLs that must not be saved directly", () => {
		expect(shouldLocalizeImageSrc("blob:tauri://localhost/example")).toBe(true);
		expect(shouldLocalizeImageSrc("data:image/png;base64,abc")).toBe(true);
		expect(shouldLocalizeImageSrc("file:///home/niklas/Pictures/example.png")).toBe(true);
		expect(shouldLocalizeImageSrc("asset://localhost/example.png")).toBe(false);
		expect(shouldLocalizeImageSrc("https://example.com/example.png")).toBe(false);
	});
});
