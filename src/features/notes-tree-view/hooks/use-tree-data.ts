import { useMemo } from 'react';
import type { Category, Note } from '../../../types/database';
import type { TreeNode } from '../types';

export function useTreeData(
	notes: Note[],
	categories: Category[],
	noteCategories: { noteId: string; categoryId: string }[]
) {
	const noteCategoryMap = useMemo(() => {
		const map = new Map<string, string[]>();
		noteCategories.forEach(nc => {
			const existing = map.get(nc.noteId) || [];
			existing.push(nc.categoryId);
			map.set(nc.noteId, existing);
		});
		return map;
	}, [noteCategories]);

	const baseTreeData = useMemo(() => {
		const rootNodes: TreeNode[] = [];
		const placedNotes = new Set<string>();

		const workingCategoryMap = new Map<string, TreeNode>();
		categories.forEach(category => {
			const categoryNode: TreeNode = {
				id: category.id,
				name: category.name,
				type: 'category',
				data: category,
				parent: category.parent_id || null,
				children: [],
			};
			workingCategoryMap.set(category.id, categoryNode);
		});

		categories.forEach(category => {
			const categoryNode = workingCategoryMap.get(category.id);
			if (categoryNode) {
				if (category.parent_id) {
					const parentNode = workingCategoryMap.get(category.parent_id);
					if (parentNode) {
						parentNode.children!.push(categoryNode);
					} else {
						rootNodes.push(categoryNode);
					}
				} else {
					rootNodes.push(categoryNode);
				}
			}
		});

		notes.forEach(note => {
			const noteNode: TreeNode = {
				id: note.id,
				name: note.title,
				type: 'note',
				data: note,
				children: [],
			};

			const noteCategoryIds = noteCategoryMap.get(note.id) || [];

			if (noteCategoryIds.length > 0) {
				noteCategoryIds.forEach(categoryId => {
					const categoryNode = workingCategoryMap.get(categoryId);
					if (categoryNode) {
						categoryNode.children!.push({ ...noteNode });
						placedNotes.add(note.id);
					}
				});
			}
		});

		notes.forEach(note => {
			if (!placedNotes.has(note.id)) {
				const noteNode: TreeNode = {
					id: note.id,
					name: note.title,
					type: 'note',
					data: note,
					children: [],
				};
				rootNodes.push(noteNode);
			}
		});

		return rootNodes;
	}, [notes, categories, noteCategoryMap]);

	return baseTreeData;
}
