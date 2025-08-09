import type React from "react";

interface EditorContainerProps {
	content?: string;
	onChange?: (content: string) => void;
	readOnly?: boolean;
	className?: string;
	children?: React.ReactNode;
	placeholder?: string;
	defaultView?: string;
	toolbarVisible?: boolean;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({
	content = "",
	onChange,
	readOnly = false,
	className = "",
	children,
	placeholder = "Start writing...",
	defaultView: _defaultView,
	toolbarVisible: _toolbarVisible,
}) => {
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (onChange && !readOnly) {
			onChange(e.target.value);
		}
	};

	return (
		<div className={`flex flex-col h-full ${className}`}>
			{children}
			<textarea
				value={content}
				onChange={handleChange}
				readOnly={readOnly}
				className="flex-1 w-full p-4 border-0 resize-none focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
				placeholder={placeholder}
			/>
		</div>
	);
};
