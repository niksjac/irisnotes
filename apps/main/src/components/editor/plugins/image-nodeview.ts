/**
 * Image NodeView with resize handles.
 *
 * Wraps each image in a <span> container with a draggable handle on the
 * bottom-right corner. Dragging the handle resizes the image and persists
 * the width back into the ProseMirror document as a `width` attribute.
 */
import type { Node as PMNode } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";

export class ImageNodeView implements NodeView {
	dom: HTMLSpanElement;
	img: HTMLImageElement;
	handle: HTMLSpanElement;
	private view: EditorView;
	private getPos: () => number | undefined;
	private dragging: { startX: number; startWidth: number } | null = null;

	constructor(node: PMNode, view: EditorView, getPos: () => number | undefined) {
		this.view = view;
		this.getPos = getPos;

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

		// Resize handle
		this.handle = document.createElement("span");
		this.handle.classList.add("pm-image-resize-handle");
		this.handle.contentEditable = "false";

		this.dom.appendChild(this.img);
		this.dom.appendChild(this.handle);

		// --- Pointer events on the handle ---
		this.handle.addEventListener("mousedown", this.onMouseDown);
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
