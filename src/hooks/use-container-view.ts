import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { itemsAtom } from "@/atoms/items";
import type { FlexibleItem } from "@/types/items";
import { compareSortOrder } from "@/utils/sort-order";

export interface ContainerItem {
	id: string;
	title: string;
	type: "note" | "book" | "section";
	created_at: string;
	updated_at: string;
	wordCount: number;
}

/**
 * Calculates word count from content
 * Tries plaintext first, falls back to raw content with basic cleanup
 */
const calculateWordCount = (
	plaintext?: string | null,
	rawContent?: string | null,
): number => {
	// Prefer plaintext if available
	const content = plaintext || rawContent || "";
	if (!content) return 0;
	// Strip common HTML tags and markdown syntax for rough word count
	const cleaned = content
		.replace(/<[^>]*>/g, " ") // Remove HTML tags
		.replace(/[#*_`[\]()]/g, "") // Remove markdown syntax
		.trim();
	return cleaned.split(/\s+/).filter(Boolean).length;
};

/**
 * Formats a date string for display
 */
export const formatDate = (dateString: string): string => {
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	} catch {
		return dateString;
	}
};

/**
 * Hook for container views (section/book) that provides
 * child items with computed properties
 */
export const useContainerView = (containerId: string | undefined) => {
	const items = useAtomValue(itemsAtom);

	const container = useMemo(() => {
		if (!containerId) return null;
		return items.find((item) => item.id === containerId) ?? null;
	}, [items, containerId]);

	const children = useMemo((): ContainerItem[] => {
		if (!containerId) return [];

		return items
			.filter((item) => item.parent_id === containerId)
			.sort((a, b) => compareSortOrder(a.sort_order, b.sort_order))
			.map((item) => ({
				id: item.id,
				title: item.title,
				type: item.type,
				created_at: item.created_at,
				updated_at: item.updated_at,
				wordCount: calculateWordCount(item.content_plaintext, item.content),
			}));
	}, [items, containerId]);

	/**
	 * Gets all descendants recursively (for book view)
	 */
	const getAllDescendants = useMemo(() => {
		if (!containerId) return [];

		const result: ContainerItem[] = [];

		const collectDescendants = (parentId: string, depth: number) => {
			const directChildren = items
				.filter((item) => item.parent_id === parentId)
				.sort((a, b) => compareSortOrder(a.sort_order, b.sort_order));

			for (const child of directChildren) {
				result.push({
					id: child.id,
					title: child.title,
					type: child.type,
					created_at: child.created_at,
					updated_at: child.updated_at,
					wordCount: calculateWordCount(child.content_plaintext, child.content),
				});

				// Recursively collect children of sections
				if (child.type === "section") {
					collectDescendants(child.id, depth + 1);
				}
			}
		};

		collectDescendants(containerId, 0);
		return result;
	}, [items, containerId]);

	/**
	 * Groups children by section (for book view)
	 */
	const childrenBySection = useMemo(() => {
		if (!containerId) return new Map<string | null, ContainerItem[]>();

		const grouped = new Map<string | null, ContainerItem[]>();
		const directChildren = items
			.filter((item) => item.parent_id === containerId)
			.sort((a, b) => compareSortOrder(a.sort_order, b.sort_order));

		// Direct children of the book (root level)
		const rootItems: ContainerItem[] = [];
		const sections: FlexibleItem[] = [];

		for (const child of directChildren) {
			if (child.type === "section") {
				sections.push(child);
			} else {
				rootItems.push({
					id: child.id,
					title: child.title,
					type: child.type,
					created_at: child.created_at,
					updated_at: child.updated_at,
					wordCount: calculateWordCount(child.content_plaintext, child.content),
				});
			}
		}

		if (rootItems.length > 0) {
			grouped.set(null, rootItems);
		}

		// Items under each section
		for (const section of sections) {
			const sectionItems = items
				.filter((item) => item.parent_id === section.id)
				.sort((a, b) => compareSortOrder(a.sort_order, b.sort_order))
				.map((item) => ({
					id: item.id,
					title: item.title,
					type: item.type,
					created_at: item.created_at,
					updated_at: item.updated_at,
					wordCount: calculateWordCount(item.content_plaintext, item.content),
				}));

			grouped.set(section.id, sectionItems);
		}

		return grouped;
	}, [items, containerId]);

	/**
	 * Gets section info by ID
	 */
	const getSection = (sectionId: string): FlexibleItem | undefined => {
		return items.find((item) => item.id === sectionId);
	};

	/**
	 * Gets direct child sections (for book view headers)
	 */
	const sections = useMemo(() => {
		if (!containerId) return [];
		return items
			.filter(
				(item) => item.parent_id === containerId && item.type === "section",
			)
			.sort((a, b) => compareSortOrder(a.sort_order, b.sort_order));
	}, [items, containerId]);

	return {
		container,
		children,
		sections,
		childrenBySection,
		getAllDescendants,
		getSection,
	};
};
