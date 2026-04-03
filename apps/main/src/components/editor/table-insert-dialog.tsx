import { useState, useEffect, useRef } from "react";

interface TableInsertDialogProps {
	onInsert: (rows: number, cols: number) => void;
	onClose: () => void;
}

export function TableInsertDialog({ onInsert, onClose }: TableInsertDialogProps) {
	const [rows, setRows] = useState(3);
	const [cols, setCols] = useState(3);
	const rowsRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		rowsRef.current?.focus();
		rowsRef.current?.select();
	}, []);

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
		const r = Math.max(1, Math.min(rows, 50));
		const c = Math.max(1, Math.min(cols, 20));
		onInsert(r, c);
	};

	return (
		<div
			className="absolute inset-0 flex items-center justify-center z-50"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<form
				onSubmit={handleSubmit}
				className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4 flex flex-col gap-3 min-w-[220px]"
			>
				<div className="text-sm font-medium text-gray-700 dark:text-gray-200">Insert Table</div>
				<div className="flex gap-3 items-center">
					<label className="text-xs text-gray-500 dark:text-gray-400">
						Rows
						<input
							ref={rowsRef}
							type="number"
							min={1}
							max={50}
							value={rows}
							onChange={(e) => setRows(Number(e.target.value))}
							className="ml-2 w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
						/>
					</label>
					<label className="text-xs text-gray-500 dark:text-gray-400">
						Cols
						<input
							type="number"
							min={1}
							max={20}
							value={cols}
							onChange={(e) => setCols(Number(e.target.value))}
							className="ml-2 w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
						/>
					</label>
				</div>
				<div className="flex justify-end gap-2">
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
						Insert
					</button>
				</div>
			</form>
		</div>
	);
}
