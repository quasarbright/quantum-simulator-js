// Global keyboard shortcuts hook

import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  // Editing
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  
  // File
  onSave?: () => void;
  onNew?: () => void;
  onOpen?: () => void;
  
  // Clipboard
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  
  // Selection
  onSelectAll?: () => void;
  onDeselect?: () => void;
  
  // View
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomToFit?: () => void;
  
  // Simulation
  onTogglePlay?: () => void;
  onStep?: () => void;
  
  // Tools (1-9 for components, E for eraser, H for hand, V for select)
  onSelectTool?: (toolIndex: number) => void;
  onEraser?: () => void;
  onHandTool?: () => void;
  onSelectMode?: () => void;
  
  // Help
  onShowHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      
      // Ignore shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd + Z: Undo
      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handlers.onUndo?.();
        return;
      }

      // Ctrl/Cmd + Shift + Z: Redo
      if (isCtrlOrCmd && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // Ctrl/Cmd + Y: Redo (alternative)
      if (isCtrlOrCmd && e.key === 'y') {
        e.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // Delete or Backspace: Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only if not in an input
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handlers.onDelete?.();
        }
        return;
      }

      // Escape: Deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.onDeselect?.();
        return;
      }

      // Ctrl/Cmd + S: Save
      if (isCtrlOrCmd && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }

      // Ctrl/Cmd + N: New
      if (isCtrlOrCmd && e.key === 'n') {
        e.preventDefault();
        handlers.onNew?.();
        return;
      }

      // Ctrl/Cmd + O: Open
      if (isCtrlOrCmd && e.key === 'o') {
        e.preventDefault();
        handlers.onOpen?.();
        return;
      }

      // Ctrl/Cmd + C: Copy
      if (isCtrlOrCmd && e.key === 'c') {
        e.preventDefault();
        handlers.onCopy?.();
        return;
      }

      // Ctrl/Cmd + X: Cut
      if (isCtrlOrCmd && e.key === 'x') {
        e.preventDefault();
        handlers.onCut?.();
        return;
      }

      // Ctrl/Cmd + V: Paste
      if (isCtrlOrCmd && e.key === 'v') {
        e.preventDefault();
        handlers.onPaste?.();
        return;
      }

      // Ctrl/Cmd + D: Duplicate
      if (isCtrlOrCmd && e.key === 'd') {
        e.preventDefault();
        handlers.onDuplicate?.();
        return;
      }

      // Ctrl/Cmd + A: Select All
      if (isCtrlOrCmd && e.key === 'a') {
        e.preventDefault();
        handlers.onSelectAll?.();
        return;
      }

      // +/=: Zoom In
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handlers.onZoomIn?.();
        return;
      }

      // -: Zoom Out
      if (e.key === '-') {
        e.preventDefault();
        handlers.onZoomOut?.();
        return;
      }

      // 0: Zoom to Fit
      if (e.key === '0') {
        e.preventDefault();
        handlers.onZoomToFit?.();
        return;
      }

      // Space: Toggle play/pause (when not in edit mode)
      if (e.key === ' ' && !isCtrlOrCmd) {
        // Don't prevent default here - let Grid handle Space for pan mode
        // handlers.onTogglePlay?.();
        return;
      }

      // Period (.): Step
      if (e.key === '.') {
        e.preventDefault();
        handlers.onStep?.();
        return;
      }

      // Numbers 1-9: Select tool
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const toolIndex = parseInt(e.key) - 1;
        handlers.onSelectTool?.(toolIndex);
        return;
      }

      // E: Eraser
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handlers.onEraser?.();
        return;
      }

      // H: Hand tool
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handlers.onHandTool?.();
        return;
      }

      // V: Select mode
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        handlers.onSelectMode?.();
        return;
      }

      // ?: Show help
      if (e.key === '?') {
        e.preventDefault();
        handlers.onShowHelp?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers, enabled]);
}

