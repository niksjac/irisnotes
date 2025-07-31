import '@testing-library/jest-dom';

// Extend Vitest's expect with jest-dom matchers
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';

expect.extend(matchers);

// Clean up after each test
afterEach(() => {
	cleanup();
});

// Mock IntersectionObserver which might not be available in jsdom
beforeAll(() => {
	global.IntersectionObserver = class IntersectionObserver {
		root: Element | Document | null = null;
		rootMargin: string = '0px';
		thresholds: ReadonlyArray<number> = [];

		constructor(
			public callback: IntersectionObserverCallback,
			public options?: IntersectionObserverInit
		) {
			this.root = options?.root ?? null;
			this.rootMargin = options?.rootMargin ?? '0px';
			this.thresholds = options?.threshold
				? Array.isArray(options.threshold)
					? options.threshold
					: [options.threshold]
				: [0];
		}

		disconnect() {}
		observe() {}
		unobserve() {}
		takeRecords(): IntersectionObserverEntry[] {
			return [];
		}
	};

	// Mock ResizeObserver
	global.ResizeObserver = class ResizeObserver {
		constructor() {}
		disconnect() {}
		observe() {}
		unobserve() {}
	};

	// Mock window.matchMedia
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => {},
		}),
	});
});

afterAll(() => {
	// Clean up mocks if needed
});
