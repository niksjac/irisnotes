import { atom } from "jotai";

export type TreeViewType = "complex";

export const treeViewTypeAtom = atom<TreeViewType>("complex");
