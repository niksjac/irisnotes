import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface PerformanceMetrics {
	memory?: number;
	renderCount: number;
	lastRenderTime: number;
}

export const usePerformance = (componentName: string) => {
	const renderCount = useRef(0);
	const lastRenderTime = useRef(Date.now());
	const cleanupFunctions = useRef<(() => void)[]>([]);

	// Track renders
	renderCount.current += 1;
	lastRenderTime.current = Date.now();

	// Add cleanup function
	const addCleanup = useCallback((cleanup: () => void) => {
		cleanupFunctions.current.push(cleanup);
	}, []);

	// Memory monitoring (development only)
	useEffect(() => {
		// Check if we're in development mode (Vite sets this)
		const isDevelopment =
			import.meta.env?.DEV || import.meta.env?.MODE === "development";

		if (isDevelopment) {
			const logMetrics = () => {
				const metrics: PerformanceMetrics = {
					renderCount: renderCount.current,
					lastRenderTime: lastRenderTime.current,
				};

				// Add memory info if available
				if ("memory" in performance) {
					metrics.memory = (performance as any).memory?.usedJSHeapSize;
				}

				console.debug(`[Performance] ${componentName}:`, metrics);
			};

			// Log metrics every 10 seconds
			const interval = setInterval(logMetrics, 10000);

			return () => clearInterval(interval);
		}

		// Return empty cleanup function for production
		return () => {};
	}, [componentName]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			cleanupFunctions.current.forEach((cleanup) => {
				try {
					cleanup();
				} catch (error) {
					console.warn(`Cleanup error in ${componentName}:`, error);
				}
			});
			cleanupFunctions.current = [];
		};
	}, [componentName]);

	return {
		addCleanup,
		renderCount: renderCount.current,
		getMetrics: useCallback(
			() => ({
				renderCount: renderCount.current,
				lastRenderTime: lastRenderTime.current,
				memory:
					"memory" in performance
						? (performance as any).memory?.usedJSHeapSize
						: undefined,
			}),
			[]
		),
	};
};

// Debounce hook with better cleanup
export const useDebounce = <T extends (...args: any[]) => any>(
	callback: T,
	delay: number
): T & { cancel: () => void } => {
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const callbackRef = useRef(callback);

	// Keep callback ref current
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	const debouncedCallback = useCallback(
		((...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callbackRef.current(...args);
			}, delay);
		}) as T & { cancel: () => void },
		[]
	);

	// Add cancel method
	debouncedCallback.cancel = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return debouncedCallback;
};

// Memoized async operation hook
export const useAsyncMemo = <T>(
	factory: () => Promise<T>,
	deps: React.DependencyList,
	initialValue: T
): [T, boolean, Error | null] => {
	const [state, setState] = useState<{
		value: T;
		loading: boolean;
		error: Error | null;
	}>({
		value: initialValue,
		loading: false,
		error: null,
	});

	useEffect(() => {
		let cancelled = false;

		setState((prev) => ({ ...prev, loading: true, error: null }));

		factory()
			.then((value) => {
				if (!cancelled) {
					setState({ value, loading: false, error: null });
				}
			})
			.catch((error) => {
				if (!cancelled) {
					setState((prev) => ({ ...prev, loading: false, error }));
				}
			});

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [factory, ...deps]);

	return [state.value, state.loading, state.error];
};
