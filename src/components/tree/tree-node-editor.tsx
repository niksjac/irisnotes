import { useState, useRef, useEffect } from "react";
import type { TreeNodeEditorProps } from "./types";

export function TreeNodeEditor({ initialValue, onSubmit, onCancel }: TreeNodeEditorProps) {
	const [editValue, setEditValue] = useState(initialValue);
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus input when component mounts
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, []);

	// Reset edit value when initial value changes
	useEffect(() => {
		setEditValue(initialValue);
	}, [initialValue]);

	const handleSubmit = () => {
		if (editValue.trim()) {
			onSubmit(editValue.trim());
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCancel();
			setEditValue(initialValue);
		}
	};

	const handleBlur = () => {
		handleSubmit();
	};

	return (
		<input
			ref={inputRef}
			type="text"
			value={editValue}
			onChange={(e) => setEditValue(e.target.value)}
			onKeyDown={handleKeyDown}
			onBlur={handleBlur}
			className="flex-1 px-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-blue-500 rounded outline-none"
		/>
	);
}
