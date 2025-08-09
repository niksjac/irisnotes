import type { Meta, StoryObj } from '@storybook/react';
import { TreeView } from './tree-view';

const meta: Meta<typeof TreeView> = {
	title: 'Features/TreeView/TreeView',
	component: TreeView,
	parameters: {
		layout: 'padded',
	},
};

export default meta;
type Story = StoryObj<typeof TreeView>;

export const Default: Story = {
	args: {},
};
