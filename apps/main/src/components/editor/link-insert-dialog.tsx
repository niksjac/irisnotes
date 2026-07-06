import { useState, useEffect, useRef } from "react";

interface LinkInsertDialogProps {
	initialHref: string;
	initialText: string;
	/** True when editing an existing link (enables the Remove button). */
	editing: boolean;
	onSubmit: (href: string, text: string) => void;
	onRemove: () => void;
	onClose: () => void;
}

export function LinkInsertDialog({
	initialHref,
	initialText,
	editing,
	onSubmit,
	onRemove,
	onClose,
}: LinkInsertDialogProps) {
	const [href, setHref] = useState(initialHref);
	const [text, setText] = useState(initialText);
	const hrefRef = useRef<HTMLInputElement>(null);
	const textRef = useRef<HTMLInputElement>(null);

	// Focus the field most likely to need input: the URL when it's empty
	// (fresh link with text pre-filled), otherwise the display text.
	useEffect(() => {
		const target = initialHref ? textRef.current : hrefRef.current;
		target?.focus();
		target?.select();
	}, [initialHref]);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				onClose();
			}
		};
		document.addEventListener("keydown", handleKey, true);
		return () => document.removeEventListener("keydown", handleKey, true);
	}, [onClose]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!href.trim()) {
			hrefRef.current?.focus();
			return;
		}
		onSubmit(href.trim(), text);
	};

	const inputClass =
		"px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";

	return (
		<div
			className="absolute inset-0 flex items-center justify-center z-50"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<form
				onSubmit={handleSubmit}
				className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4 flex flex-col gap-3 min-w-[360px]"
			>
				<div className="text-sm font-medium text-gray-700 dark:text-gray-200">
					{editing ? "Edit Link" : "Insert Link"}
				</div>
				<label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
					URL
					<input
						ref={hrefRef}
						type="text"
						value={href}
						onChange={(e) => setHref(e.target.value)}
						placeholder="https://example.com/…"
						spellCheck={false}
						autoComplete="off"
						className={inputClass}
					/>
				</label>
				<label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
					Text
					<input
						ref={textRef}
						type="text"
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Link text"
						className={inputClass}
					/>
				</label>
				<div className="flex justify-between gap-2">
					<div>
						{editing && (
							<button
								type="button"
								onClick={onRemove}
								className="px-3 py-1 text-xs rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
							>
								Remove
							</button>
						)}
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={onClose}
							className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
						>
							{editing ? "Update" : "Insert"}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
