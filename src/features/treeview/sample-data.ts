export interface TreeData {
	id: string;
	name: string;
	children?: TreeData[];
}

// Mock data for initial testing
export const sampleData: TreeData[] = [
	{
		id: '1',
		name: 'Documents',
		children: [
			{ id: '2', name: 'Meeting Notes.md' },
			{ id: '3', name: 'Project Ideas.md' },
		],
	},
	{
		id: '4',
		name: 'Projects',
		children: [
			{
				id: '5',
				name: 'Web Development',
				children: [
					{ id: '6', name: 'React Tutorial.md' },
					{ id: '7', name: 'CSS Tips.md' },
				],
			},
			{ id: '8', name: 'Personal.md' },
		],
	},
	{ id: '9', name: 'Quick Note.md' },
];
