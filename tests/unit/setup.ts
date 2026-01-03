import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/dom";

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Mock Tauri APIs for unit tests
globalThis.__TAURI_INTERNALS__ = {
	invoke: async () => ({}),
	transformCallback: () => 0,
};
