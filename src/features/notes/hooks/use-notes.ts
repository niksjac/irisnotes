import { useState } from 'react';
import { appConfigDir } from "@tauri-apps/api/path";
import { readTextFile, exists } from "@tauri-apps/plugin-fs";
import { Note } from '../../../types';
import { parseTextWithColors } from '../../../utils/text-parser';

export type PaneId = 'left' | 'right';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<{
    left: string | null;
    right: string | null;
  }>({
    left: "default-hot-note",
    right: null
  });

  // Legacy support - returns left pane note for backward compatibility
  const selectedNoteId = selectedNoteIds.left;
  const setSelectedNoteId = (noteId: string | null) => {
    setSelectedNoteIds(prev => ({ ...prev, left: noteId }));
  };

  const setSelectedNoteIdForPane = (paneId: PaneId, noteId: string | null) => {
    setSelectedNoteIds(prev => ({ ...prev, [paneId]: noteId }));
  };

  const openNoteInPane = (noteId: string, paneId: PaneId) => {
    setSelectedNoteIds(prev => ({ ...prev, [paneId]: noteId }));
  };

  const loadDefaultNote = async () => {
    try {
      console.log("=== Loading default note ===");
      const configDir = await appConfigDir();
      const defaultNotePath = `${configDir}/default-note.txt`;

      console.log("Config directory:", configDir);
      console.log("Looking for default note at:", defaultNotePath);

      let defaultContent = "Start writing your quick notes here...";

      console.log("Checking if file exists...");
      const fileExists = await exists(defaultNotePath);
      console.log("File exists:", fileExists);

      if (fileExists) {
        console.log("Attempting to read file...");
        try {
          defaultContent = await readTextFile(defaultNotePath);
          console.log("File read successfully!");
          console.log("Content length:", defaultContent.length);
          console.log("First 200 chars:", defaultContent.substring(0, 200));
        } catch (readError) {
          console.error("Error reading file:", readError);
        }
      } else {
        console.log("File does not exist, trying public folder fallback...");
        try {
          const publicPath = "default-note.txt";
          console.log("Trying to read from public:", publicPath);
          defaultContent = await readTextFile(publicPath);
          console.log("Public file read successfully!");
        } catch (publicError) {
          console.error("Public file also failed:", publicError);
          console.log("Using hardcoded fallback content");
        }
      }

      const parsedContent = parseTextWithColors(defaultContent);
      console.log("Parsed content length:", parsedContent.length);
      console.log("Parsed content preview:", parsedContent.substring(0, 200));

      const defaultNote: Note = {
        id: "default-hot-note",
        title: "Quick Notes",
        content: parsedContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setNotes([defaultNote]);
      console.log("Default note set successfully");
      console.log("=== End loading default note ===");
    } catch (error) {
      console.error("Failed to load default note:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));

      // Fallback to hardcoded default note
      const fallbackNote: Note = {
        id: "default-hot-note",
        title: "Quick Notes",
        content: "<p>Start writing your quick notes here...</p>",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setNotes([fallbackNote]);
    }
  };

  const reloadDefaultNote = async () => {
    try {
      const configDir = await appConfigDir();
      const defaultNotePath = `${configDir}/default-note.txt`;

      let defaultContent = "Start writing your quick notes here...";

      if (await exists(defaultNotePath)) {
        defaultContent = await readTextFile(defaultNotePath);
        console.log("Default note content reloaded from file");
      } else {
        console.log("No default note file found during reload, using fallback content");
      }

      const updatedDefaultNote: Note = {
        id: "default-hot-note",
        title: "Quick Notes",
        content: parseTextWithColors(defaultContent),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update the existing default note or add it if it doesn't exist
      setNotes(prev => {
        const otherNotes = prev.filter(note => note.id !== "default-hot-note");
        return [updatedDefaultNote, ...otherNotes];
      });

      // Make sure the default note is selected to see the changes
      setSelectedNoteId("default-hot-note");

      console.log("Default note reloaded successfully");
    } catch (error) {
      console.error("Failed to reload default note:", error);
    }
  };

  const createNewNote = (targetPane?: PaneId) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);

    if (targetPane) {
      setSelectedNoteIdForPane(targetPane, newNote.id);
    } else {
      setSelectedNoteId(newNote.id);
    }
  };

  const updateNoteTitle = (noteId: string, title: string) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId
        ? { ...note, title, updated_at: new Date().toISOString() }
        : note
    ));
  };

  const updateNoteContent = (noteId: string, content: string) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId
        ? { ...note, content, updated_at: new Date().toISOString() }
        : note
    ));
  };

  const getSelectedNoteForPane = (paneId: PaneId) => {
    const noteId = selectedNoteIds[paneId];
    return noteId ? notes.find(note => note.id === noteId) : null;
  };

  // Legacy support
  const selectedNote = notes.find(note => note.id === selectedNoteId);

  return {
    notes,
    selectedNote,
    selectedNoteId,
    selectedNoteIds,
    setSelectedNoteId,
    setSelectedNoteIdForPane,
    openNoteInPane,
    getSelectedNoteForPane,
    loadDefaultNote,
    reloadDefaultNote,
    createNewNote,
    updateNoteTitle,
    updateNoteContent
  };
};