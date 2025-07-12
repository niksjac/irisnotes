import type { Note, Category } from '../../types/database';

export interface TreeNode {
  id: string;
  name: string;
  type: 'note' | 'category';
  children?: TreeNode[];
  data?: Note | Category;
  parent?: string | null;
}

export interface NotesTreeViewProps {
  notes: Note[];
  categories: Category[];
  selectedNoteId?: string | null;
  onNoteSelect: (noteId: string) => void;
  onCreateNote: (parentCategoryId?: string) => void;
  onCreateFolder: (parentCategoryId?: string) => void;
  onMoveNote: (noteId: string, newCategoryId: string | null) => void;
  onDeleteNote: (noteId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onRenameNote: (noteId: string, newTitle: string) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  // Add note-category relationships
  noteCategories?: { noteId: string; categoryId: string }[];
  // Add props for folder selection
  selectedItemId?: string | null;
  selectedItemType?: 'note' | 'category' | null;
  onItemSelect?: (itemId: string, itemType: 'note' | 'category') => void;
  // Focus management props
  focusClasses?: Record<string, boolean>;
  onRegisterElement?: (ref: HTMLElement | null) => void;
  onSetFocusFromClick?: () => void;
  // External search query
  searchQuery?: string;
}