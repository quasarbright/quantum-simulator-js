// Experiment validation utilities

import type { Experiment, Component } from './types';
import type { Vec } from './vec';

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  position?: Vec;
  component?: Component;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

// Note: Removed isReachableFromSource as it was too complex for simple validation
// Using simpler heuristics instead

export function validateExperiment(experiment: Experiment): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  
  const { source, components } = experiment;
  
  // Check for component at source position
  const sourceKey = `${source.position.x.re},${source.position.x.im},${source.position.y.re},${source.position.y.im}`;
  if (components.has(sourceKey)) {
    errors.push({
      type: 'error',
      message: 'Component placed at source position - particles cannot spawn',
      position: source.position,
    });
  }
  
  // Check for detectors
  let hasDetector = false;
  components.forEach((component) => {
    if (component.type === 'detector') {
      hasDetector = true;
    }
  });
  
  if (!hasDetector) {
    warnings.push({
      type: 'warning',
      message: 'No detectors in experiment - simulation may run indefinitely',
    });
  }
  
  // Check SG alignment
  components.forEach((component, key) => {
    const parts = key.split(',');
    const position = {
      x: { re: parseFloat(parts[0]), im: parseFloat(parts[1]) },
      y: { re: parseFloat(parts[2]), im: parseFloat(parts[3]) },
    } as Vec;
    
    if (component.type === 'sg') {
      // SG only affects particles moving right
      // Check if there's a reasonable path for particles to reach this SG
      const xDist = position.x.re - source.position.x.re;
      
      if (xDist < 0) {
        warnings.push({
          type: 'warning',
          message: 'Stern-Gerlach apparatus is to the left of source - will not affect particles',
          position,
          component,
        });
      }
    }
    
    if (component.type === 'joiner') {
      // Joiner only affects particles moving down
      // No validation warning for now as this is complex to check properly
    }
  });
  
  // Check for unreachable components (simple heuristic)
  components.forEach((component, key) => {
    const parts = key.split(',');
    const position = {
      x: { re: parseFloat(parts[0]), im: parseFloat(parts[1]) },
      y: { re: parseFloat(parts[2]), im: parseFloat(parts[3]) },
    } as Vec;
    
    // Simple check: is component too far from source without intermediate components?
    const xDist = Math.abs(position.x.re - source.position.x.re);
    const yDist = Math.abs(position.y.re - source.position.y.re);
    const manhattanDist = xDist + yDist;
    
    // If component is far away, check if there are intermediate components
    if (manhattanDist > 3) {
      let hasIntermediateComponents = false;
      components.forEach((_, otherKey) => {
        if (otherKey !== key) {
          const otherParts = otherKey.split(',');
          const otherPos = {
            x: { re: parseFloat(otherParts[0]), im: parseFloat(otherParts[1]) },
            y: { re: parseFloat(otherParts[2]), im: parseFloat(otherParts[3]) },
          } as Vec;
          
          const xDistToOther = Math.abs(otherPos.x.re - source.position.x.re);
          const yDistToOther = Math.abs(otherPos.y.re - source.position.y.re);
          
          if (xDistToOther < xDist && yDistToOther < yDist) {
            hasIntermediateComponents = true;
          }
        }
      });
      
      if (!hasIntermediateComponents && manhattanDist > 10) {
        warnings.push({
          type: 'warning',
          message: 'Component may be unreachable from source (no intermediate components or reflectors)',
          position,
          component,
        });
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

