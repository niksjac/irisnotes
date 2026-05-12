import { confirm as confirmDialog } from "@tauri-apps/plugin-dialog";

type DeleteItemType = "note" | "book" | "section";

function getItemName(itemType: DeleteItemType): string {
	if (itemType === "note") return "note";
	if (itemType === "book") return "book";
	return "section";
}

function capitalize(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getDeleteConfirmationMessage(
	itemType: DeleteItemType,
	title: string
): string {
	const itemName = getItemName(itemType);
	return `Are you sure you want to delete ${itemName} "${title}"${
		itemType !== "note" ? " and all its contents" : ""
	}?`;
}

export async function confirmDeleteItem(
	itemType: DeleteItemType,
	title: string
): Promise<boolean> {
	const itemName = getItemName(itemType);
	const message = getDeleteConfirmationMessage(itemType, title);

	try {
		return await confirmDialog(message, {
			title: `Delete ${capitalize(itemName)}`,
			kind: "warning",
			okLabel: "Delete",
			cancelLabel: "Cancel",
		});
	} catch (error) {
		console.warn("Falling back to browser confirm dialog:", error);
		return window.confirm(message);
	}
}
