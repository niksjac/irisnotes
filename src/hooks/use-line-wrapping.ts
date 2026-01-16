import { useConfig } from "./use-config";

export function useLineWrapping() {
	const { config, updateConfig } = useConfig();

	const isWrapping = config?.editor?.lineWrapping ?? false;

	const toggleLineWrapping = async () => {
		const newValue = !isWrapping;
		await updateConfig({
			editor: {
				...config.editor,
				lineWrapping: newValue,
			},
		});
	};

	const setIsWrapping = async (value: boolean) => {
		await updateConfig({
			editor: {
				...config.editor,
				lineWrapping: value,
			},
		});
	};

	return {
		isWrapping,
		setIsWrapping,
		toggleLineWrapping,
	};
}
