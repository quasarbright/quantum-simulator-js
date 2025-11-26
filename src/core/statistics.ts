// Monte Carlo simulation for statistical analysis

import { createSystem, systemStep, systemCheckForDetection, systemDone } from './simulation';
import type { Experiment, System } from './types';

export interface SimulationResult {
  detectorName: string | null;
  steps: number;
}

export interface StatisticsResult {
  totalRuns: number;
  detectionCounts: Map<string, number>;
  noDetectionCount: number;
  averageSteps: number;
  minSteps: number;
  maxSteps: number;
}

const MAX_STEPS = 1000; // Prevent infinite loops

export function runExperimentMultipleTimes(
  experiment: Experiment,
  numRuns: number,
  onProgress?: (current: number, total: number) => void
): StatisticsResult {
  const detectionCounts = new Map<string, number>();
  let noDetectionCount = 0;
  let totalSteps = 0;
  let minSteps = Infinity;
  let maxSteps = 0;

  for (let i = 0; i < numRuns; i++) {
    const result = runSingleExperiment(experiment);
    
    if (result.detectorName) {
      const count = detectionCounts.get(result.detectorName) || 0;
      detectionCounts.set(result.detectorName, count + 1);
    } else {
      noDetectionCount++;
    }
    
    totalSteps += result.steps;
    minSteps = Math.min(minSteps, result.steps);
    maxSteps = Math.max(maxSteps, result.steps);
    
    // Report progress every 10 runs
    if (onProgress && (i + 1) % 10 === 0) {
      onProgress(i + 1, numRuns);
    }
  }

  // Final progress update
  if (onProgress) {
    onProgress(numRuns, numRuns);
  }

  return {
    totalRuns: numRuns,
    detectionCounts,
    noDetectionCount,
    averageSteps: totalSteps / numRuns,
    minSteps: minSteps === Infinity ? 0 : minSteps,
    maxSteps,
  };
}

function runSingleExperiment(experiment: Experiment): SimulationResult {
  let system: System = createSystem(experiment);
  let steps = 0;

  while (steps < MAX_STEPS) {
    // Check for detection before stepping
    const detectionResult = systemCheckForDetection(system);
    if (detectionResult) {
      return {
        detectorName: detectionResult.name,
        steps,
      };
    }

    // Check if simulation is done
    if (systemDone(system)) {
      return {
        detectorName: null,
        steps,
      };
    }

    // Step the simulation
    system = systemStep(system);
    steps++;
  }

  // Hit max steps without detection
  return {
    detectorName: null,
    steps,
  };
}

