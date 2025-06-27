import { useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface HotkeySequence {
  keys: string[];
  action: () => void | Promise<void>;
  description: string;
}

interface UseHotkeySequencesOptions {
  sequences: HotkeySequence[];
  timeout?: number; // Timeout for sequence completion in ms
}

export const useHotkeySequences = ({ sequences, timeout = 2000 }: UseHotkeySequencesOptions) => {
  const currentSequence = useRef<string[]>([]);
  const sequenceTimeout = useRef<number | null>(null);
  const isWaitingForSequence = useRef(false);

  const resetSequence = useCallback(() => {
    currentSequence.current = [];
    isWaitingForSequence.current = false;
    if (sequenceTimeout.current) {
      clearTimeout(sequenceTimeout.current);
      sequenceTimeout.current = null;
    }
  }, []);

  const normalizeKey = useCallback((event: KeyboardEvent): string => {
    const modifiers = [];
    if (event.ctrlKey || event.metaKey) modifiers.push('Mod');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');

    let key = event.key;

    // Normalize key names
    if (key === ' ') key = 'Space';
    else if (key.length === 1) key = key.toLowerCase();

    return modifiers.length > 0 ? `${modifiers.join('+')}-${key}` : key;
  }, []);

  const findMatchingSequence = useCallback((keySequence: string[]) => {
    return sequences.find(seq => {
      if (seq.keys.length !== keySequence.length) return false;
      return seq.keys.every((key, index) => key === keySequence[index]);
    });
  }, [sequences]);

  const findPartialMatches = useCallback((keySequence: string[]) => {
    return sequences.filter(seq => {
      if (seq.keys.length <= keySequence.length) return false;
      return keySequence.every((key, index) => seq.keys[index] === key);
    });
  }, [sequences]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore keys when focused on input elements
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    const normalizedKey = normalizeKey(event);

    // Add current key to sequence
    currentSequence.current.push(normalizedKey);

    // Clear existing timeout
    if (sequenceTimeout.current) {
      clearTimeout(sequenceTimeout.current);
    }

    // Check for exact match
    const exactMatch = findMatchingSequence(currentSequence.current);
    if (exactMatch) {
      event.preventDefault();
      resetSequence();

      // Execute the action
      try {
        const result = exactMatch.action();
        if (result instanceof Promise) {
          result.catch(console.error);
        }
      } catch (error) {
        console.error('Error executing hotkey sequence action:', error);
      }
      return;
    }

    // Check for partial matches
    const partialMatches = findPartialMatches(currentSequence.current);
    if (partialMatches.length > 0) {
      event.preventDefault();
      isWaitingForSequence.current = true;

      // Set timeout to reset sequence
      sequenceTimeout.current = setTimeout(resetSequence, timeout);
    } else {
      // No matches, reset sequence
      resetSequence();
    }
  }, [normalizeKey, findMatchingSequence, findPartialMatches, resetSequence, timeout]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeout.current) {
        clearTimeout(sequenceTimeout.current);
      }
    };
  }, [handleKeyDown]);

  return {
    isWaitingForSequence: isWaitingForSequence.current,
    currentSequence: currentSequence.current,
    resetSequence
  };
};

// Utility function to create common hotkey sequences
export const createAppConfigSequences = () => {
  const openAppConfigFolder = async () => {
    try {
      await invoke('open_app_config_folder');
    } catch (error) {
      console.error('Failed to open app config folder:', error);
    }
  };

  return [
    {
      keys: ['Mod-k', 'r'],
      action: openAppConfigFolder,
      description: 'Open App Config folder in file manager'
    }
  ];
};