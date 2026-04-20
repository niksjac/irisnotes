import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type FC } from "react";
import { BookOpen } from "lucide-react";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (title: string) => void;
}

export const NewBookDialog: FC<Props> = ({ isOpen, onClose, onCreate }) => {
	const [title, setTitle] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);

	// Focus on open
	useEffect(() => {
		if (isOpen) {
			setTitle("");
			setTimeout(() => {
				inputRef.current?.focus();
			}, 0);
		}
	}, [isOpen]);

	// Click outside to close
	useEffect(() => {
		if (!isOpen) return;
		const handleMouseDown = (e: MouseEvent) => {
			if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		const id = setTimeout(() => document.addEventListener("mousedown", handleMouseDown), 0);
		return () => {
			clearTimeout(id);
			document.removeEventListener("mousedown", handleMouseDown);
		};
	}, [isOpen, onClose]);

	const handleConfirm = () => {
		onCreate(title.trim() || "Untitled Book");
		onClose();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleConfirm();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	};

	if (!isOpen) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/40">
			<div
				ref={dialogRef}
				className="w-full max-w-[480px] bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-300 dark:border-gray-600 overflow-hidden"
			>
				{/* Header */}
				<div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
					<BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
					<span className="text-sm font-medium text-gray-700 dark:text-gray-200">
						New Book
					</span>
				</div>

				{/* Input */}
				<div className="px-3 py-2.5">
					<input
						ref={inputRef}
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Untitled Book"
						className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
					/>
				</div>

				{/* Footer */}
				<div className="flex justify-end gap-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
					<button
						onClick={onClose}
						className="px-3 py-1 text-xs rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleConfirm}
						className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
					>
						Create
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
};
