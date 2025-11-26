// Main application component integrating all parts of the quantum simulator

import { useState, useEffect, useCallback, useRef } from 'react';
import Complex from 'complex.js';
import { vec, vecToKey, type Vec } from './core/vec';
import { SPIN_UP } from './core/spin-state';
import type { Branch, Component, Experiment, System } from './core/types';
import { detector, glass, joiner, sg, splitter } from './core/types';
import {
  createSystem,
  systemStep,
  systemCheckForDetection,
  systemDone,
} from './core/simulation';
import { Grid } from './components/Grid';
import { ComponentPalette } from './components/ComponentPalette';
import { SimulationControls } from './components/SimulationControls';
import './App.css';

// Pre-loaded example experiments
const EXAMPLES = {
  doubleSternGerlach: {
    name: 'Double Stern-Gerlach',
    experiment: createExperiment(
      { position: vec(0, 0), velocity: vec(1, 0), state: SPIN_UP, amplitude: new Complex(1, 0) },
      new Map<string, Component>([
        [vecToKey(vec(2, 0)), sg(true)],  // Horizontal SG
        [vecToKey(vec(4, 0)), sg(false)], // Vertical SG
        [vecToKey(vec(2, 2)), detector('L')],
        [vecToKey(vec(4, 2)), detector('D')],
        [vecToKey(vec(6, 0)), detector('U')],
      ])
    ),
  },
  doubleSlit: {
    name: 'Double-Slit',
    experiment: createExperiment(
      { position: vec(0, 0), velocity: vec(1, 0), state: SPIN_UP, amplitude: new Complex(1, 0) },
      new Map<string, Component>([
        [vecToKey(vec(2, 0)), splitter(vec(1, -1))],
        [vecToKey(vec(4, 0)), splitter(vec(1, -1))],
        [vecToKey(vec(2, 2)), splitter(vec(1, -1))],
        [vecToKey(vec(4, 2)), joiner()],
        [vecToKey(vec(2, 6)), detector('A')],
        [vecToKey(vec(8, 2)), detector('B')],
        [vecToKey(vec(8, 0)), detector('C')],
      ])
    ),
  },
  doubleSlitPartialDestructive: {
    name: 'Double-Slit with Phase Shift',
    experiment: createExperiment(
      { position: vec(0, 0), velocity: vec(1, 0), state: SPIN_UP, amplitude: new Complex(1, 0) },
      new Map<string, Component>([
        [vecToKey(vec(2, 0)), splitter(vec(1, -1))],
        [vecToKey(vec(4, 0)), splitter(vec(1, -1))],
        [vecToKey(vec(2, 2)), splitter(vec(1, -1))],
        [vecToKey(vec(4, 1)), glass(new Complex(0, 1))],
        [vecToKey(vec(4, 2)), joiner()],
        [vecToKey(vec(2, 6)), detector('A')],
        [vecToKey(vec(8, 2)), detector('B')],
        [vecToKey(vec(8, 0)), detector('C')],
      ])
    ),
  },
  empty: {
    name: 'Empty Grid',
    experiment: createExperiment(
      { position: vec(0, 0), velocity: vec(1, 0), state: SPIN_UP, amplitude: new Complex(1, 0) },
      new Map<string, Component>()
    ),
  },
};

function createExperiment(source: Branch, components: Map<string, Component>): Experiment {
  return { source, components };
}

function App() {
  // Experiment selection
  const [currentExample, setCurrentExample] = useState<keyof typeof EXAMPLES>('doubleSlit');
  const initialExperiment = EXAMPLES[currentExample].experiment;

  // System state
  const [system, setSystem] = useState<System>(() => createSystem(initialExperiment));
  const [initialSystem, setInitialSystem] = useState<System>(() => createSystem(initialExperiment));

  // UI state
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [stepCount, setStepCount] = useState(0);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  // Animation loop
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastStepTimeRef = useRef<number>(0);

  // Step the simulation
  const step = useCallback(() => {
    setSystem((prevSystem) => {
      const newSystem = systemStep(prevSystem);
      const result = systemCheckForDetection(newSystem);

      if (result) {
        setDetectionResult(result);
        setIsRunning(false);
      } else if (systemDone(newSystem)) {
        setIsRunning(false);
      }

      return newSystem;
    });
    setStepCount((count) => count + 1);
  }, []);

  // Reset the simulation
  const reset = useCallback(() => {
    setSystem(initialSystem);
    setStepCount(0);
    setDetectionResult(null);
    setIsRunning(false);
  }, [initialSystem]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setIsRunning((running) => !running);
  }, []);

  // Add component to grid
  const handleAddComponent = useCallback((position: Vec, component: Component) => {
    const posKey = vecToKey(position);

    setSystem((prevSystem) => {
      const newComponents = new Map(prevSystem.experiment.components);
      newComponents.set(posKey, component);

      const newExperiment = {
        ...prevSystem.experiment,
        components: newComponents,
      };

      const newSystem = createSystem(newExperiment);
      setInitialSystem(newSystem);
      setStepCount(0);
      setDetectionResult(null);
      setIsRunning(false);

      return newSystem;
    });
  }, []);

  // Remove component from grid
  const handleRemoveComponent = useCallback((position: Vec) => {
    const posKey = vecToKey(position);

    setSystem((prevSystem) => {
      const newComponents = new Map(prevSystem.experiment.components);
      newComponents.delete(posKey);

      const newExperiment = {
        ...prevSystem.experiment,
        components: newComponents,
      };

      const newSystem = createSystem(newExperiment);
      setInitialSystem(newSystem);
      setStepCount(0);
      setDetectionResult(null);
      setIsRunning(false);

      return newSystem;
    });
  }, []);

  // Load example experiment
  const loadExample = useCallback((exampleKey: keyof typeof EXAMPLES) => {
    setCurrentExample(exampleKey);
    const example = EXAMPLES[exampleKey];
    const newSystem = createSystem(example.experiment);
    setSystem(newSystem);
    setInitialSystem(newSystem);
    setStepCount(0);
    setDetectionResult(null);
    setIsRunning(false);
    setSelectedComponent(null);
  }, []);

  // Animation loop for auto-play
  useEffect(() => {
    if (!isRunning) return;

    const animate = (timestamp: number) => {
      if (lastStepTimeRef.current === 0) {
        lastStepTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastStepTimeRef.current;
      const interval = 500 / speed; // Base interval is 500ms

      if (elapsed >= interval) {
        step();
        lastStepTimeRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastStepTimeRef.current = 0;
    };
  }, [isRunning, speed, step]);

  return (
    <div className="app">
      {/* Main grid - full screen */}
      <div className="grid-container-wrapper">
        <Grid
          system={system}
          selectedComponent={selectedComponent}
          onAddComponent={handleAddComponent}
          onRemoveComponent={handleRemoveComponent}
        />
      </div>

      {/* Floating component palette on the left */}
      <div className="floating-panel component-palette-floating">
        <ComponentPalette
          selectedComponent={selectedComponent}
          onSelectComponent={setSelectedComponent}
        />
      </div>

      {/* Floating controls on the top right */}
      <div className="floating-panel controls-floating">
        <SimulationControls
          isRunning={isRunning}
          speed={speed}
          stepCount={stepCount}
          detectionResult={detectionResult}
          onStep={step}
          onReset={reset}
          onTogglePlay={togglePlay}
          onSpeedChange={setSpeed}
          onLoadExample={loadExample}
          currentExample={currentExample}
        />
      </div>
    </div>
  );
}

export default App;
