// Storage adapter factory - creates appropriate adapter based on configuration

import type { StorageAdapter, StorageConfig } from './types';
import { SQLiteStorageAdapter } from './adapters/sqlite-adapter';
import { JsonSingleStorageAdapter } from './adapters/json-single-adapter';
import { JsonHybridStorageAdapter } from './adapters/json-hybrid-adapter';

/**
 * Create a storage adapter based on the configuration
 * @param config - Storage configuration specifying backend and options
 * @returns Appropriate storage adapter instance
 * @throws Error if backend is not supported
 */
export function createStorageAdapter(config: StorageConfig): StorageAdapter {
	switch (config.backend) {
		case 'sqlite':
			return new SQLiteStorageAdapter(config);

		case 'json-single':
			return new JsonSingleStorageAdapter(config);

		case 'json-hybrid':
			return new JsonHybridStorageAdapter(config);

		default:
			throw new Error(`Unsupported storage backend: ${config.backend}`);
	}
}

/**
 * Get available storage backends
 * @returns Array of supported backend names
 */
export function getAvailableBackends(): string[] {
	return ['sqlite', 'json-single', 'json-hybrid'];
}

/**
 * Validate storage configuration
 * @param config - Configuration to validate
 * @returns Validation result with error message if invalid
 */
export function validateStorageConfig(config: StorageConfig): { valid: boolean; error?: string } {
	if (!config.backend) {
		return { valid: false, error: 'Storage backend is required' };
	}

	const availableBackends = getAvailableBackends();
	if (!availableBackends.includes(config.backend)) {
		return {
			valid: false,
			error: `Unsupported backend '${config.backend}'. Available: ${availableBackends.join(', ')}`
		};
	}

	// Backend-specific validation
	switch (config.backend) {
		case 'sqlite':
			if (!config.sqlite?.database_path) {
				return { valid: false, error: 'SQLite backend requires database_path' };
			}
			break;

		case 'json-single':
			if (!config.jsonSingle?.file_path) {
				return { valid: false, error: 'JSON Single backend requires file_path' };
			}
			break;

		case 'json-hybrid':
			if (!config.jsonHybrid?.structure_file || !config.jsonHybrid?.content_dir) {
				return {
					valid: false,
					error: 'JSON Hybrid backend requires structure_file and content_dir'
				};
			}
			break;
	}

	return { valid: true };
}
