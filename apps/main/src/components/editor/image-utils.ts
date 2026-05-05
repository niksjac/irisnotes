/**
 * Image utilities for the ProseMirror editor.
 *
 * Images are saved to the `assets/` directory (alongside the DB) and
 * referenced via the custom `asset://localhost/{filename}` protocol
 * registered in the Tauri backend.
 */
import { invoke } from "@tauri-apps/api/core";
import type { EditorView } from "prosemirror-view";
import type { Schema } from "prosemirror-model";

export const ASSET_URL_PREFIX = "asset://localhost/";

export type ImageTextSource =
	| { kind: "asset"; src: string; alt: string }
	| { kind: "file"; path: string; extension: string };

export interface ClipboardImageData {
	data: Uint8Array;
	extension: string;
}

function trimImageTextValue(value: string): string {
	let trimmed = value.trim();
	while (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'")) ||
		(trimmed.startsWith("<") && trimmed.endsWith(">"))
	) {
		trimmed = trimmed.slice(1, -1).trim();
	}
	return trimmed;
}

function startsWithBytes(data: Uint8Array, signature: readonly number[]): boolean {
	return data.length >= signature.length && signature.every((byte, index) => data[index] === byte);
}

export function extensionFromImageBytes(data: Uint8Array): string | null {
	if (startsWithBytes(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
	if (startsWithBytes(data, [0xff, 0xd8, 0xff])) return "jpg";
	if (
		startsWithBytes(data, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
		startsWithBytes(data, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
	) {
		return "gif";
	}
	if (
		data.length >= 12 &&
		startsWithBytes(data, [0x52, 0x49, 0x46, 0x46]) &&
		data[8] === 0x57 &&
		data[9] === 0x45 &&
		data[10] === 0x42 &&
		data[11] === 0x50
	) {
		return "webp";
	}
	if (startsWithBytes(data, [0x42, 0x4d])) return "bmp";
	if (startsWithBytes(data, [0x00, 0x00, 0x01, 0x00])) return "ico";

	const textPrefix = new TextDecoder().decode(data.slice(0, Math.min(data.length, 256)));
	const trimmedPrefix = textPrefix.replace(/^\uFEFF/, "").trimStart();
	if (trimmedPrefix.startsWith("<svg") || (trimmedPrefix.startsWith("<?xml") && trimmedPrefix.includes("<svg"))) {
		return "svg";
	}

	return null;
}

export function assetFilenameFromUrl(src: string): string | null {
	const trimmedSrc = src.trim();
	if (!trimmedSrc.startsWith(ASSET_URL_PREFIX)) return null;

	let filename: string;
	try {
		filename = decodeURIComponent(trimmedSrc.slice(ASSET_URL_PREFIX.length));
	} catch {
		return null;
	}
	if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
		return null;
	}
	return filename;
}

export function normalizeAssetImageUrl(src: string): string | null {
	const filename = assetFilenameFromUrl(src);
	return filename ? `${ASSET_URL_PREFIX}${encodeURIComponent(filename)}` : null;
}

export function shouldLocalizeImageSrc(src: string): boolean {
	const trimmedSrc = src.trim();
	if (!trimmedSrc || normalizeAssetImageUrl(trimmedSrc)) return false;
	if (/^blob:/i.test(trimmedSrc)) return true;
	if (/^data:image\//i.test(trimmedSrc)) return true;
	if (/^file:\/\//i.test(trimmedSrc)) return true;

	const localPath = localFilePathFromText(trimmedSrc);
	return !!localPath && !!extensionFromFilename(localPath);
}

export function localFilePathFromText(value: string): string | null {
	const trimmed = trimImageTextValue(value);
	if (!trimmed) return null;

	if (/^file:/i.test(trimmed)) {
		try {
			const url = new URL(trimmed);
			if (url.protocol !== "file:") return null;
			if (url.hostname && url.hostname !== "localhost") return null;
			return decodeURIComponent(url.pathname);
		} catch {
			return null;
		}
	}

	return trimmed.startsWith("/") ? trimmed : null;
}

export function parseImageSourcesFromText(text: string): ImageTextSource[] {
	const sources: ImageTextSource[] = [];
	const lines = text
		.split(/\r?\n/)
		.map(trimImageTextValue)
		.filter((line) => line && !line.startsWith("#") && line !== "copy" && line !== "cut");

	for (const line of lines) {
		const assetSrc = normalizeAssetImageUrl(line);
		if (assetSrc) {
			const filename = assetFilenameFromUrl(assetSrc);
			if (filename) sources.push({ kind: "asset", src: assetSrc, alt: filename });
			continue;
		}

		const filePath = localFilePathFromText(line);
		if (!filePath) continue;

		const extension = extensionFromFilename(filePath);
		if (extension) sources.push({ kind: "file", path: filePath, extension });
	}

	return sources;
}

export function insertImageAssetUrl(
	view: EditorView,
	schema: Schema,
	src: string,
	alt?: string,
): boolean {
	const imageType = schema.nodes.image;
	if (!imageType) return false;

	const normalizedSrc = normalizeAssetImageUrl(src);
	if (!normalizedSrc) return false;

	const imageNode = imageType.create({
		src: normalizedSrc,
		alt: alt ?? assetFilenameFromUrl(normalizedSrc),
	});
	const tr = view.state.tr.replaceSelectionWith(imageNode);
	view.dispatch(tr.scrollIntoView());
	return true;
}

/**
 * Save image data to the asset directory and insert an image node at
 * the current cursor position.
 */
export async function saveAndInsertImage(
	view: EditorView,
	schema: Schema,
	data: Uint8Array,
	extension: string,
): Promise<void> {
	const filename = await saveImageAsset(data, extension);
	insertImageAssetUrl(view, schema, `${ASSET_URL_PREFIX}${filename}`, filename);
}

export async function saveImageAsset(data: Uint8Array, extension: string): Promise<string> {
	return await invoke<string>("save_image_asset", {
		data: Array.from(data),
		extension,
	});
}

export async function readClipboardImageData(): Promise<ClipboardImageData | null> {
	const targets = await invoke<string[]>("list_clipboard_targets");
	const imageTarget = targets.find((target) => extensionFromMime(target.toLowerCase()));
	if (!imageTarget) return null;

	const extension = extensionFromMime(imageTarget.toLowerCase());
	if (!extension) return null;

	const bytes = await invoke<number[]>("read_clipboard_binary_target", { target: imageTarget });
	return { data: new Uint8Array(bytes), extension };
}

export async function saveFilePathAndInsertImage(
	view: EditorView,
	schema: Schema,
	filePath: string,
): Promise<void> {
	const extension = extensionFromFilename(filePath);
	if (!extension) throw new Error(`Not a supported image type: ${filePath}`);

	const bytes = await invoke<number[]>("read_image_file", { path: filePath });
	await saveAndInsertImage(view, schema, new Uint8Array(bytes), extension);
}

export async function insertImageTextSource(
	view: EditorView,
	schema: Schema,
	source: ImageTextSource,
): Promise<void> {
	if (source.kind === "asset") {
		insertImageAssetUrl(view, schema, source.src, source.alt);
		return;
	}

	await saveFilePathAndInsertImage(view, schema, source.path);
}

async function saveDataUrlImage(src: string): Promise<string | null> {
	const mimeMatch = /^data:([^;,]+)[;,]/i.exec(src);
	const mime = mimeMatch?.[1]?.toLowerCase();
	if (!mime?.startsWith("image/")) return null;

	const response = await fetch(src);
	const blob = await response.blob();
	const extension = extensionFromMime(blob.type || mime);
	if (!extension) return null;

	const buffer = await blob.arrayBuffer();
	const filename = await saveImageAsset(new Uint8Array(buffer), extension);
	return `${ASSET_URL_PREFIX}${filename}`;
}

async function saveBlobUrlImage(src: string): Promise<string | null> {
	if (!/^blob:/i.test(src)) return null;

	const response = await fetch(src);
	const blob = await response.blob();
	const buffer = await blob.arrayBuffer();
	const data = new Uint8Array(buffer);
	const extension = extensionFromMime(blob.type) ?? extensionFromImageBytes(data);
	if (!extension) return null;

	const filename = await saveImageAsset(data, extension);
	return `${ASSET_URL_PREFIX}${filename}`;
}

async function saveFileUrlImage(src: string): Promise<string | null> {
	let filePath: string;
	try {
		filePath = decodeURIComponent(new URL(src).pathname);
	} catch {
		return null;
	}

	const extension = extensionFromFilename(filePath);
	if (!extension) return null;

	const bytes = await invoke<number[]>("read_image_file", { path: filePath });
	const filename = await saveImageAsset(new Uint8Array(bytes), extension);
	return `${ASSET_URL_PREFIX}${filename}`;
}

async function saveRemoteUrlImage(src: string): Promise<string | null> {
	if (!/^https?:\/\//i.test(src)) return null;
	const filename = await invoke<string>("import_remote_image_asset", { url: src });
	return `${ASSET_URL_PREFIX}${filename}`;
}

export async function importImageSrcToAsset(src: string): Promise<string | null> {
	const trimmedSrc = src.trim();
	if (!trimmedSrc) return null;

	const assetSrc = normalizeAssetImageUrl(trimmedSrc);
	if (assetSrc) return assetSrc;

	const localPath = localFilePathFromText(trimmedSrc);
	if (localPath) {
		const extension = extensionFromFilename(localPath);
		if (!extension) return null;

		const bytes = await invoke<number[]>("read_image_file", { path: localPath });
		const filename = await saveImageAsset(new Uint8Array(bytes), extension);
		return `${ASSET_URL_PREFIX}${filename}`;
	}

	if (/^data:image\//i.test(trimmedSrc)) {
		return await saveDataUrlImage(trimmedSrc);
	}

	if (/^blob:/i.test(trimmedSrc)) {
		return await saveBlobUrlImage(trimmedSrc);
	}

	if (/^file:\/\//i.test(trimmedSrc)) {
		return await saveFileUrlImage(trimmedSrc);
	}

	return await saveRemoteUrlImage(trimmedSrc);
}

export async function localizeImagesInHtml(
	html: string,
): Promise<{ html: string; importedCount: number; failedCount: number }> {
	const container = document.createElement("div");
	container.innerHTML = html;

	const imageElements = Array.from(
		container.querySelectorAll<HTMLImageElement>("img[src]"),
	);
	let importedCount = 0;
	let failedCount = 0;

	await Promise.all(
		imageElements.map(async (imageElement) => {
			const src = imageElement.getAttribute("src");
			if (!src) return;

			try {
				const assetSrc = await importImageSrcToAsset(src);
				if (!assetSrc) return;

				imageElement.setAttribute("src", assetSrc);
				const filename = assetSrc.slice(ASSET_URL_PREFIX.length);
				if (!imageElement.getAttribute("alt")) {
					imageElement.setAttribute("alt", filename);
				}
				importedCount += 1;
			} catch (error) {
				failedCount += 1;
				console.error("Failed to import pasted image:", error);
				if (/^blob:/i.test(src)) {
					imageElement.remove();
				}
			}
		}),
	);

	return { html: container.innerHTML, importedCount, failedCount };
}

/**
 * Extract extension from a MIME type.
 */
export function extensionFromMime(mime: string): string | null {
	const normalizedMime = mime.split(";")[0]?.trim().toLowerCase();
	if (!normalizedMime) return null;

	const map: Record<string, string> = {
		"image/png": "png",
		"image/jpeg": "jpeg",
		"image/jpg": "jpg",
		"image/gif": "gif",
		"image/webp": "webp",
		"image/svg+xml": "svg",
		"image/bmp": "bmp",
		"image/x-icon": "ico",
		"image/vnd.microsoft.icon": "ico",
	};
	return map[normalizedMime] ?? null;
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"]);

/**
 * Extract a known image extension from a filename.
 * Returns null if the file is not a recognised image type.
 */
export function extensionFromFilename(name: string): string | null {
	const ext = name.split(".").pop()?.toLowerCase();
	if (ext && IMAGE_EXTENSIONS.has(ext)) return ext;
	return null;
}
