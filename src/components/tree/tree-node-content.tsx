import { TreeNodeIcon } from "./tree-node-icon";
import { TreeNodeEditor } from "./tree-node-editor";
import type { TreeNodeContentProps } from "./types";

export function TreeNodeContent({
	name,
	isFolder,
	isExpanded,
	isCategory,
	isEditing,
	onSubmit,
	onCancel,
}: TreeNodeContentProps) {
	return (
		<>
			<TreeNodeIcon isFolder={isFolder} isExpanded={isExpanded} isCategory={isCategory} />

			{isEditing ? (
				<TreeNodeEditor initialValue={name} onSubmit={onSubmit || (() => {})} onCancel={onCancel || (() => {})} />
			) : (
				<span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-100">{name}</span>
			)}
		</>
	);
}
