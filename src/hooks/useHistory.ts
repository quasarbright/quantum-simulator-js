// History management hook for undo/redo functionality

import { useState, useCallback } from 'react';
import type { Experiment } from '../core/types';

interface HistoryState {
  experiment: Experiment;
  timestamp: number;
}

interface UseHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Experiment | null;
  redo: () => Experiment | null;
  push: (experiment: Experiment) => void;
  clear: () => void;
}

const MAX_HISTORY_SIZE = 50;

export function useHistory(initialExperiment: Experiment): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryState[]>([
    { experiment: initialExperiment, timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const undo = useCallback((): Experiment | null => {
    if (!canUndo) return null;
    
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex].experiment;
  }, [canUndo, currentIndex, history]);

  const redo = useCallback((): Experiment | null => {
    if (!canRedo) return null;
    
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex].experiment;
  }, [canRedo, currentIndex, history]);

  const push = useCallback((experiment: Experiment) => {
    setHistory((prevHistory) => {
      // Remove any forward history if we're not at the end
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push({ experiment, timestamp: Date.now() });
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        setCurrentIndex(MAX_HISTORY_SIZE - 1);
      } else {
        setCurrentIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  }, [currentIndex]);

  const clear = useCallback(() => {
    setHistory([{ experiment: initialExperiment, timestamp: Date.now() }]);
    setCurrentIndex(0);
  }, [initialExperiment]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    push,
    clear,
  };
}

