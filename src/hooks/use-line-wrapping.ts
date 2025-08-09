import { useAtom } from "jotai";
import { isWrappingAtom } from "@/atoms";

export function useLineWrapping() {
	const [isWrapping, setIsWrapping] = useAtom(isWrappingAtom);

	const toggleLineWrapping = () => {
		setIsWrapping(!isWrapping);
	};

	return {
		isWrapping,
		setIsWrapping,
		toggleLineWrapping,
	};
}
