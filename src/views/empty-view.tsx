import type { FC } from "react";

export const EmptyView: FC = () => {
	return (
		<div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
			<div className="text-center">
				<div className="mb-4 text-6xl">📄</div>
				<p className="text-lg mb-2">Empty Tab</p>
				<p className="text-sm">This tab is ready for content</p>
				<p className="text-xs mt-4 text-gray-400 dark:text-gray-500">Press Ctrl+W to close this tab</p>
			</div>
		</div>
	);
};
