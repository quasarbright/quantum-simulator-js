// Unit tests ported from the Racket implementation
// These tests verify that the simulation logic matches the original exactly

import { describe, it, expect, beforeEach } from 'vitest';
import Complex from 'complex.js';
import { vec, vecEqual, vecToKey } from './vec';
import { SPIN_UP, SPIN_DOWN, SPIN_LEFT, SPIN_RIGHT } from './spin-state';
import type { Branch, Experiment, System } from './types';
import { detector, joiner, mirror, sg, splitter } from './types';
import {
  systemRenormalize,
  setChoiceFunction,
  handleDetector,
  handleJoiner,
  handleMirror,
  handleSternGerlach,
  handleSplitter,
  handleVelocity,
  handlePhaseShift,
  handleInterference,
} from './simulation';

const rad2 = Math.sqrt(2);
const inv_rad2 = 1 / rad2;

// Example branch for testing
const exampleBranch: Branch = {
  position: vec(0, 0),
  velocity: vec(1, 0),
  state: SPIN_UP,
  amplitude: new Complex(1, 0),
};

// Example experiment for testing
const exampleExperiment: Experiment = {
  source: exampleBranch,
  components: new Map([[vecToKey(vec(2, 0)), detector('A')]]),
};

// Helper to compare complex numbers with tolerance
function expectComplexClose(actual: Complex, expected: Complex, tolerance = 0.0001) {
  expect(Math.abs(actual.re - expected.re)).toBeLessThan(tolerance);
  expect(Math.abs(actual.im - expected.im)).toBeLessThan(tolerance);
}

// Helper to compare branches
function expectBranchesEqual(actual: Branch[], expected: Branch[], tolerance = 0.0001) {
  expect(actual.length).toBe(expected.length);
  
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i];
    const e = expected[i];
    
    expect(vecEqual(a.position, e.position)).toBe(true);
    expect(vecEqual(a.velocity, e.velocity)).toBe(true);
    expectComplexClose(a.amplitude, e.amplitude, tolerance);
    
    // Check spin state
    expectComplexClose(a.state.x, e.state.x, tolerance);
    expectComplexClose(a.state.y, e.state.y, tolerance);
  }
}

describe('Quantum Simulator - Core Logic', () => {
  describe('systemRenormalize', () => {
    it('should normalize two branches with amplitude 1 to amplitude 1/√2', () => {
      const sys: System = {
        experiment: exampleExperiment,
        particle: [
          { position: vec(0, 0), velocity: vec(0, 0), state: vec(1, 0), amplitude: new Complex(1, 0) },
          { position: vec(1, 0), velocity: vec(0, 0), state: vec(1, 0), amplitude: new Complex(1, 0) },
        ],
      };

      const normalized = systemRenormalize(sys);

      expectBranchesEqual(normalized.particle, [
        { position: vec(0, 0), velocity: vec(0, 0), state: vec(1, 0), amplitude: new Complex(inv_rad2, 0) },
        { position: vec(1, 0), velocity: vec(0, 0), state: vec(1, 0), amplitude: new Complex(inv_rad2, 0) },
      ]);
    });
  });

  describe('handleMirror', () => {
    it('should reflect particle from (1,0) velocity to (0,-1) with -1 phase shift', () => {
      const exp: Experiment = {
        source: exampleBranch,
        components: new Map([[vecToKey(vec(1, 0)), mirror(vec(1, 1))]]),
      };
      const brnch: Branch = {
        position: vec(1, 0),
        velocity: vec(1, 0),
        state: SPIN_UP,
        amplitude: new Complex(1, 0),
      };
      const sys: System = { experiment: exp, particle: [brnch] };

      const result = handleMirror(sys);

      expectBranchesEqual(result.particle, [
        {
          position: vec(1, 0),
          velocity: vec(0, -1),
          state: SPIN_UP,
          amplitude: new Complex(-1, 0), // 180° phase shift
        },
      ]);
    });
  });

  describe('handleSternGerlach', () => {
    it('should split SPIN_UP through vertical SG: amplitude 1 right, 0 down', () => {
      const exp: Experiment = {
        source: exampleBranch,
        components: new Map([[vecToKey(vec(1, 0)), sg(false)]]),
      };
      const brnch: Branch = {
        position: vec(1, 0),
        velocity: vec(1, 0),
        state: SPIN_UP,
        amplitude: new Complex(1, 0),
      };
      const sys: System = { experiment: exp, particle: [brnch] };

      const result = handleSternGerlach(sys);

      expectBranchesEqual(result.particle, [
        {
          position: vec(1, 0),
          velocity: vec(1, 0),
          state: SPIN_UP,
          amplitude: new Complex(1, 0),
        },
        {
          position: vec(1, 0),
          velocity: vec(0, 1),
          state: SPIN_DOWN,
          amplitude: new Complex(0, 0),
        },
      ]);
    });

    it('should split SPIN_LEFT through horizontal SG: amplitude 0 right, 1 down', () => {
      const exp: Experiment = {
        source: exampleBranch,
        components: new Map([[vecToKey(vec(1, 0)), sg(true)]]),
      };
      const brnch: Branch = {
        position: vec(1, 0),
        velocity: vec(1, 0),
        state: SPIN_LEFT,
        amplitude: new Complex(1, 0),
      };
      const sys: System = { experiment: exp, particle: [brnch] };

      const result = handleSternGerlach(sys);

      expectBranchesEqual(result.particle, [
        {
          position: vec(1, 0),
          velocity: vec(1, 0),
          state: SPIN_RIGHT,
          amplitude: new Complex(0, 0),
        },
        {
          position: vec(1, 0),
          velocity: vec(0, 1),
          state: SPIN_LEFT,
          amplitude: new Complex(1, 0),
        },
      ], 0.01); // Higher tolerance for floating point in SG calculations
    });
  });

  describe('handleSplitter', () => {
    it('should create transmitted and reflected branches with +i phase shift', () => {
      const exp: Experiment = {
        source: exampleBranch,
        components: new Map([[vecToKey(vec(1, 0)), splitter(vec(1, 1))]]),
      };
      const brnch: Branch = {
        position: vec(1, 0),
        velocity: vec(1, 0),
        state: SPIN_UP,
        amplitude: new Complex(1, 0),
      };
      const sys: System = { experiment: exp, particle: [brnch] };

      const result = handleSplitter(sys);

      expectBranchesEqual(result.particle, [
        brnch, // Transmitted
        {
          position: vec(1, 0),
          velocity: vec(0, -1),
          state: SPIN_UP,
          amplitude: new Complex(0, 1), // +90° phase shift
        },
      ]);
    });
  });

  describe('handleJoiner', () => {
    it('should redirect down-moving particle to right with -i phase shift', () => {
      const exp: Experiment = {
        source: exampleBranch,
        components: new Map([[vecToKey(vec(1, 0)), joiner()]]),
      };
      const brnch: Branch = {
        position: vec(1, 0),
        velocity: vec(0, 1),
        state: SPIN_UP,
        amplitude: new Complex(1, 0),
      };
      const sys: System = { experiment: exp, particle: [brnch] };

      const result = handleJoiner(sys);

      expectBranchesEqual(result.particle, [
        {
          position: vec(1, 0),
          velocity: vec(1, 0),
          state: SPIN_UP,
          amplitude: new Complex(0, -1), // -90° phase shift
        },
      ]);
    });
  });

  describe('handleVelocity', () => {
    it('should move particle by velocity', () => {
      const sys: System = {
        experiment: exampleExperiment,
        particle: [exampleBranch],
      };

      const result = handleVelocity(sys);

      expectBranchesEqual(result.particle, [
        {
          position: vec(1, 0),
          velocity: vec(1, 0),
          state: SPIN_UP,
          amplitude: new Complex(1, 0),
        },
      ]);
    });
  });

  describe('handlePhaseShift', () => {
    it('should apply time evolution and momentum phase shift (right-moving)', () => {
      const sys: System = {
        experiment: exampleExperiment,
        particle: [exampleBranch],
      };

      const result = handlePhaseShift(sys);

      // Time evolution: -1 (e^iπ)
      // Momentum: i (e^iπ/2) for x velocity
      // Total: -1 * i = -i = 0-1i
      expectBranchesEqual(result.particle, [
        {
          position: vec(0, 0),
          velocity: vec(1, 0),
          state: SPIN_UP,
          amplitude: new Complex(0, -1),
        },
      ]);
    });

    it('should apply opposite phase shift for left-moving particle', () => {
      const leftMovingBranch: Branch = {
        ...exampleBranch,
        velocity: vec(-1, 0),
      };
      const sys: System = {
        experiment: exampleExperiment,
        particle: [leftMovingBranch],
      };

      const result = handlePhaseShift(sys);

      // Time evolution: -1
      // Momentum: -i (for negative x velocity)
      // Total: -1 * -i = i = 0+1i
      expectBranchesEqual(result.particle, [
        {
          position: vec(0, 0),
          velocity: vec(-1, 0),
          state: SPIN_UP,
          amplitude: new Complex(0, 1),
        },
      ]);
    });
  });

  describe('handleInterference', () => {
    it('should handle destructive and constructive interference', () => {
      const sys: System = {
        experiment: exampleExperiment,
        particle: [
          // Destructive interference (same position/velocity, opposite amplitudes)
          { position: vec(0, 0), velocity: vec(1, 0), state: SPIN_UP, amplitude: new Complex(0.5, 0) },
          { position: vec(0, 0), velocity: vec(1, 0), state: SPIN_UP, amplitude: new Complex(-0.5, 0) },
          // Constructive interference (different velocity)
          { position: vec(0, 0), velocity: vec(0, 1), state: SPIN_UP, amplitude: new Complex(0.5, 0) },
          { position: vec(0, 0), velocity: vec(0, 1), state: SPIN_DOWN, amplitude: new Complex(0.5, 0) },
        ],
      };

      const result = handleInterference(sys);

      expect(result.particle.length).toBe(2);
      
      // First branch: destructive interference (zero amplitude)
      expectComplexClose(result.particle[0].amplitude, new Complex(0, 0));
      
      // Second branch: constructive interference
      // State should be SPIN_RIGHT (normalized sum of SPIN_UP and SPIN_DOWN)
      expectComplexClose(result.particle[1].amplitude, new Complex(1, 0));
      expectComplexClose(result.particle[1].state.x, new Complex(inv_rad2, 0));
      expectComplexClose(result.particle[1].state.y, new Complex(inv_rad2, 0));
    });

    it('should handle spin annihilation edge case', () => {
      const sys: System = {
        experiment: exampleExperiment,
        particle: [
          { position: vec(0, 0), velocity: vec(1, 0), state: SPIN_UP, amplitude: new Complex(inv_rad2, 0) },
          { position: vec(0, 0), velocity: vec(1, 0), state: vec(-1, 0), amplitude: new Complex(inv_rad2, 0) }, // -SPIN_UP
        ],
      };

      const result = handleInterference(sys);

      // Spins cancel out, amplitude becomes 0
      expect(result.particle.length).toBe(1);
      expectComplexClose(result.particle[0].amplitude, new Complex(0, 0));
    });
  });

  describe('handleDetector', () => {
    beforeEach(() => {
      // Reset to default random choice
      setChoiceFunction((p) => Math.random() < p);
    });

    it('should collapse to detected branch when choice returns true', () => {
      setChoiceFunction(() => true); // Always choose first branch

      const sys: System = {
        experiment: exampleExperiment,
        particle: [
          { position: vec(2, 0), velocity: vec(1, 0), state: vec(1, 0), amplitude: new Complex(inv_rad2, 0) },
          { position: vec(0, 1), velocity: vec(1, 0), state: vec(1, 0), amplitude: new Complex(inv_rad2, 0) },
        ],
      };

      const result = handleDetector(sys);

      // Should collapse to first branch with amplitude 1 and zero velocity
      expect(result.particle.length).toBe(1);
      expect(vecEqual(result.particle[0].position, vec(2, 0))).toBe(true);
      expect(vecEqual(result.particle[0].velocity, vec(0, 0))).toBe(true);
      expectComplexClose(result.particle[0].amplitude, new Complex(1, 0));
    });

    it('should delete branch and renormalize when choice returns false', () => {
      setChoiceFunction(() => false); // Always reject

      const sys: System = {
        experiment: exampleExperiment,
        particle: [
          { position: vec(2, 0), velocity: vec(1, 0), state: vec(1, 0), amplitude: new Complex(inv_rad2, 0) },
          { position: vec(0, 1), velocity: vec(1, 0), state: vec(1, 0), amplitude: new Complex(inv_rad2, 0) },
        ],
      };

      const result = handleDetector(sys);

      // Should delete first branch and renormalize second to amplitude 1
      expect(result.particle.length).toBe(1);
      expect(vecEqual(result.particle[0].position, vec(0, 1))).toBe(true);
      expectComplexClose(result.particle[0].amplitude, new Complex(1, 0));
    });
  });
});

