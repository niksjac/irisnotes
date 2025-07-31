import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateId, generateSecureId, getCurrentCounter, resetIdCounter } from './id-generation';

describe('ID Generation utilities', () => {
	beforeEach(() => {
		resetIdCounter();
	});

	describe('generateId', () => {
		it('should generate incrementing IDs with default prefix', () => {
			const id1 = generateId();
			const id2 = generateId();
			const id3 = generateId();

			expect(id1).toBe('id-1');
			expect(id2).toBe('id-2');
			expect(id3).toBe('id-3');
		});

		it('should generate IDs with custom prefix', () => {
			const id1 = generateId('note');
			const id2 = generateId('category');
			const id3 = generateId('note');

			expect(id1).toBe('note-1');
			expect(id2).toBe('category-2');
			expect(id3).toBe('note-3');
		});

		it('should continue incrementing across different prefixes', () => {
			generateId('a');
			generateId('b');
			const id = generateId('c');

			expect(id).toBe('c-3');
		});
	});

	describe('generateSecureId', () => {
		it('should use crypto.randomUUID when available', () => {
			const mockUUID = 'mock-uuid-1234';
			const originalRandomUUID = globalThis.crypto?.randomUUID;

			// Mock randomUUID function
			if (globalThis.crypto) {
				globalThis.crypto.randomUUID = vi.fn().mockReturnValue(mockUUID);
			}

			const result = generateSecureId();
			expect(result).toBe(mockUUID);
			expect(globalThis.crypto.randomUUID).toHaveBeenCalled();

			// Restore original randomUUID
			if (globalThis.crypto && originalRandomUUID) {
				globalThis.crypto.randomUUID = originalRandomUUID;
			}
		});

		it('should fallback to deterministic ID when crypto.randomUUID is not available', () => {
			const originalRandomUUID = globalThis.crypto?.randomUUID;

			// Mock crypto to not have randomUUID
			if (globalThis.crypto) {
				globalThis.crypto.randomUUID = undefined as any;
			}

			const result = generateSecureId();
			expect(result).toBe('secure-1');

			// Restore original randomUUID
			if (globalThis.crypto && originalRandomUUID) {
				globalThis.crypto.randomUUID = originalRandomUUID;
			}
		});

		it('should fallback when crypto is undefined', () => {
			const originalCrypto = globalThis.crypto;

			// Remove crypto entirely
			delete (globalThis as any).crypto;

			const result = generateSecureId();
			expect(result).toBe('secure-1');

			// Restore original crypto
			globalThis.crypto = originalCrypto;
		});
	});

	describe('resetIdCounter', () => {
		it('should reset the counter to 0', () => {
			generateId(); // id-1
			generateId(); // id-2
			generateId(); // id-3

			expect(getCurrentCounter()).toBe(3);

			resetIdCounter();
			expect(getCurrentCounter()).toBe(0);

			const nextId = generateId();
			expect(nextId).toBe('id-1');
		});
	});

	describe('getCurrentCounter', () => {
		it('should return the current counter value', () => {
			expect(getCurrentCounter()).toBe(0);

			generateId();
			expect(getCurrentCounter()).toBe(1);

			generateId();
			generateId();
			expect(getCurrentCounter()).toBe(3);
		});
	});

	describe('integration tests', () => {
		it('should maintain counter state across different functions', () => {
			const id1 = generateId('test');
			const secureId = generateSecureId(); // May increment or use crypto
			const id2 = generateId('test');

			expect(id1).toBe('test-1');
			expect(secureId).toBeDefined(); // Use the variable

			// If crypto is available, counter should still be 1, otherwise 2
			if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
				expect(id2).toBe('test-2');
			} else {
				expect(id2).toBe('test-3');
			}
		});
	});
});
