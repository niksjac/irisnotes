/**
 * Details (collapsible block) NodeView
 *
 * Renders a <details> element. The PM schema enforces that the first
 * child is a details_summary (which serializes as <summary>), followed
 * by one or more block nodes. ProseMirror renders all children into
 * contentDOM which IS the <details> element.
 *
 * The NodeView intercepts the native "toggle" event to sync the open
 * attribute back into the ProseMirror document.
 */
import type { Node as PMNode } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";

export class DetailsNodeView implements NodeView {
	dom: HTMLDetailsElement;
	contentDOM: HTMLDetailsElement;
	private view: EditorView;
	private getPos: () => number | undefined;

	constructor(node: PMNode, view: EditorView, getPos: () => number | undefined) {
		this.view = view;
		this.getPos = getPos;

		this.dom = document.createElement("details");
		if (node.attrs.open) {
			this.dom.setAttribute("open", "");
		}

		// ProseMirror renders child nodes (summary + body) directly inside <details>
		this.contentDOM = this.dom;

		// Intercept native toggle so we can sync with PM state
		this.dom.addEventListener("toggle", () => {
			const pos = this.getPos();
			if (pos === undefined) return;
			const isOpen = this.dom.open;
			// Only dispatch if the PM attr is out of sync
			const currentNode = this.view.state.doc.nodeAt(pos);
			if (currentNode && currentNode.attrs.open !== isOpen) {
				const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
					...currentNode.attrs,
					open: isOpen,
				});
				this.view.dispatch(tr);
			}
		});
	}

	update(node: PMNode): boolean {
		if (node.type.name !== "details") return false;
		// Sync the open attribute
		if (node.attrs.open) {
			this.dom.setAttribute("open", "");
		} else {
			this.dom.removeAttribute("open");
		}
		return true;
	}

	ignoreMutation(mutation: { type: string; attributeName?: string | null }): boolean {
		// Ignore the native open attribute toggle — we handle it ourselves
		if (mutation.type === "attributes" && mutation.attributeName === "open") {
			return true;
		}
		return false;
	}
}
