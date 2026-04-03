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
	const filename = await invoke<string>("save_image_asset", {
		data: Array.from(data),
		extension,
	});

	const imageType = schema.nodes.image;
	if (!imageType) return;

	const src = `asset://localhost/${filename}`;
	const imageNode = imageType.create({ src, alt: filename });
	const tr = view.state.tr.replaceSelectionWith(imageNode);
	view.dispatch(tr.scrollIntoView());
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
