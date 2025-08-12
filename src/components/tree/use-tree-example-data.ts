import { useState, useCallback } from "react";
import type { TreeData } from "@/types";

interface UseTreeExampleDataResult {
	treeData: TreeData[];
	isLoading: boolean;
	error: string | null;
	updateNodeName: (id: string, newName: string) => void;
	moveNode: (nodeId: string, newParentId: string | null) => void;
}

// Generate realistic example data for tree development
function generateExampleTreeData(): TreeData[] {
	return [
		{
			id: "cat-1",
			name: "📚 Learning",
			type: "category",
			children: [
				{
					id: "cat-1-1",
					name: "Programming",
					type: "category",
					children: [
						{ id: "note-1", name: "React Best Practices", type: "note" },
						{ id: "note-2", name: "TypeScript Tips", type: "note" },
						{ id: "note-3", name: "CSS Grid Layout", type: "note" },
					],
				},
				{
					id: "cat-1-2",
					name: "Design",
					type: "category",
					children: [
						{ id: "note-4", name: "Color Theory", type: "note" },
						{ id: "note-5", name: "Typography Rules", type: "note" },
					],
				},
				{ id: "note-6", name: "Learning Techniques", type: "note" },
			],
		},
		{
			id: "cat-2",
			name: "🏢 Work",
			type: "category",
			children: [
				{
					id: "cat-2-1",
					name: "Meetings",
					type: "category",
					children: [
						{ id: "note-7", name: "Sprint Planning 2024-01-15", type: "note" },
						{ id: "note-8", name: "Team Retrospective", type: "note" },
					],
				},
				{ id: "note-9", name: "Project Ideas", type: "note" },
				{ id: "note-10", name: "Performance Review Notes", type: "note" },
			],
		},
		{
			id: "cat-3",
			name: "🌟 Personal",
			type: "category",
			children: [
				{ id: "note-11", name: "Book Recommendations", type: "note" },
				{ id: "note-12", name: "Travel Plans", type: "note" },
				{ id: "note-13", name: "Recipes to Try", type: "note" },
			],
		},
		// Root level notes (no category)
		{ id: "note-14", name: "Quick Notes", type: "note" },
		{ id: "note-15", name: "Random Thoughts", type: "note" },
		{ id: "note-16", name: "Inbox", type: "note" },
	];
}

export function useTreeExampleData(): UseTreeExampleDataResult {
	const [treeData, setTreeData] = useState<TreeData[]>(generateExampleTreeData);
	const [isLoading] = useState(false);
	const [error] = useState<string | null>(null);

	// Helper function to find and update a node by ID recursively
	const findAndUpdateNode = useCallback(
		(nodes: TreeData[], targetId: string, updateFn: (node: TreeData) => TreeData): TreeData[] => {
			return nodes.map((node) => {
				if (node.id === targetId) {
					return updateFn(node);
				}
				if (node.children) {
					return {
						...node,
						children: findAndUpdateNode(node.children, targetId, updateFn),
					};
				}
				return node;
			});
		},
		[]
	);

	// Helper function to remove a node by ID recursively
	const removeNode = useCallback((nodes: TreeData[], targetId: string): TreeData[] => {
		return nodes
			.filter((node) => node.id !== targetId)
			.map((node) => ({
				...node,
				children: node.children ? removeNode(node.children, targetId) : undefined,
			}));
	}, []);

	// Helper function to add a node to a parent
	const addNodeToParent = useCallback(
		(nodes: TreeData[], parentId: string | null, nodeToAdd: TreeData): TreeData[] => {
			if (parentId === null) {
				// Add to root level
				return [...nodes, nodeToAdd];
			}

			return findAndUpdateNode(nodes, parentId, (parent) => ({
				...parent,
				children: [...(parent.children || []), nodeToAdd],
			}));
		},
		[findAndUpdateNode]
	);

	const updateNodeName = useCallback(
		(id: string, newName: string) => {
			setTreeData((prevData) =>
				findAndUpdateNode(prevData, id, (node) => ({
					...node,
					name: newName,
				}))
			);
		},
		[findAndUpdateNode]
	);

	// Helper to find a node in the tree
	const findNode = useCallback((nodes: TreeData[], targetId: string): TreeData | null => {
		for (const node of nodes) {
			if (node.id === targetId) {
				return node;
			}
			if (node.children) {
				const found = findNode(node.children, targetId);
				if (found) return found;
			}
		}
		return null;
	}, []);

	const moveNode = useCallback(
		(nodeId: string, newParentId: string | null) => {
			setTreeData((prevData) => {
				// Find the node to move
				const nodeToMove = findNode(prevData, nodeId);
				if (!nodeToMove) return prevData;

				// Remove the node from its current position
				const dataWithoutNode = removeNode(prevData, nodeId);

				// Add it to the new parent
				return addNodeToParent(dataWithoutNode, newParentId, nodeToMove);
			});
		},
		[findNode, removeNode, addNodeToParent]
	);

	return {
		treeData,
		isLoading,
		error,
		updateNodeName,
		moveNode,
	};
}
