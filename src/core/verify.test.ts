// Verification test to confirm the simulation is working correctly

import { describe, it, expect } from 'vitest';
import Complex from 'complex.js';
import { vec, vecToKey } from './vec';
import { SPIN_UP, SPIN_LEFT } from './spin-state';
import type { Experiment, System } from './types';
import { sg, splitter } from './types';
import { handleSternGerlach, handleSplitter, pruneImpossibleBranches } from './simulation';

describe('Verification - Direct Handler Tests', () => {
  it('handleSternGerlach should create 2 branches (one with amp=0) for SPIN_UP through vertical SG', () => {
    const exp: Experiment = {
      source: {
        position: vec(0, 0),
        velocity: vec(1, 0),
        state: SPIN_UP,
        amplitude: new Complex(1, 0),
      },
      components: new Map([[vecToKey(vec(1, 0)), sg(false)]]),
    };
    
    const sys: System = {
      experiment: exp,
      particle: [{
        position: vec(1, 0),
        velocity: vec(1, 0),
        state: SPIN_UP,
        amplitude: new Complex(1, 0),
      }],
    };

    const result = handleSternGerlach(sys);
    
    console.log('After SG (before pruning):');
    result.particle.forEach((b, i) => {
      console.log(`  Branch ${i}: vel=(${b.velocity.x.re},${b.velocity.y.re}), amp=${b.amplitude.abs()}`);
    });
    
    // Should have 2 branches
    expect(result.particle.length).toBe(2);
    
    // Right branch: amplitude ~1, SPIN_UP
    expect(Math.abs(result.particle[0].amplitude.abs() - 1)).toBeLessThan(0.01);
    expect(result.particle[0].velocity.x.re).toBe(1);
    
    // Down branch: amplitude ~0, SPIN_DOWN
    expect(result.particle[1].amplitude.abs()).toBeLessThan(0.01);
    expect(result.particle[1].velocity.y.re).toBe(1);
    
    // After pruning, should only have 1 branch
    const pruned = pruneImpossibleBranches(result);
    expect(pruned.particle.length).toBe(1);
  });

  it('handleSternGerlach should split SPIN_LEFT through horizontal SG into 2 branches', () => {
    const exp: Experiment = {
      source: {
        position: vec(0, 0),
        velocity: vec(1, 0),
        state: SPIN_LEFT,
        amplitude: new Complex(1, 0),
      },
      components: new Map([[vecToKey(vec(1, 0)), sg(true)]]),
    };
    
    const sys: System = {
      experiment: exp,
      particle: [{
        position: vec(1, 0),
        velocity: vec(1, 0),
        state: SPIN_LEFT,
        amplitude: new Complex(1, 0),
      }],
    };

    const result = handleSternGerlach(sys);
    
    console.log('\nSPIN_LEFT through horizontal SG:');
    result.particle.forEach((b, i) => {
      console.log(`  Branch ${i}: vel=(${b.velocity.x.re},${b.velocity.y.re}), amp=${b.amplitude.abs()}`);
    });
    
    // Should have 2 branches
    expect(result.particle.length).toBe(2);
    
    // Right branch: amplitude ~0, SPIN_RIGHT
    expect(result.particle[0].amplitude.abs()).toBeLessThan(0.01);
    expect(result.particle[0].velocity.x.re).toBe(1);
    
    // Down branch: amplitude ~1, SPIN_LEFT  
    expect(Math.abs(result.particle[1].amplitude.abs() - 1)).toBeLessThan(0.01);
    expect(result.particle[1].velocity.y.re).toBe(1);
  });

  it('handleSplitter should always create 2 branches', () => {
    const exp: Experiment = {
      source: {
        position: vec(0, 0),
        velocity: vec(1, 0),
        state: SPIN_UP,
        amplitude: new Complex(1, 0),
      },
      components: new Map([[vecToKey(vec(1, 0)), splitter(vec(1, 1))]]),
    };
    
    const sys: System = {
      experiment: exp,
      particle: [{
        position: vec(1, 0),
        velocity: vec(1, 0),
        state: SPIN_UP,
        amplitude: new Complex(1, 0),
      }],
    };

    const result = handleSplitter(sys);
    
    console.log('\nAfter splitter:');
    result.particle.forEach((b, i) => {
      console.log(`  Branch ${i}: vel=(${b.velocity.x.re},${b.velocity.y.re}), amp=${b.amplitude}`);
    });
    
    // Should ALWAYS have 2 branches (both non-zero)
    expect(result.particle.length).toBe(2);
    
    // Both should have non-zero amplitude
    expect(result.particle[0].amplitude.abs()).toBeGreaterThan(0);
    expect(result.particle[1].amplitude.abs()).toBeGreaterThan(0);
  });
});

