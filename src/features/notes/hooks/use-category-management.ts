import { useState, useEffect, useCallback } from 'react';
import type { Category, Note } from '../../../types/database';
import type { SingleStorageManager } from '../storage/types';

interface UseCategoryManagementProps {
  storageManager: SingleStorageManager | null;
  isLoading: boolean;
  notesLength: number;
}

export function useCategoryManagement({
  storageManager,
  isLoading,
  notesLength
}: UseCategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [noteCategories, setNoteCategories] = useState<{ noteId: string; categoryId: string }[]>([]);

  // Load categories when notes are loaded (indicating storage is ready)
  useEffect(() => {
    const loadCategories = async () => {
      if (!storageManager || isLoading) return;

      // Check if storage is actually ready by trying to get active storage
      const activeStorage = storageManager.getActiveStorage();
      if (!activeStorage) {

        return;
      }

      try {
        const result = await storageManager.getCategories();
        if (result.success) {
          setCategories(result.data);
        } else {
          console.error('Failed to load categories:', result.error);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    // Only load categories after notes are loaded and storage is ready
    if (!isLoading && notesLength >= 0) {
      loadCategories();
    }
  }, [storageManager, isLoading, notesLength]);

  // Load note-category relationships
  const loadNoteCategories = useCallback(async () => {
    if (!storageManager) return [];

    try {
      const storage = storageManager.getActiveStorage();
      if (!storage) {

        return [];
      }

      const relationships: { noteId: string; categoryId: string }[] = [];

              // Load note categories for each category
        for (const category of categories) {
          const result = await storage.getCategoryNotes(category.id);
          if (result.success) {
            result.data.forEach((note: Note) => {
              relationships.push({
                noteId: note.id,
                categoryId: category.id
              });
            });
          }
        }

      setNoteCategories(relationships);
      return relationships;
    } catch (error) {
      console.error('Failed to load note categories:', error);
      return [];
    }
  }, [storageManager, categories]);

  // Load note categories when categories change
  useEffect(() => {
    if (categories.length > 0) {
      loadNoteCategories();
    }
  }, [categories, loadNoteCategories]);

  // Category handlers
  const handleCreateFolder = useCallback(async (parentCategoryId?: string) => {
    if (!storageManager) return;

    try {
      const createParams = {
        name: 'New Folder',
        description: '',
        ...(parentCategoryId && { parent_id: parentCategoryId })
      };
      const result = await storageManager.createCategory(createParams);

      if (result.success) {
        setCategories(prev => [...prev, result.data]);
        // Reload categories to ensure consistency
        const categoriesResult = await storageManager.getCategories();
        if (categoriesResult.success) {
          setCategories(categoriesResult.data);
        }
      } else {
        console.error('Failed to create category:', result.error);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  }, [storageManager]);

  const handleMoveNote = useCallback(async (noteId: string, newCategoryId: string | null) => {
    if (!storageManager) return;

    try {
      const storage = storageManager.getActiveStorage();
      if (!storage) {

        return;
      }

      // Remove from all categories first
      for (const category of categories) {
        await storage.removeNoteFromCategory(noteId, category.id);
      }

      // Add to new category if specified
      if (newCategoryId) {
        await storage.addNoteToCategory(noteId, newCategoryId);
      }

      // Reload note categories to update the tree
      await loadNoteCategories();
    } catch (error) {
      console.error('Failed to move note:', error);
    }
  }, [storageManager, categories, loadNoteCategories]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    if (!storageManager) return;

    try {
      const storage = storageManager.getActiveStorage();
      if (!storage) {

        return;
      }

      await storage.deleteCategory(categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  }, [storageManager]);

  const handleRenameCategory = useCallback(async (categoryId: string, newName: string) => {
    if (!storageManager) return;

    try {
      const storage = storageManager.getActiveStorage();
      if (!storage) {

        return;
      }

      const result = await storage.updateCategory(categoryId, { name: newName });
      if (result.success) {
        setCategories(prev => prev.map(cat =>
          cat.id === categoryId ? { ...cat, name: newName } : cat
        ));
      }
    } catch (error) {
      console.error('Failed to rename category:', error);
    }
  }, [storageManager]);

  return {
    categories,
    noteCategories,
    handleCreateFolder,
    handleMoveNote,
    handleDeleteCategory,
    handleRenameCategory,
    loadNoteCategories
  };
}