import { afterEach, describe, expect, it, vi } from "vitest";
import { syncRequest } from "@/storage/sync/sync-engine";

const TARGET = "https://hub.example.ts.net:8787/sync/pull";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("syncRequest", () => {
	it("names the step and URL when the server can't be reached", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Load failed")));

		await expect(syncRequest("pull failed", TARGET)).rejects.toThrow(
			`pull failed: can't reach ${TARGET} (Load failed). Is iris-server running, and is this device on its network?`,
		);
	});

	it("says the token was rejected on HTTP 401", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 401 })));

		await expect(syncRequest("pull failed", TARGET)).rejects.toThrow(
			"pull failed: the server rejected the token (HTTP 401). It must match IRIS_TOKEN on the server.",
		);
	});

	it("reports other HTTP errors with their status", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 502 })));

		await expect(syncRequest("push failed", TARGET)).rejects.toThrow("push failed: HTTP 502");
	});

	it("returns the response when the request succeeds", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));

		const res = await syncRequest("version check failed", TARGET);
		expect(res.status).toBe(200);
	});
});
