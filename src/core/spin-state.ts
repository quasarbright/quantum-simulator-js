// Quantum spin state, restricted to horizontal and vertical bases

import Complex from 'complex.js';
import { vec, type Vec } from './vec';

// A SpinState is a Vec where:
// x is a Complex representing the spin-up (z-axis) amplitude
// y is a Complex representing the spin-down (z-axis) amplitude
// Represents the state of an electron's spin, decomposed into the vertical basis
export type SpinState = Vec;

const rad2 = Math.sqrt(2);
const inv_rad2 = 1 / rad2;

// Helper to create a spin state with validation
export function spinState(
  up: number | Complex,
  down: number | Complex
): SpinState {
  const upComplex = typeof up === 'number' ? new Complex(up, 0) : up;
  const downComplex = typeof down === 'number' ? new Complex(down, 0) : down;

  // Validate that probability sums to 1
  const upMag = upComplex.abs();
  const downMag = downComplex.abs();
  const totalProb = upMag * upMag + downMag * downMag;

  if (Math.abs(totalProb - 1) > 0.0001) {
    console.warn(
      `Spin state probability is ${totalProb}, expected 1. Normalizing...`
    );
  }

  return vec(upComplex, downComplex);
}

// Standard spin states
export const SPIN_UP = spinState(1, 0); // positive in z
export const SPIN_DOWN = spinState(0, 1); // negative in z
export const SPIN_LEFT = spinState(inv_rad2, -inv_rad2); // negative in x
export const SPIN_RIGHT = spinState(inv_rad2, inv_rad2); // positive in x
export const SPIN_OUT = spinState(inv_rad2, new Complex(0, inv_rad2)); // positive in y
export const SPIN_IN = spinState(inv_rad2, new Complex(0, -inv_rad2)); // negative in y

