// Deep equality check for experiments

import type { Experiment, Component } from '../core/types';
import { vecEqual } from '../core/vec';

function componentEquals(a: Component, b: Component): boolean {
  if (a.type !== b.type) return false;

  switch (a.type) {
    case 'detector':
      return b.type === 'detector' && a.name === b.name;
    
    case 'glass':
      return b.type === 'glass' && 
        a.phaseShift.re === b.phaseShift.re && 
        a.phaseShift.im === b.phaseShift.im;
    
    case 'sg':
      return b.type === 'sg' && a.horizontal === b.horizontal;
    
    case 'mirror':
      return b.type === 'mirror' && vecEqual(a.norm, b.norm);
    
    case 'splitter':
      return b.type === 'splitter' && vecEqual(a.norm, b.norm);
    
    case 'joiner':
      return b.type === 'joiner';
    
    default:
      return false;
  }
}

export function experimentEquals(a: Experiment, b: Experiment): boolean {
  // Check if source branches are equal
  if (!vecEqual(a.source.position, b.source.position)) return false;
  if (!vecEqual(a.source.velocity, b.source.velocity)) return false;
  if (a.source.amplitude.re !== b.source.amplitude.re || 
      a.source.amplitude.im !== b.source.amplitude.im) return false;
  if (!vecEqual(a.source.state, b.source.state)) return false;

  // Check if components maps have the same size
  if (a.components.size !== b.components.size) return false;

  // Check if all components are equal
  for (const [key, componentA] of a.components.entries()) {
    const componentB = b.components.get(key);
    if (!componentB) return false;
    if (!componentEquals(componentA, componentB)) return false;
  }

  return true;
}

