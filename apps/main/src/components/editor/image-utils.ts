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

const ASSET_URL_PREFIX = "asset://localhost/";

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

	const imageType = schema.nodes.image;
	if (!imageType) return;

	const src = `${ASSET_URL_PREFIX}${filename}`;
	const imageNode = imageType.create({ src, alt: filename });
	const tr = view.state.tr.replaceSelectionWith(imageNode);
	view.dispatch(tr.scrollIntoView());
}

export async function saveImageAsset(data: Uint8Array, extension: string): Promise<string> {
	return await invoke<string>("save_image_asset", {
		data: Array.from(data),
		extension,
	});
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
	if (!trimmedSrc || trimmedSrc.startsWith(ASSET_URL_PREFIX)) return null;

	if (/^data:image\//i.test(trimmedSrc)) {
		return await saveDataUrlImage(trimmedSrc);
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
			}
		}),
	);

	return { html: container.innerHTML, importedCount, failedCount };
}

/**
 * Extract extension from a MIME type.
 */
export function extensionFromMime(mime: string): string | null {
	const map: Record<string, string> = {
		"image/png": "png",
		"image/jpeg": "jpeg",
		"image/gif": "gif",
		"image/webp": "webp",
		"image/svg+xml": "svg",
		"image/bmp": "bmp",
		"image/x-icon": "ico",
	};
	return map[mime] ?? null;
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
