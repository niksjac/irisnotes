import { useState, useEffect } from 'react';
import { Note } from '../../../types';
import { parseTextWithColors } from '../../../shared';
import { useConfig } from '../../../hooks/use-config';

export type PaneId = 'left' | 'right';

// Hardcoded example note content for debugging
const EXAMPLE_NOTE_CONTENT = `{size:xxl}{color:blue}{bold}Welcome to IrisNotes Custom Formatting!{/bold}{/color}{/size}

{bg:yellow}{bold}📋 Quick Reference Guide{/bold}{/bg}

{size:large}{color:green}✨ Text Formatting Examples{/color}{/size}

{bold}Basic Formatting:{/bold}
• {bold}This is bold text{/bold}
• {italic}This is italic text{/italic}
• {strike}This is strikethrough text{/strike}
• {underline}This is underlined text{/underline}
• {code}This is code/monospace text{/code}

{bold}Scientific Notation:{/bold}
• Water molecule: H{sub}2{/sub}O
• Carbon dioxide: CO{sub}2{/sub}
• Einstein's equation: E = mc{sup}2{/sup}

{size:large}{color:purple}🎨 Color Showcase{/color}{/size}

{bold}Text Colors:{/bold}
{color:red}Red{/color} • {color:green}Green{/color} • {color:blue}Blue{/color} • {color:yellow}Yellow{/color} • {color:purple}Purple{/color}

{bold}Background Highlights:{/bold}
{bg:yellow}Important Info{/bg} • {bg:red}Warning{/bg} • {bg:green}Success{/bg}

{size:large}{color:red}🔥 Complex Combinations{/color}{/size}

{color:red}{bold}{bg:yellow}🚨 CRITICAL ALERT{/bg}{/bold}{/color}

{size:large}{font:Georgia}{italic}{color:blue}Elegant large italic blue text{/color}{/italic}{/font}{/size}

{size:large}{bold}Testing All Formatting{/bold}{/size}

{bold}Superscript/Subscript Test:{/bold}
Water: H{sub}2{/sub}O
Energy: E = mc{sup}2{/sup}
Chemical: H{sub}2{/sub}SO{sub}4{/sub}

{bold}Font Family Test:{/bold}
{font:Arial}This should be Arial{/font}
{font:Georgia}This should be Georgia{/font}
{font:Courier New}This should be Courier New{/font}
{font:Times New Roman}This should be Times New Roman{/font}

{bold}Font Size Test:{/bold}
{size:tiny}tiny{/size} {size:small}small{/size} {size:large}large{/size} {size:huge}huge{/size}

{bold}Background Color Test:{/bold}
{bg:yellow}yellow background{/bg}
{bg:red}red background{/bg}
{bg:green}green background{/bg}

{bold}Combination Test:{/bold}
{font:Georgia}{size:large}{color:blue}Large Blue Georgia Text{/color}{/size}{/font}
{bg:yellow}{bold}Bold highlighted text{/bold}{/bg}
Chemical formula: H{sub}2{/sub}SO{sub}4{/sub} + 2NaOH → Na{sub}2{/sub}SO{sub}4{/sub} + 2H{sub}2{/sub}O


Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

Happy note-taking!`;

export const useNotes = () => {
  const { config, loading } = useConfig();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<{
    left: string | null;
    right: string | null;
  }>({
    left: null,
    right: null
  });

  // Initialize selected note after config loads
  useEffect(() => {
    if (!loading && config.debug?.enableExampleNote) {
      setSelectedNoteIds(prev => ({
        ...prev,
        left: prev.left || "example-debug-note"
      }));
    }
  }, [loading, config.debug?.enableExampleNote]);

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

  const loadExampleNote = async () => {
    if (!config.debug?.enableExampleNote) {
      return;
    }

    try {
      const parsedContent = parseTextWithColors(EXAMPLE_NOTE_CONTENT);

      const exampleNote: Note = {
        id: "example-debug-note",
        title: "Example Note (Debug)",
        content: parsedContent,
        content_type: 'html',
        is_pinned: false,
        is_archived: false,
        word_count: parsedContent.length,
        character_count: parsedContent.length,
        content_plaintext: parsedContent.replace(/<[^>]*>/g, ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setNotes([exampleNote]);
      setSelectedNoteId("example-debug-note");
    } catch (error) {
      console.error("Failed to load example note:", error);
    }
  };

  const reloadExampleNote = async () => {
    if (!config.debug?.enableExampleNote) {
      return;
    }

    try {
      const updatedExampleNote: Note = {
        id: "example-debug-note",
        title: "Example Note (Debug)",
        content: parseTextWithColors(EXAMPLE_NOTE_CONTENT),
        content_type: 'html',
        is_pinned: false,
        is_archived: false,
        word_count: EXAMPLE_NOTE_CONTENT.length,
        character_count: EXAMPLE_NOTE_CONTENT.length,
        content_plaintext: EXAMPLE_NOTE_CONTENT.replace(/<[^>]*>/g, ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update the existing example note or add it if it doesn't exist
      setNotes(prev => {
        const otherNotes = prev.filter(note => note.id !== "example-debug-note");
        return [updatedExampleNote, ...otherNotes];
      });

      // Make sure the example note is selected to see the changes
      setSelectedNoteId("example-debug-note");

      console.log("Example note reloaded successfully");
    } catch (error) {
      console.error("Failed to reload example note:", error);
    }
  };

  const createNewNote = (targetPane?: PaneId) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      content_type: 'html',
      is_pinned: false,
      is_archived: false,
      word_count: 0,
      character_count: 0,
      content_plaintext: "",
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
    loadExampleNote,
    reloadExampleNote,
    createNewNote,
    updateNoteTitle,
    updateNoteContent
  };
};