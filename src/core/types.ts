// Core data structures for the quantum simulator

import type Complex from 'complex.js';
import type { Vec } from './vec';
import type { SpinState } from './spin-state';

// A Branch represents a possible path/state of a particle
export interface Branch {
  position: Vec;
  velocity: Vec;
  state: QuantumState;
  amplitude: Complex;
}

// A Particle is a superposition of possibilities (list of branches)
export type Particle = Branch[];

// A QuantumState (currently only SpinState for electrons)
// TODO: Add polarization state for photons
export type QuantumState = SpinState;

// Component types using discriminated unions

export interface SG {
  type: 'sg';
  horizontal: boolean; // true = horizontal spin measurement, false = vertical
}

export interface Detector {
  type: 'detector';
  name: string;
}

export interface Splitter {
  type: 'splitter';
  norm: Vec; // Normal vector of the splitter surface (diagonal only)
}

export interface Joiner {
  type: 'joiner';
}

export interface Mirror {
  type: 'mirror';
  norm: Vec; // Normal vector of the mirror surface (diagonal only)
}

export interface Glass {
  type: 'glass';
  phaseShift: Complex; // Complex number to multiply with branch amplitude
}

export type Component = SG | Detector | Splitter | Joiner | Mirror | Glass;

// Mode represents the current editing mode in the UI
export type Mode = Component | 'PAN' | 'SELECT' | 'ERASER';

// Helper functions to create components
export function sg(horizontal: boolean): SG {
  return { type: 'sg', horizontal };
}

export function detector(name: string): Detector {
  return { type: 'detector', name };
}

export function splitter(norm: Vec): Splitter {
  return { type: 'splitter', norm };
}

export function joiner(): Joiner {
  return { type: 'joiner' };
}

export function mirror(norm: Vec): Mirror {
  return { type: 'mirror', norm };
}

export function glass(phaseShift: Complex): Glass {
  return { type: 'glass', phaseShift };
}

// An Experiment represents the static configuration of an experiment
export interface Experiment {
  source: Branch; // Initial state of particle being fired
  components: Map<string, Component>; // Map from position key to component
}

// A System represents an experiment with particles running through it
export interface System {
  experiment: Experiment;
  particle: Particle;
}

// A Result is either a detected particle or no detection
export type Result = Detector | null;

