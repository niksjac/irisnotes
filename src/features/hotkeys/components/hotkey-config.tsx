import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useMemo, useState } from 'react';
import { Button } from '../../../shared/components/button';
import { detectConflictsAtom, hotkeyConfigurationAtom, removeBindingAtom, updateBindingAtom } from '../atoms';
import type { HotkeyBinding, HotkeyScope } from '../types';

interface HotkeyConfigProps {
	className?: string;
}

export function HotkeyConfig({ className }: HotkeyConfigProps) {
	const [configuration] = useAtom(hotkeyConfigurationAtom);
	const conflicts = useAtomValue(detectConflictsAtom);
	const updateBinding = useSetAtom(updateBindingAtom);
	const removeBinding = useSetAtom(removeBindingAtom);

	const [selectedScope, setSelectedScope] = useState<HotkeyScope | 'all'>('all');
	const [searchTerm, setSearchTerm] = useState('');

	// Filter bindings based on scope and search
	const filteredBindings = useMemo(() => {
		let bindings = configuration.bindings;

		if (selectedScope !== 'all') {
			bindings = bindings.filter(b => b.scope === selectedScope);
		}

		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			bindings = bindings.filter(
				b =>
					b.name.toLowerCase().includes(term) ||
					b.description.toLowerCase().includes(term) ||
					b.category.toLowerCase().includes(term) ||
					(typeof b.keys === 'string'
						? b.keys.toLowerCase().includes(term)
						: b.keys.some(k => k.toLowerCase().includes(term)))
			);
		}

		return bindings.sort((a, b) => {
			// Sort by category, then by name
			if (a.category !== b.category) {
				return a.category.localeCompare(b.category);
			}
			return a.name.localeCompare(b.name);
		});
	}, [configuration.bindings, selectedScope, searchTerm]);

	// Group bindings by category
	const bindingsByCategory = useMemo(() => {
		const groups = new Map<string, HotkeyBinding[]>();
		filteredBindings.forEach(binding => {
			if (!groups.has(binding.category)) {
				groups.set(binding.category, []);
			}
			groups.get(binding.category)!.push(binding);
		});
		return groups;
	}, [filteredBindings]);

	const formatKeys = (keys: string | string[]): string => {
		if (Array.isArray(keys)) {
			return keys.join(' → ');
		}
		return keys.replace(/mod/g, '⌘/Ctrl').replace(/\+/g, ' + ');
	};

	const getScopeIcon = (scope: HotkeyScope): string => {
		switch (scope) {
			case 'global':
				return '🌐';
			case 'local':
				return '📱';
			case 'editor':
				return '📝';
			case 'sequence':
				return '🔗';
			default:
				return '❓';
		}
	};

	const toggleBinding = (binding: HotkeyBinding) => {
		const updatedBinding = { ...binding, enabled: !binding.enabled };
		updateBinding(updatedBinding);
	};

	const deleteBinding = (bindingId: string) => {
		if (confirm('Are you sure you want to delete this hotkey binding?')) {
			removeBinding(bindingId);
		}
	};

	return (
		<div className={`hotkey-config ${className || ''}`}>
			<div className='hotkey-config-header mb-6'>
				<h2 className='text-xl font-bold mb-4'>Hotkey Configuration</h2>

				{/* Conflicts Warning */}
				{conflicts.length > 0 && (
					<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4'>
						<strong>⚠️ {conflicts.length} conflict(s) detected:</strong>
						<ul className='mt-2 ml-4 list-disc'>
							{conflicts.map((conflict, index) => (
								<li key={index}>
									{conflict.binding1.name} and {conflict.binding2.name} both use{' '}
									{Array.isArray(conflict.keys) ? conflict.keys.join(' → ') : conflict.keys}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Filters */}
				<div className='flex gap-4 mb-4'>
					<div className='flex-1'>
						<input
							type='text'
							placeholder='Search hotkeys...'
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>
					<select
						value={selectedScope}
						onChange={e => setSelectedScope(e.target.value as HotkeyScope | 'all')}
						className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
					>
						<option value='all'>All Scopes</option>
						<option value='global'>Global</option>
						<option value='local'>Local</option>
						<option value='editor'>Editor</option>
						<option value='sequence'>Sequence</option>
					</select>
				</div>

				{/* Stats */}
				<div className='flex gap-4 text-sm text-gray-600 mb-4'>
					<span>Total: {configuration.bindings.length}</span>
					<span>Enabled: {configuration.bindings.filter(b => b.enabled).length}</span>
					<span>Showing: {filteredBindings.length}</span>
				</div>
			</div>

			{/* Bindings List */}
			<div className='hotkey-bindings'>
				{Array.from(bindingsByCategory.entries()).map(([category, bindings]) => (
					<div
						key={category}
						className='category-section mb-6'
					>
						<h3 className='text-lg font-semibold mb-3 capitalize'>{category}</h3>
						<div className='space-y-2'>
							{bindings.map(binding => (
								<div
									key={binding.id}
									className={`hotkey-binding p-4 border rounded-lg ${
										binding.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
									} ${
										conflicts.some(c => c.binding1.id === binding.id || c.binding2.id === binding.id)
											? 'border-red-300 bg-red-50'
											: ''
									}`}
								>
									<div className='flex items-center justify-between'>
										<div className='flex-1'>
											<div className='flex items-center gap-3 mb-1'>
												<span className='text-lg'>{getScopeIcon(binding.scope)}</span>
												<span className='font-medium'>{binding.name}</span>
												<code className='px-2 py-1 bg-gray-100 rounded text-sm font-mono'>
													{formatKeys(binding.keys)}
												</code>
												{!binding.enabled && (
													<span className='px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs'>Disabled</span>
												)}
											</div>
											<p className='text-sm text-gray-600'>{binding.description}</p>
											<div className='flex items-center gap-2 mt-2 text-xs text-gray-500'>
												<span>Scope: {binding.scope}</span>
												{binding.context && <span>Context: {binding.context}</span>}
												<span>Action: {binding.action}</span>
											</div>
										</div>

										<div className='flex items-center gap-2'>
											<Button
												variant='secondary'
												size='sm'
												onClick={() => toggleBinding(binding)}
											>
												{binding.enabled ? 'Disable' : 'Enable'}
											</Button>
											<Button
												variant='danger'
												size='sm'
												onClick={() => deleteBinding(binding.id)}
											>
												Delete
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				))}

				{filteredBindings.length === 0 && (
					<div className='text-center py-8 text-gray-500'>No hotkey bindings found matching your criteria.</div>
				)}
			</div>

			{/* Summary */}
			<div className='mt-8 p-4 bg-gray-50 rounded-lg'>
				<h4 className='font-medium mb-2'>Configuration Summary</h4>
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
					<div>
						<div className='font-medium'>Global Shortcuts</div>
						<div className='text-gray-600'>
							{configuration.bindings.filter(b => b.scope === 'global' && b.enabled).length} active
						</div>
					</div>
					<div>
						<div className='font-medium'>Local Shortcuts</div>
						<div className='text-gray-600'>
							{configuration.bindings.filter(b => b.scope === 'local' && b.enabled).length} active
						</div>
					</div>
					<div>
						<div className='font-medium'>Editor Shortcuts</div>
						<div className='text-gray-600'>
							{configuration.bindings.filter(b => b.scope === 'editor' && b.enabled).length} active
						</div>
					</div>
					<div>
						<div className='font-medium'>Sequence Shortcuts</div>
						<div className='text-gray-600'>
							{configuration.bindings.filter(b => b.scope === 'sequence' && b.enabled).length} active
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
