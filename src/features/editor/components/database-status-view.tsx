import { useCallback, useEffect, useState } from 'react';
import { useNotesData, useNotesStorage } from '../../notes';

interface DatabaseInfo {
	backend: string;
	note_count: number;
	last_sync?: string;
	storage_size?: number;
}

export function DatabaseStatusView() {
	const { notes, isLoading, error } = useNotesData();
	const { storageAdapter } = useNotesStorage();
	const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	const loadDatabaseInfo = useCallback(async () => {
		if (!storageAdapter) return;

		setRefreshing(true);
		try {
			const result = await storageAdapter.getStorageInfo();
			if (result.success && result.data) {
				setDatabaseInfo(result.data);
			}
		} catch (err) {
			console.error('Failed to load database info:', err);
		} finally {
			setRefreshing(false);
		}
	}, [storageAdapter]);

	useEffect(() => {
		loadDatabaseInfo();
	}, [loadDatabaseInfo]);

	const formatBytes = (bytes?: number) => {
		if (!bytes) return 'Unknown';
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round((bytes / 1024 ** i) * 100) / 100 + ' ' + sizes[i];
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return 'Never';
		return new Date(dateString).toLocaleString();
	};

	const getStatusColor = () => {
		if (error) return 'bg-red-500';
		if (isLoading || refreshing) return 'bg-yellow-500';
		return 'bg-green-500';
	};

	const getStatusText = () => {
		if (error) return 'Error';
		if (isLoading || refreshing) return 'Loading...';
		return 'Healthy';
	};

	const getConnectionStatusColor = () => {
		return storageAdapter ? 'bg-green-500' : 'bg-red-500';
	};

	return (
		<div className='fixed top-[60px] right-5 w-[300px] max-h-[80vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[1000] overflow-auto'>
			{/* Header */}
			<div className='p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'>
				<div className='flex items-center justify-between'>
					<h3 className='m-0 text-lg font-semibold text-gray-900 dark:text-gray-100'>Database Status</h3>
					<button
						onClick={loadDatabaseInfo}
						disabled={refreshing}
						className='px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'
					>
						{refreshing ? '...' : '↻'}
					</button>
				</div>
			</div>

			{/* Status Indicator */}
			<div className='p-4 border-b border-gray-200 dark:border-gray-700'>
				<div className='flex items-center gap-2'>
					<div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
					<span className='font-medium text-gray-900 dark:text-gray-100 text-sm'>{getStatusText()}</span>
				</div>
				{error && <div className='mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs'>{error}</div>}
			</div>

			{/* Database Information */}
			<div className='p-4'>
				<div className='grid gap-4'>
					{/* Backend Type */}
					<div>
						<div className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5'>Backend</div>
						<div className='text-sm text-gray-900 dark:text-gray-100 font-mono'>
							{databaseInfo?.backend || 'Unknown'}
						</div>
					</div>

					{/* Notes Count */}
					<div>
						<div className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5'>Total Notes</div>
						<div className='text-sm text-gray-900 dark:text-gray-100 font-medium'>
							{databaseInfo?.note_count ?? notes.length}
						</div>
					</div>

					{/* Storage Size */}
					<div>
						<div className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5'>Storage Size</div>
						<div className='text-sm text-gray-900 dark:text-gray-100'>{formatBytes(databaseInfo?.storage_size)}</div>
					</div>

					{/* Last Sync */}
					<div>
						<div className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5'>Last Sync</div>
						<div className='text-sm text-gray-900 dark:text-gray-100'>{formatDate(databaseInfo?.last_sync)}</div>
					</div>

					{/* Available Storages */}
					<div>
						<div className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5'>Available Storages</div>
						<div className='text-sm text-gray-900 dark:text-gray-100'>{storageAdapter ? 'SQLite' : 'None'}</div>
					</div>

					{/* Connection Status */}
					<div>
						<div className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5'>Connection</div>
						<div className='flex items-center gap-1'>
							<div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
							<span className='text-sm text-gray-900 dark:text-gray-100'>
								{storageAdapter ? 'Connected' : 'Disconnected'}
							</span>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
					<div className='grid gap-2'>
						<button
							onClick={loadDatabaseInfo}
							disabled={refreshing}
							className='p-2 text-xs border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'
						>
							Refresh Status
						</button>

						{storageAdapter?.sync && (
							<button
								onClick={() => storageAdapter.sync?.()}
								disabled={refreshing}
								className='p-2 text-xs border border-blue-500 dark:border-blue-400 rounded bg-blue-500 dark:bg-blue-600 text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'
							>
								Sync All Storages
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
