export interface TreeData {
	id: string;
	name: string;
	type?: 'category' | 'note';
	children?: TreeData[];
}
