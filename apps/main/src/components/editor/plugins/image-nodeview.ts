/**
 * Image NodeView with resize handles.
 *
 * Wraps each image in a <span> container with a draggable handle on the
 * bottom-right corner. Dragging the handle resizes the image and persists
 * the width back into the ProseMirror document as a `width` attribute.
 *
 * When the image is selected (ProseMirror-selectednode), shows an info bar
 * with the asset filename and a button to open the assets directory.
 */
import type { Node as PMNode } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";
import { invoke } from "@tauri-apps/api/core";

export class ImageNodeView implements NodeView {
	dom: HTMLSpanElement;
	img: HTMLImageElement;
	handle: HTMLSpanElement;
	infoBar: HTMLDivElement;
	private view: EditorView;
	private getPos: () => number | undefined;
	private dragging: { startX: number; startWidth: number } | null = null;
	private currentSrc: string;

	constructor(node: PMNode, view: EditorView, getPos: () => number | undefined) {
		this.view = view;
		this.getPos = getPos;
		this.currentSrc = node.attrs.src || "";

		// Outer wrapper (inline)
		this.dom = document.createElement("span");
		this.dom.classList.add("pm-image-wrap");
		this.dom.style.display = "inline-block";
		this.dom.style.position = "relative";
		this.dom.style.lineHeight = "0";

		// The actual <img>
		this.img = document.createElement("img");
		this.img.src = node.attrs.src;
		if (node.attrs.alt) this.img.alt = node.attrs.alt;
		if (node.attrs.title) this.img.title = node.attrs.title;
		if (node.attrs.width) this.img.style.width = node.attrs.width;
		this.img.style.display = "block";
		this.img.style.maxWidth = "100%";
		this.img.draggable = false; // prevent native drag which conflicts

		// Apply display mode
		if (node.attrs.display === "cover") {
			this.dom.classList.add("pm-image-cover");
		}

		// Resize handle
		this.handle = document.createElement("span");
		this.handle.classList.add("pm-image-resize-handle");
		this.handle.contentEditable = "false";

		// Info bar (visible only when selected via CSS)
		this.infoBar = document.createElement("div");
		this.infoBar.classList.add("pm-image-info-bar");
		this.infoBar.contentEditable = "false";
		this.buildInfoBar();

		this.dom.appendChild(this.img);
		this.dom.appendChild(this.handle);
		this.dom.appendChild(this.infoBar);

		// --- Pointer events on the handle ---
		this.handle.addEventListener("mousedown", this.onMouseDown);
	}

	/** Extract a display label from an asset:// URL */
	private getDisplayLabel(): string {
		const prefix = "asset://localhost/";
		if (this.currentSrc.startsWith(prefix)) {
			const filename = this.currentSrc.slice(prefix.length);
			const dotIdx = filename.lastIndexOf(".");
			const ext = dotIdx > 0 ? filename.slice(dotIdx) : "";
			const id = dotIdx > 0 ? filename.slice(0, dotIdx) : filename;
			// Show truncated ID + extension for readability
			return id.length > 12 ? `${id.slice(0, 8)}…${ext}` : filename;
		}
		try {
			const url = new URL(this.currentSrc);
			return url.pathname.split("/").pop() || this.currentSrc;
		} catch {
			return this.currentSrc;
		}
	}

	/** Extract the raw filename from an asset:// URL */
	private getFilename(): string {
		const prefix = "asset://localhost/";
		if (this.currentSrc.startsWith(prefix)) {
			return this.currentSrc.slice(prefix.length);
		}
		return this.currentSrc;
	}

	private buildInfoBar() {
		this.infoBar.textContent = "";
		const displayLabel = this.getDisplayLabel();
		const filename = this.getFilename();

		const label = document.createElement("span");
		label.textContent = displayLabel;
		label.title = filename;
		label.style.overflow = "hidden";
		label.style.textOverflow = "ellipsis";
		label.style.whiteSpace = "nowrap";
		label.style.flex = "1";
		label.style.minWidth = "0";

		const openBtn = document.createElement("button");
		openBtn.textContent = "📂 Open";
		openBtn.title = "Reveal in file manager";
		openBtn.addEventListener("mousedown", (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
		openBtn.addEventListener("click", async (e) => {
			e.preventDefault();
			e.stopPropagation();
			try {
				await invoke("reveal_asset", { filename });
			} catch (err) {
				console.error("Failed to reveal image in file manager:", err);
			}
		});

		this.infoBar.appendChild(label);
		this.infoBar.appendChild(openBtn);
	}

	private onMouseDown = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		this.dragging = {
			startX: e.clientX,
			startWidth: this.img.offsetWidth,
		};
		document.addEventListener("mousemove", this.onMouseMove);
		document.addEventListener("mouseup", this.onMouseUp);
	};

	private onMouseMove = (e: MouseEvent) => {
		if (!this.dragging) return;
		const diff = e.clientX - this.dragging.startX;
		const newWidth = Math.max(32, this.dragging.startWidth + diff);
		this.img.style.width = `${newWidth}px`;
	};

	private onMouseUp = (e: MouseEvent) => {
		if (!this.dragging) return;
		const diff = e.clientX - this.dragging.startX;
		const newWidth = Math.max(32, this.dragging.startWidth + diff);
		this.dragging = null;
		document.removeEventListener("mousemove", this.onMouseMove);
		document.removeEventListener("mouseup", this.onMouseUp);

		// Persist the width into the PM document
		const pos = this.getPos();
		if (pos === undefined) return;
		const node = this.view.state.doc.nodeAt(pos);
		if (!node) return;
		const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
			...node.attrs,
			width: `${newWidth}px`,
		});
		this.view.dispatch(tr);
	};

	update(node: PMNode): boolean {
		if (node.type.name !== "image") return false;
		this.img.src = node.attrs.src;
		if (node.attrs.alt) this.img.alt = node.attrs.alt;
		if (node.attrs.title) this.img.title = node.attrs.title;
		if (node.attrs.width) {
			this.img.style.width = node.attrs.width;
		} else {
			this.img.style.width = "";
		}
		// Update display mode
		if (node.attrs.display === "cover") {
			this.dom.classList.add("pm-image-cover");
		} else {
			this.dom.classList.remove("pm-image-cover");
		}
		// Update info bar if src changed
		if (node.attrs.src !== this.currentSrc) {
			this.currentSrc = node.attrs.src || "";
			this.buildInfoBar();
		}
		return true;
	}

	/** Let the selection system handle this node (no contentDOM). */
	stopEvent(): boolean {
		return false;
	}

	ignoreMutation(): boolean {
		return true;
	}

	destroy() {
		this.handle.removeEventListener("mousedown", this.onMouseDown);
		document.removeEventListener("mousemove", this.onMouseMove);
		document.removeEventListener("mouseup", this.onMouseUp);
	}
}
