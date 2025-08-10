import { useCallback } from "react";
import { useNotesActions, useCategoriesActions } from "@/hooks";
import type { UseTreeRenameReturn } from "./types";

export function useTreeRename(): UseTreeRenameReturn {
	const { updateNoteTitle } = useNotesActions();
	const { renameCategory } = useCategoriesActions();

	// Handle rename operation
	const handleRename = useCallback(
		async ({ node, name }: { node: any; name: string }) => {
			console.log("Renaming:", node.data.type, "from", node.data.name, "to", name);

			if (node.data.type === "note") {
				try {
					const result = await updateNoteTitle(node.data.id, name);
					console.log("Note rename result:", result);
				} catch (error) {
					console.error("Failed to rename note:", error);
				}
			} else if (node.data.type === "category") {
				try {
					const result = await renameCategory(node.data.id, name);
					console.log("Category rename result:", result);
				} catch (error) {
					console.error("Failed to rename category:", error);
				}
			}
		},
		[updateNoteTitle, renameCategory]
	);

	return {
		handleRename,
	};
}
