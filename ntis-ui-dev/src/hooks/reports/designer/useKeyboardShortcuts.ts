'use client';

import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: (publish?: boolean) => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onDeselect?: () => void;
  onNudge?: (dx: number, dy: number) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onDeselect,
  onNudge,
  enabled = true,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    function handleKeyDown(e: KeyboardEvent) {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.getAttribute('contenteditable') === 'true';

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Undo: Ctrl+Z
      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((isCtrlOrMeta && e.key.toLowerCase() === 'y') || (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Save: Ctrl+S
      if (isCtrlOrMeta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave?.(false);
        return;
      }

      // Duplicate: Ctrl+D
      if (isCtrlOrMeta && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        onDuplicate?.();
        return;
      }

      // Escape: Deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        onDeselect?.();
        return;
      }

      // Ignore remaining shortcut keys when user is typing in an input
      if (isInput) return;

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete?.();
        return;
      }

      // Arrow Nudging
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        onNudge?.(dx, dy);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onUndo, onRedo, onSave, onCopy, onPaste, onDuplicate, onDelete, onDeselect, onNudge]);
}
