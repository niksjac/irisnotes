import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NoteTitleBar } from "@/components/editor/note-title-bar";

function getTitleInput() {
	return screen.getByPlaceholderText("Untitled Note") as HTMLInputElement;
}

describe("NoteTitleBar", () => {
	it("allows the draft title to become empty before committing", () => {
		const onTitleChange = vi.fn();
		render(
			<NoteTitleBar
				noteId="note-1"
				title="Current name"
				onTitleChange={onTitleChange}
			/>
		);

		const input = getTitleInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "" } });

		expect(input.value).toBe("");
		expect(onTitleChange).not.toHaveBeenCalled();
	});

	it("commits an empty title on blur", () => {
		const onTitleChange = vi.fn();
		render(
			<NoteTitleBar
				noteId="note-1"
				title="Current name"
				onTitleChange={onTitleChange}
			/>
		);

		const input = getTitleInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "" } });
		fireEvent.blur(input);

		expect(onTitleChange).toHaveBeenCalledTimes(1);
		expect(onTitleChange).toHaveBeenCalledWith("note-1", "");
	});

	it("restores the committed title on Escape without committing", () => {
		const onTitleChange = vi.fn();
		const onFocusEditor = vi.fn();
		render(
			<NoteTitleBar
				noteId="note-1"
				title="Current name"
				onTitleChange={onTitleChange}
				onFocusEditor={onFocusEditor}
			/>
		);

		const input = getTitleInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "" } });
		fireEvent.keyDown(input, { key: "Escape" });

		expect(input.value).toBe("Current name");
		expect(onTitleChange).not.toHaveBeenCalled();
		expect(onFocusEditor).toHaveBeenCalledTimes(1);
	});

	it("commits on Enter and returns focus to the editor", () => {
		const onTitleChange = vi.fn();
		const onFocusEditor = vi.fn();
		render(
			<NoteTitleBar
				noteId="note-1"
				title="Current name"
				onTitleChange={onTitleChange}
				onFocusEditor={onFocusEditor}
			/>
		);

		const input = getTitleInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "Renamed" } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(onTitleChange).toHaveBeenCalledTimes(1);
		expect(onTitleChange).toHaveBeenCalledWith("note-1", "Renamed");
		expect(onFocusEditor).toHaveBeenCalledTimes(1);
	});

	it("does not overwrite a focused draft when the title prop refreshes", () => {
		const onTitleChange = vi.fn();
		const { rerender } = render(
			<NoteTitleBar
				noteId="note-1"
				title="Current name"
				onTitleChange={onTitleChange}
			/>
		);

		const input = getTitleInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "Draft name" } });

		rerender(
			<NoteTitleBar
				noteId="note-1"
				title="External refresh"
				onTitleChange={onTitleChange}
			/>
		);

		expect(input.value).toBe("Draft name");
	});
});
