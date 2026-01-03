import { test, expect } from "@playwright/test";

test.describe("Editor Cursor Position", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Wait for app to load
		await page.waitForSelector('[data-tree-container="true"]');
	});

	test("cursor is at end of document when opening a note", async ({ page }) => {
		// Click on a note in the tree to open it
		const noteItem = page.locator('button[role="treeitem"]').first();
		await noteItem.dblclick();

		// Wait for editor to appear
		const editor = page.locator(".ProseMirror").first();
		await expect(editor).toBeVisible();

		// Click the editor to focus it
		await editor.click();

		// Get cursor position by checking selection
		// In ProseMirror, we can check if cursor is at end by pressing End key
		// and seeing if position changes
		const initialSelection = await page.evaluate(() => {
			const editor = document.querySelector(".ProseMirror");
			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				return {
					startOffset: range.startOffset,
					endOffset: range.endOffset,
					atEnd:
						range.startContainer.textContent?.length === range.startOffset ||
						range.startContainer === editor?.lastChild,
				};
			}
			return null;
		});

		// Cursor should be at end of content
		expect(initialSelection?.atEnd).toBe(true);
	});

	test("cursor position persists after refresh", async ({ page }) => {
		// Open a note
		const noteItem = page.locator('button[role="treeitem"]').first();
		await noteItem.dblclick();

		// Wait for editor
		const editor = page.locator(".ProseMirror").first();
		await expect(editor).toBeVisible();
		await editor.click();

		// Move cursor to middle of document
		await page.keyboard.press("Control+Home"); // Go to start
		await page.keyboard.press("ArrowRight");
		await page.keyboard.press("ArrowRight");
		await page.keyboard.press("ArrowRight");

		// Note: After refresh, cursor should be at end (our intended behavior)
		await page.reload();
		await page.waitForSelector('[data-tree-container="true"]');

		// Re-open the same note
		const noteItemAfter = page.locator('button[role="treeitem"]').first();
		await noteItemAfter.dblclick();

		const editorAfter = page.locator(".ProseMirror").first();
		await expect(editorAfter).toBeVisible();
		await editorAfter.click();

		// Cursor should be at end after reload (initial state)
		const selectionAfterReload = await page.evaluate(() => {
			const editor = document.querySelector(".ProseMirror");
			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				return {
					atEnd:
						range.startContainer.textContent?.length === range.startOffset ||
						range.startContainer === editor?.lastChild,
				};
			}
			return null;
		});

		expect(selectionAfterReload?.atEnd).toBe(true);
	});

	test("typing appends to end of document", async ({ page }) => {
		// Open a note
		const noteItem = page.locator('button[role="treeitem"]').first();
		await noteItem.dblclick();

		const editor = page.locator(".ProseMirror").first();
		await expect(editor).toBeVisible();
		await editor.click();

		// Get content before typing
		const contentBefore = await editor.textContent();

		// Type some text (should append at cursor position which is at end)
		const testText = " APPENDED_TEXT";
		await page.keyboard.type(testText);

		// Content should have new text at end
		const contentAfter = await editor.textContent();
		expect(contentAfter).toContain(testText);
		expect(contentAfter?.endsWith(testText.trim())).toBe(true);
	});
});

test.describe("Tree to Editor Focus", () => {
	test("tree keeps focus when opening note with Enter", async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector('[data-tree-container="true"]');

		// Focus the tree
		const treeItem = page.locator('button[role="treeitem"]').first();
		await treeItem.focus();

		// Press Enter to open the note
		await page.keyboard.press("Enter");

		// Wait a bit for any focus stealing
		await page.waitForTimeout(100);

		// Tree item should still be focused (not the editor)
		const focusedElement = await page.evaluate(() => {
			return document.activeElement?.getAttribute("role");
		});

		expect(focusedElement).toBe("treeitem");
	});
});
