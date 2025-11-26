// Persistence utilities for saving/loading experiments

import type Complex from 'complex.js';
import ComplexConstructor from 'complex.js';
import { vec, type Vec } from '../core/vec';
import type { Experiment, Component } from '../core/types';
import { glass } from '../core/types';

// Serializable versions of types
interface SerializedComplex {
  re: number;
  im: number;
}

interface SerializedVec {
  x: SerializedComplex;
  y: SerializedComplex;
}

interface SerializedExperiment {
  source: {
    position: SerializedVec;
    velocity: SerializedVec;
    state: SerializedVec; // SpinState is a Vec
    amplitude: SerializedComplex;
  };
  components: Array<[string, Component]>; // Map as array of tuples
}

interface SavedExperiment {
  name: string;
  timestamp: number;
  experiment: SerializedExperiment;
}

// Serialize Complex number
function serializeComplex(c: Complex): SerializedComplex {
  return { re: c.re, im: c.im };
}

// Deserialize Complex number
function deserializeComplex(c: SerializedComplex): Complex {
  return new ComplexConstructor(c.re, c.im);
}

// Serialize Vec
function serializeVec(v: Vec): SerializedVec {
  return {
    x: serializeComplex(v.x),
    y: serializeComplex(v.y),
  };
}

// Deserialize Vec
function deserializeVec(v: SerializedVec): Vec {
  return vec(
    deserializeComplex(v.x).re,
    deserializeComplex(v.y).re
  );
}

// Serialize Experiment
export function serializeExperiment(experiment: Experiment): SerializedExperiment {
  return {
    source: {
      position: serializeVec(experiment.source.position),
      velocity: serializeVec(experiment.source.velocity),
      state: serializeVec(experiment.source.state),
      amplitude: serializeComplex(experiment.source.amplitude),
    },
    components: Array.from(experiment.components.entries()).map(([key, component]) => {
      // Serialize component - need to handle Complex in glass components
      let serializedComponent: Component;
      if (component.type === 'glass') {
        serializedComponent = {
          ...component,
          phaseShift: deserializeComplex(serializeComplex(component.phaseShift)),
        };
      } else {
        serializedComponent = component;
      }
      return [key, serializedComponent];
    }),
  };
}

// Deserialize Experiment
export function deserializeExperiment(serialized: SerializedExperiment): Experiment {
  const componentsMap = new Map<string, Component>();
  
  serialized.components.forEach(([key, component]) => {
    // Deserialize component - handle Complex in glass components
    let deserializedComponent: Component;
    if (component.type === 'glass') {
      deserializedComponent = glass(deserializeComplex(serializeComplex(component.phaseShift)));
    } else {
      deserializedComponent = component;
    }
    componentsMap.set(key, deserializedComponent);
  });

  return {
    source: {
      position: deserializeVec(serialized.source.position),
      velocity: deserializeVec(serialized.source.velocity),
      state: deserializeVec(serialized.source.state),
      amplitude: deserializeComplex(serialized.source.amplitude),
    },
    components: componentsMap,
  };
}

// Save experiment to localStorage
export function saveExperimentToLocalStorage(name: string, experiment: Experiment): void {
  const serialized = serializeExperiment(experiment);
  const saved: SavedExperiment = {
    name,
    timestamp: Date.now(),
    experiment: serialized,
  };
  
  const key = `quantum-sim-experiment-${name}`;
  localStorage.setItem(key, JSON.stringify(saved));
  
  // Also update the list of saved experiments
  const listKey = 'quantum-sim-experiments-list';
  const list = JSON.parse(localStorage.getItem(listKey) || '[]') as string[];
  if (!list.includes(name)) {
    list.push(name);
    localStorage.setItem(listKey, JSON.stringify(list));
  }
}

// Load experiment from localStorage
export function loadExperimentFromLocalStorage(name: string): Experiment | null {
  const key = `quantum-sim-experiment-${name}`;
  const data = localStorage.getItem(key);
  if (!data) return null;
  
  try {
    const saved: SavedExperiment = JSON.parse(data);
    return deserializeExperiment(saved.experiment);
  } catch (error) {
    console.error('Failed to load experiment:', error);
    return null;
  }
}

// Get list of saved experiments
export function getSavedExperimentsList(): Array<{ name: string; timestamp: number }> {
  const listKey = 'quantum-sim-experiments-list';
  const list = JSON.parse(localStorage.getItem(listKey) || '[]') as string[];
  
  return list
    .map(name => {
      const key = `quantum-sim-experiment-${name}`;
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      try {
        const saved: SavedExperiment = JSON.parse(data);
        return { name: saved.name, timestamp: saved.timestamp };
      } catch {
        return null;
      }
    })
    .filter((item): item is { name: string; timestamp: number } => item !== null)
    .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
}

// Delete saved experiment
export function deleteExperimentFromLocalStorage(name: string): void {
  const key = `quantum-sim-experiment-${name}`;
  localStorage.removeItem(key);
  
  // Update the list
  const listKey = 'quantum-sim-experiments-list';
  const list = JSON.parse(localStorage.getItem(listKey) || '[]') as string[];
  const updatedList = list.filter(n => n !== name);
  localStorage.setItem(listKey, JSON.stringify(updatedList));
}

// Export experiment to JSON file
export function exportExperimentToFile(experiment: Experiment, filename: string = 'quantum-experiment.json'): void {
  const serialized = serializeExperiment(experiment);
  const json = JSON.stringify(serialized, null, 2);
  
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import experiment from JSON file
export async function importExperimentFromFile(file: File): Promise<Experiment | null> {
  try {
    const text = await file.text();
    const serialized: SerializedExperiment = JSON.parse(text);
    return deserializeExperiment(serialized);
  } catch (error) {
    console.error('Failed to import experiment:', error);
    return null;
  }
}

