// Selection management hook for components

import { useState, useCallback } from 'react';
import type { Component } from '../core/types';
import { vec, vecToKey, type Vec } from '../core/vec';

export interface Selection {
  components: Map<string, Component>; // Map from position key to component
  positions: Set<string>; // Set of position keys
}

interface Clipboard {
  components: Map<string, Component>;
  minX: number;
  minY: number;
}

export function useSelection() {
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<Clipboard | null>(null);

  const selectComponent = useCallback((posKey: string) => {
    setSelectedPositions(new Set([posKey]));
  }, []);

  const addToSelection = useCallback((posKey: string) => {
    setSelectedPositions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(posKey)) {
        newSet.delete(posKey);
      } else {
        newSet.add(posKey);
      }
      return newSet;
    });
  }, []);

  const selectRectangle = useCallback((x1: number, y1: number, x2: number, y2: number, _experiment: any) => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const newSelection = new Set<string>();
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = vecToKey(vec(x, y));
        // Select ALL cells in rectangle (including empty ones)
        newSelection.add(key);
      }
    }

    setSelectedPositions(newSelection);
  }, []);

  const selectAll = useCallback((experiment: any) => {
    setSelectedPositions(new Set(experiment.components.keys()));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPositions(new Set());
  }, []);

  const copySelection = useCallback((experiment: any) => {
    if (selectedPositions.size === 0) return;

    const components = new Map<string, Component>();
    let minX = Infinity;
    let minY = Infinity;

    // Only copy actual components, not empty cells
    for (const posKey of selectedPositions) {
      const component = experiment.components.get(posKey);
      if (component) {
        components.set(posKey, component);
      }
      // Calculate min even for empty cells to preserve relative positions
      const parts = posKey.split(',');
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[2]);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
    }

    setClipboard({ components, minX, minY });
  }, [selectedPositions]);

  const cutSelection = useCallback((experiment: any) => {
    copySelection(experiment);
    return selectedPositions;
  }, [selectedPositions, copySelection]);

  const pasteSelection = useCallback((targetPos: Vec) => {
    if (!clipboard) return null;

    const newComponents = new Map<string, Component>();
    const offsetX = targetPos.x.re - clipboard.minX;
    const offsetY = targetPos.y.re - clipboard.minY;

    // Only paste actual components - empty cells are ignored
    for (const [oldKey, component] of clipboard.components) {
      // Parse old position
      const parts = oldKey.split(',');
      const oldX = parseFloat(parts[0]);
      const oldY = parseFloat(parts[2]);

      // Calculate new position
      const newPos = vec(oldX + offsetX, oldY + offsetY);
      const newKey = vecToKey(newPos);

      // Place component at new position (will overwrite if something there)
      newComponents.set(newKey, component);
    }

    return newComponents;
  }, [clipboard]);

  const moveSelection = useCallback((experiment: any, offsetX: number, offsetY: number) => {
    if (selectedPositions.size === 0) return null;

    const componentsToMove = new Map<string, Component>();
    const keysToRemove = new Set<string>();

    // Only move actual components - empty selected cells are ignored
    for (const posKey of selectedPositions) {
      const component = experiment.components.get(posKey);
      if (component) {
        keysToRemove.add(posKey);

        // Parse old position
        const parts = posKey.split(',');
        const oldX = parseFloat(parts[0]);
        const oldY = parseFloat(parts[2]);

        // Calculate new position
        const newPos = vec(oldX + offsetX, oldY + offsetY);
        const newKey = vecToKey(newPos);

        // Place component at new position (will overwrite if something there)
        componentsToMove.set(newKey, component);
      }
    }

    return { componentsToMove, keysToRemove };
  }, [selectedPositions]);

  return {
    selectedPositions,
    clipboard,
    selectComponent,
    addToSelection,
    selectRectangle,
    selectAll,
    clearSelection,
    copySelection,
    cutSelection,
    pasteSelection,
    moveSelection,
    hasSelection: selectedPositions.size > 0,
    hasClipboard: clipboard !== null,
  };
}

