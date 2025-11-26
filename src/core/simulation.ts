// Main simulation logic with all handlers
// Ported from the Racket implementation to preserve exact behavior and edge cases

import Complex from 'complex.js';
import { produce } from 'immer';
import {
  vec,
  vecAdd,
  vecDot,
  vecEqual,
  vecNormalize,
  vecReflect,
  vecScale,
  vecZero,
  vecToKey,
  vecRound,
  type Vec,
} from './vec';
import { SPIN_UP, SPIN_DOWN, SPIN_LEFT, SPIN_RIGHT } from './spin-state';
import type {
  Branch,
  Component,
  Experiment,
  Glass,
  Joiner,
  Mirror,
  Particle,
  Result,
  SG,
  Splitter,
  System,
} from './types';

// Create a new system from an experiment
export function createSystem(experiment: Experiment): System {
  return {
    experiment,
    particle: [experiment.source],
  };
}

// Emit a particle from the source
export function experimentEmitParticle(ex: Experiment): Particle {
  return [ex.source];
}

// Calculate branch probability (amplitude * conjugate)
export function branchProbability(branch: Branch): number {
  const amp = branch.amplitude;
  return amp.mul(amp.conjugate()).re;
}

// Get bounds of the system
export function systemBounds(sys: System): {
  minx: number;
  maxx: number;
  miny: number;
  maxy: number;
} {
  const positions: Vec[] = [sys.experiment.source.position];

  sys.experiment.components.forEach((_, key) => {
    // Parse position from key
    const [xRe, xIm, yRe, yIm] = key.split(',').map(Number);
    positions.push(vec(new Complex(xRe, xIm), new Complex(yRe, yIm)));
  });

  let minx = Infinity;
  let maxx = -Infinity;
  let miny = Infinity;
  let maxy = -Infinity;

  positions.forEach((pos) => {
    const x = pos.x.re;
    const y = pos.y.re;
    minx = Math.min(minx, x);
    maxx = Math.max(maxx, x);
    miny = Math.min(miny, y);
    maxy = Math.max(maxy, y);
  });

  return {
    minx: Math.round(minx),
    maxx: Math.round(maxx),
    miny: Math.round(miny),
    maxy: Math.round(maxy),
  };
}

// Check if a branch has escaped the system
export function branchEscaped(sys: System, branch: Branch): boolean {
  const px = branch.position.x.re;
  const py = branch.position.y.re;
  const vx = branch.velocity.x.re;
  const vy = branch.velocity.y.re;

  const { minx, maxx, miny, maxy } = systemBounds(sys);

  return (
    (px > maxx && vx > 0) ||
    (px < minx && vx < 0) ||
    (py > maxy && vy > 0) ||
    (py < miny && vy < 0)
  );
}

// Check if system is done (no more particles or all escaped)
export function systemDone(sys: System): boolean {
  if (sys.particle.length === 0) return true;

  return sys.particle.every(
    (branch) =>
      branchEscaped(sys, branch) || vecZero(branch.velocity)
  );
}

// Check for particle detection
export function systemCheckForDetection(sys: System): Result {
  for (const branch of sys.particle) {
    for (const [posKey, cmp] of sys.experiment.components.entries()) {
      if (
        cmp.type === 'detector' &&
        vecEqual(branch.position, parseVecFromKey(posKey)) &&
        vecZero(branch.velocity)
      ) {
        return cmp;
      }
    }
  }
  return null;
}

// Parse Vec from key string
function parseVecFromKey(key: string): Vec {
  const [xRe, xIm, yRe, yIm] = key.split(',').map(Number);
  return vec(new Complex(xRe, xIm), new Complex(yRe, yIm));
}

// Random choice based on probability
let currentChoiceFn = (p: number) => Math.random() < p;

export function setChoiceFunction(fn: (p: number) => boolean) {
  currentChoiceFn = fn;
}

function choice(p: number): boolean {
  return currentChoiceFn(p);
}

// Step the system one timestep
export function systemStep(sys: System): System {
  // Order matters! Must match Racket implementation exactly
  const handlers = [
    handleDetector,
    handleJoiner,
    handleMirror,
    handleGlass,
    handleSternGerlach,
    handleSplitter,
    handleVelocity,
    handlePhaseShift,
    handleInterference,
    pruneImpossibleBranches,
    systemRenormalize,
  ];

  let result = sys;
  for (const handler of handlers) {
    result = handler(result);
  }
  return result;
}

// Run system until detection or completion
export function systemSteps(sys: System): Result {
  const stepped = systemStep(sys);
  const maybeDetector = systemCheckForDetection(stepped);

  if (maybeDetector) return maybeDetector;
  if (systemDone(sys)) return null;

  return systemSteps(stepped);
}

// Handler: Detector - probabilistic wave function collapse
export function handleDetector(sys: System): System {
  for (const [posKey, cmp] of sys.experiment.components.entries()) {
    if (cmp.type !== 'detector') continue;

    const pos = parseVecFromKey(posKey);
    
    // Process branches at detector position one at a time
    // Must refresh the list after each deletion since object references change
    while (true) {
      const branchesInDetector = sys.particle.filter((b) =>
        vecEqual(b.position, pos)
      );
      
      if (branchesInDetector.length === 0) break;
      
      const branch = branchesInDetector[0];
      const p = branchProbability(branch);
      
      if (choice(p)) {
        // Particle detected - collapse to this branch and return immediately
        return detectParticle(sys, branch);
      } else {
        // Delete this branch and check remaining branches
        sys = deleteBranch(sys, branch);
      }
    }
  }

  return sys;
}

// Detect a particle (collapse wave function)
function detectParticle(sys: System, branch: Branch): System {
  return produce(sys, (draft) => {
    draft.particle = [
      {
        ...branch,
        amplitude: new Complex(1, 0),
        velocity: vec(0, 0),
      },
    ];
  });
}

// Delete a branch from the system
function deleteBranch(sys: System, branch: Branch): System {
  const newParticle = sys.particle.filter((b) => b !== branch);
  return systemRenormalize({
    ...sys,
    particle: newParticle,
  });
}

// Handler: Joiner - particles from up/left go right
export function handleJoiner(sys: System): System {
  return handleComponent(sys, (cmp): cmp is Joiner => cmp.type === 'joiner', (_sys, _pos, _cmp, branch) => {
    // Only affect particles moving down (0, 1)
    if (vecEqual(branch.velocity, vec(0, 1))) {
      return [
        {
          ...branch,
          velocity: vec(1, 0),
          // -90 degree phase shift
          amplitude: branch.amplitude.mul(new Complex(0, -1)),
        },
      ];
    }
    return [branch];
  });
}

// Handler: Mirror - reflect particles with 180° phase shift
export function handleMirror(sys: System): System {
  return handleComponent(sys, (cmp): cmp is Mirror => cmp.type === 'mirror', (_sys, _pos, mrr, branch) => {
    const v = branch.velocity;
    const n = mrr.norm;
    const vReflected = vecReflect(v, n);
    const vRounded = vecRound(vReflected);

    return [
      {
        ...branch,
        velocity: vRounded,
        // 180 degree phase shift
        amplitude: branch.amplitude.mul(-1),
      },
    ];
  });
}

// Handler: Glass - phase shift
export function handleGlass(sys: System): System {
  return handleComponent(sys, (cmp): cmp is Glass => cmp.type === 'glass', (_sys, _pos, gls, branch) => {
    return [
      {
        ...branch,
        amplitude: branch.amplitude.mul(gls.phaseShift),
      },
    ];
  });
}

// Handler: Stern-Gerlach - spin measurement creating spatial superposition
export function handleSternGerlach(sys: System): System {
  return systemRenormalize(
    handleComponent(sys, (cmp): cmp is SG => cmp.type === 'sg', (_sys, _pos, sg, branch) => {
      const s1 = sg.horizontal ? SPIN_RIGHT : SPIN_UP;
      const s2 = sg.horizontal ? SPIN_LEFT : SPIN_DOWN;

      // Only affect particles moving right
      if (vecEqual(branch.velocity, vec(1, 0))) {
        // Translate spin superposition to position/momentum superposition
        const amp1 = vecDot(s1, branch.state);
        const amp2 = vecDot(s2, branch.state);

        return [
          {
            ...branch,
            velocity: vec(1, 0),
            amplitude: branch.amplitude.mul(amp1),
            state: s1,
          },
          {
            ...branch,
            velocity: vec(0, 1),
            amplitude: branch.amplitude.mul(amp2),
            state: s2,
          },
        ];
      }

      return [branch];
    })
  );
}

// Handler: Splitter - beam splitter creating spatial superposition
export function handleSplitter(sys: System): System {
  return handleComponent(sys, (cmp): cmp is Splitter => cmp.type === 'splitter', (_sys, _pos, spl, branch) => {
    const v = branch.velocity;
    const n = spl.norm;
    const vReflected = vecReflect(v, n);
    const vRounded = vecRound(vReflected);

    return [
      branch, // Transmitted beam
      {
        ...branch,
        velocity: vRounded,
        // +90 degree phase shift for reflected beam
        amplitude: branch.amplitude.mul(new Complex(0, 1)),
      },
    ];
  });
}

// Handler: Velocity - move particles
export function handleVelocity(sys: System): System {
  return systemMapBranches(sys, (branch) => ({
    ...branch,
    position: vecAdd(branch.position, branch.velocity),
  }));
}

// Phase shift constants
const TIME_EVOLUTION_PHASE_SHIFT = -1; // e^(i*pi)
const MOMENTUM_PHASE_SHIFT = vec(new Complex(0, 1), new Complex(0, 1)); // e^(i*pi/2) for both x and y

// Handler: Phase shift from time evolution and momentum
export function handlePhaseShift(sys: System): System {
  return systemMapBranches(sys, (branch) => {
    if (vecZero(branch.velocity)) return branch;

    const timePhase = new Complex(TIME_EVOLUTION_PHASE_SHIFT, 0);
    const momentumPhase = vecDot(branch.velocity, MOMENTUM_PHASE_SHIFT);
    const totalPhase = timePhase.mul(momentumPhase);

    return {
      ...branch,
      amplitude: branch.amplitude.mul(totalPhase),
    };
  });
}

// Handler: Interference - combine branches at same position/velocity
export function handleInterference(sys: System): System {
  // Group branches by (position, velocity)
  const groups = new Map<string, Branch[]>();

  for (const branch of sys.particle) {
    const key = `${vecToKey(branch.position)}|${vecToKey(branch.velocity)}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(branch);
  }

  // Combine each group
  const newParticle: Particle = [];

  groups.forEach((branches) => {
    if (branches.length === 1) {
      newParticle.push(branches[0]);
      return;
    }

    const branch0 = branches[0];

    // Sum spin states weighted by branch amplitude
    let spinSum = vec(0, 0);
    for (const branch of branches) {
      const weighted = vecScale(branch.amplitude, branch.state);
      spinSum = vecAdd(spinSum, weighted);
    }

    // If destructive interference in spin, mark as zero amplitude
    if (vecZero(spinSum)) {
      newParticle.push({
        ...branch0,
        amplitude: new Complex(0, 0),
      });
    } else {
      // Sum amplitudes
      let totalAmp = new Complex(0, 0);
      for (const branch of branches) {
        totalAmp = totalAmp.add(branch.amplitude);
      }

      newParticle.push({
        position: branch0.position,
        velocity: branch0.velocity,
        state: vecNormalize(spinSum),
        amplitude: totalAmp,
      });
    }
  });

  return {
    ...sys,
    particle: newParticle,
  };
}

// Prune branches with zero amplitude
export function pruneImpossibleBranches(sys: System): System {
  return {
    ...sys,
    particle: sys.particle.filter((branch) => branch.amplitude.abs() !== 0),
  };
}

// Renormalize to ensure unitarity
export function systemRenormalize(sys: System): System {
  if (sys.particle.length === 0) return sys;

  const totalProbability = sys.particle.reduce(
    (sum, branch) => sum + branchProbability(branch),
    0
  );

  if (totalProbability === 0 || totalProbability === 1) return sys;

  const normFactor = 1 / Math.sqrt(totalProbability);

  return {
    ...sys,
    particle: sys.particle.map((branch) => ({
      ...branch,
      amplitude: branch.amplitude.mul(normFactor),
    })),
  };
}

// Helper: Apply a transformation to all branches
function systemMapBranches(sys: System, f: (branch: Branch) => Branch): System {
  return {
    ...sys,
    particle: sys.particle.map(f),
  };
}

// Helper: Handle components that affect branches at specific positions
function handleComponent<T extends Component>(
  sys: System,
  predicate: (cmp: Component) => cmp is T,
  handler: (sys: System, pos: Vec, cmp: T, branch: Branch) => Branch[]
): System {
  let result = sys;

  for (const [posKey, cmp] of sys.experiment.components.entries()) {
    if (!predicate(cmp)) continue;

    const pos = parseVecFromKey(posKey);

    result = {
      ...result,
      particle: result.particle.flatMap((branch) => {
        if (vecEqual(branch.position, pos)) {
          return handler(result, pos, cmp, branch);
        }
        return [branch];
      }),
    };
  }

  return result;
}

// Run experiment many times to get probability distribution
export function experimentRun(ex: Experiment, iterations = 100): Map<string, number> {
  const sys = createSystem(ex);
  const counts = new Map<string, number>();

  for (let i = 0; i < iterations; i++) {
    const result = systemSteps(sys);
    const key = result ? result.name : 'none';
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // Convert to probabilities
  const probabilities = new Map<string, number>();
  counts.forEach((count, key) => {
    probabilities.set(key, count / iterations);
  });

  return probabilities;
}

