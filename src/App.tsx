// Main application component integrating all parts of the quantum simulator

import { useState, useEffect, useCallback, useRef } from 'react';
import Complex from 'complex.js';
import { vec, vecToKey, type Vec } from './core/vec';
import { SPIN_UP } from './core/spin-state';
import type { Branch, Component, Experiment, System } from './core/types';
import { detector, glass, joiner, mirror, sg, splitter } from './core/types';
import {
  createSystem,
  systemStep,
  systemCheckForDetection,
  systemDone,
} from './core/simulation';
import { Grid } from './components/Grid';
import { ComponentPalette } from './components/ComponentPalette';
import { SimulationControls } from './components/SimulationControls';
import { CameraControls } from './components/CameraControls';
import { SaveLoadDialog } from './components/SaveLoadDialog';
import { StatusBar } from './components/StatusBar';
import { StatisticsPanel } from './components/StatisticsPanel';
import { ComponentPropertiesPanel } from './components/ComponentPropertiesPanel';
import { useHistory } from './hooks/useHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { 
  saveExperimentToLocalStorage,
  loadExperimentFromLocalStorage,
  exportExperimentToFile,
  importExperimentFromFile
} from './utils/persistence';
import { validateExperiment, type ValidationResult } from './core/validation';
import { 
  encodeExperimentToURL, 
  decodeExperimentFromURL, 
  hasExperimentInURL,
  copyURLToClipboard 
} from './utils/urlEncoding';
import { runExperimentMultipleTimes, type StatisticsResult } from './core/statistics';
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
  // Check for experiment in URL on initial load
  const getInitialExperiment = () => {
    if (hasExperimentInURL()) {
      const urlExperiment = decodeExperimentFromURL();
      if (urlExperiment) {
        return urlExperiment;
      }
    }
    return EXAMPLES.doubleSlit.experiment;
  };

  // Experiment selection
  const [currentExample, setCurrentExample] = useState<keyof typeof EXAMPLES>('doubleSlit');
  const initialExperiment = getInitialExperiment();

  // System state
  const [system, setSystem] = useState<System>(() => createSystem(initialExperiment));
  const [initialSystem, setInitialSystem] = useState<System>(() => createSystem(initialExperiment));
  
  // Step history for rewind/forward
  const [simulationHistory, setSimulationHistory] = useState<System[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  // History management for undo/redo
  const history = useHistory(system.experiment);

  // UI state
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [isPanMode, setIsPanMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [stepCount, setStepCount] = useState(0);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  
  // Save/Load dialog state
  const [showSaveLoadDialog, setShowSaveLoadDialog] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load'>('save');
  const [experimentName, setExperimentName] = useState<string>('');
  
  // Status bar state
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(1.5);
  
  // Validation state
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] });
  
  // Statistics state
  const [showStatistics, setShowStatistics] = useState(false);
  const [statisticsResult, setStatisticsResult] = useState<StatisticsResult | null>(null);
  const [isRunningStatistics, setIsRunningStatistics] = useState(false);
  const [statisticsProgress, setStatisticsProgress] = useState<{ current: number; total: number } | null>(null);
  
  // Component selection for properties editing
  const [selectedComponentPos, setSelectedComponentPos] = useState<Vec | null>(null);

  // Animation loop
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastStepTimeRef = useRef<number>(0);
  
  // Validation timer
  const validationTimerRef = useRef<number | undefined>(undefined);

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

      // Add to history
      setSimulationHistory((prev) => {
        // If we're not at the end of history, truncate future steps
        const newHistory = currentStepIndex >= 0 
          ? prev.slice(0, currentStepIndex + 1)
          : prev;
        return [...newHistory, newSystem];
      });
      setCurrentStepIndex((prev) => prev + 1);

      return newSystem;
    });
    setStepCount((count) => count + 1);
  }, [currentStepIndex]);

  // Reset the simulation
  const reset = useCallback(() => {
    setSystem(initialSystem);
    setStepCount(0);
    setDetectionResult(null);
    setIsRunning(false);
    setSimulationHistory([]);
    setCurrentStepIndex(-1);
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

      // Push to history for undo/redo
      history.push(newExperiment);

      return newSystem;
    });
  }, [history]);

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
      setSimulationHistory([]);
      setCurrentStepIndex(-1);

      // Push to history for undo/redo
      history.push(newExperiment);
      
      // Validate experiment (debounced)
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
      validationTimerRef.current = window.setTimeout(() => {
        setValidationResult(validateExperiment(newExperiment));
      }, 500);

      return newSystem;
    });
  }, [history]);

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
    setIsPanMode(false);
    
    // Clear history when loading example
    history.clear();
  }, [history]);

  // Toggle pan mode
  const togglePanMode = useCallback(() => {
    setIsPanMode((prev) => !prev);
    if (!isPanMode) {
      setSelectedComponent(null); // Deselect any component when entering pan mode
    }
  }, [isPanMode]);

  // Undo last action
  const handleUndo = useCallback(() => {
    const previousExperiment = history.undo();
    if (previousExperiment) {
      const newSystem = createSystem(previousExperiment);
      setSystem(newSystem);
      setInitialSystem(newSystem);
      setStepCount(0);
      setDetectionResult(null);
      setIsRunning(false);
    }
  }, [history]);

  // Redo last undone action
  const handleRedo = useCallback(() => {
    const nextExperiment = history.redo();
    if (nextExperiment) {
      const newSystem = createSystem(nextExperiment);
      setSystem(newSystem);
      setInitialSystem(newSystem);
      setStepCount(0);
      setDetectionResult(null);
      setIsRunning(false);
    }
  }, [history]);

  // Handle tool selection by number (1-9)
  const handleSelectTool = useCallback((toolIndex: number) => {
    // Map tool indices to components
    const tools = [
      sg(false),        // 1: SG Vertical
      sg(true),         // 2: SG Horizontal
      detector('D'),    // 3: Detector
      splitter(vec(1, 1)),  // 4: Splitter /
      splitter(vec(1, -1)), // 5: Splitter \
      joiner(),         // 6: Joiner
      mirror(vec(1, 1)),    // 7: Mirror /
      mirror(vec(1, -1)),   // 8: Mirror \
      glass(new Complex(0, 1)), // 9: Glass
    ];
    
    if (toolIndex >= 0 && toolIndex < tools.length) {
      setSelectedComponent(tools[toolIndex]);
      setIsPanMode(false);
    }
  }, []);

  // Handle eraser shortcut
  const handleEraserShortcut = useCallback(() => {
    setSelectedComponent(null);
    setIsPanMode(false);
  }, []);

  // Handle hand tool shortcut
  const handleHandToolShortcut = useCallback(() => {
    setIsPanMode(true);
    setSelectedComponent(null);
  }, []);

  // Go to previous step
  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      setSystem(newIndex === -1 ? initialSystem : simulationHistory[newIndex]);
      setStepCount(newIndex + 1);
      setDetectionResult(null);
      setIsRunning(false);
    } else if (currentStepIndex === 0) {
      setCurrentStepIndex(-1);
      setSystem(initialSystem);
      setStepCount(0);
      setDetectionResult(null);
      setIsRunning(false);
    }
  }, [currentStepIndex, simulationHistory, initialSystem]);

  // Go to next step
  const handleNextStep = useCallback(() => {
    if (currentStepIndex < simulationHistory.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      setSystem(simulationHistory[newIndex]);
      setStepCount(newIndex + 1);
      
      // Check if this step has detection
      const result = systemCheckForDetection(simulationHistory[newIndex]);
      if (result) {
        setDetectionResult(result);
      }
    }
  }, [currentStepIndex, simulationHistory]);

  // Save experiment
  const handleSave = useCallback((name: string) => {
    saveExperimentToLocalStorage(name, system.experiment);
    setExperimentName(name);
    alert(`Experiment "${name}" saved successfully!`);
  }, [system.experiment]);

  // Load experiment
  const handleLoad = useCallback((name: string) => {
    const loadedExperiment = loadExperimentFromLocalStorage(name);
    if (loadedExperiment) {
      const newSystem = createSystem(loadedExperiment);
      setSystem(newSystem);
      setInitialSystem(newSystem);
      setStepCount(0);
      setDetectionResult(null);
      setIsRunning(false);
      setExperimentName(name);
      history.clear();
    } else {
      alert(`Failed to load experiment "${name}"`);
    }
  }, [history]);

  // Export to file
  const handleExport = useCallback(() => {
    const filename = experimentName 
      ? `${experimentName}.json` 
      : 'quantum-experiment.json';
    exportExperimentToFile(system.experiment, filename);
  }, [system.experiment, experimentName]);

  // Import from file
  const handleImport = useCallback(async (file: File) => {
    const loadedExperiment = await importExperimentFromFile(file);
    if (loadedExperiment) {
      const newSystem = createSystem(loadedExperiment);
      setSystem(newSystem);
      setInitialSystem(newSystem);
      setStepCount(0);
      setDetectionResult(null);
      setIsRunning(false);
      setExperimentName(file.name.replace('.json', ''));
      history.clear();
      alert('Experiment imported successfully!');
    } else {
      alert('Failed to import experiment');
    }
  }, [history]);

  // Open save dialog
  const openSaveDialog = useCallback(() => {
    setSaveLoadMode('save');
    setShowSaveLoadDialog(true);
  }, []);

  // Open load dialog
  const openLoadDialog = useCallback(() => {
    setSaveLoadMode('load');
    setShowSaveLoadDialog(true);
  }, []);

  // Share experiment via URL
  const handleShareURL = useCallback(async () => {
    const shareURL = encodeExperimentToURL(system.experiment);
    const success = await copyURLToClipboard(shareURL);
    
    if (success) {
      alert('Shareable link copied to clipboard!');
    } else {
      // Fallback: show URL in a prompt
      prompt('Share this URL:', shareURL);
    }
  }, [system.experiment]);

  // Run batch statistics
  const handleRunStatistics = useCallback((numRuns: number) => {
    setIsRunningStatistics(true);
    setStatisticsProgress({ current: 0, total: numRuns });
    
    // Run in a setTimeout to allow UI to update
    setTimeout(() => {
      const result = runExperimentMultipleTimes(
        system.experiment,
        numRuns,
        (current, total) => {
          setStatisticsProgress({ current, total });
        }
      );
      
      setStatisticsResult(result);
      setIsRunningStatistics(false);
      setStatisticsProgress(null);
    }, 100);
  }, [system.experiment]);

  // Select component for editing
  const handleSelectComponent = useCallback((position: Vec) => {
    setSelectedComponentPos(position);
  }, []);

  // Update component properties
  const handleUpdateComponentProperties = useCallback((updatedComponent: Component) => {
    if (!selectedComponentPos) return;

    const posKey = vecToKey(selectedComponentPos);
    
    setSystem((prevSystem) => {
      const newComponents = new Map(prevSystem.experiment.components);
      newComponents.set(posKey, updatedComponent);

      const newExperiment = {
        ...prevSystem.experiment,
        components: newComponents,
      };

      const newSystem = createSystem(newExperiment);
      setInitialSystem(newSystem);
      setStepCount(0);
      setDetectionResult(null);
      setIsRunning(false);
      setSimulationHistory([]);
      setCurrentStepIndex(-1);

      // Push to history for undo/redo
      history.push(newExperiment);
      
      // Validate experiment
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
      validationTimerRef.current = window.setTimeout(() => {
        setValidationResult(validateExperiment(newExperiment));
      }, 500);

      return newSystem;
    });
  }, [selectedComponentPos, history]);

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

  const handleZoomIn = useCallback(() => {
    if ((window as any).__gridZoomIn) {
      (window as any).__gridZoomIn();
    }
  }, []);
  
  const handleZoomOut = useCallback(() => {
    if ((window as any).__gridZoomOut) {
      (window as any).__gridZoomOut();
    }
  }, []);
  
  const handleZoomToFit = useCallback(() => {
    if ((window as any).__gridZoomToFit) {
      (window as any).__gridZoomToFit();
    }
  }, []);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    // Editing
    onUndo: handleUndo,
    onRedo: handleRedo,
    // onDelete: will be added when selection mode is implemented
    
    // File
    onSave: openSaveDialog,
    onOpen: openLoadDialog,
    
    // View
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onZoomToFit: handleZoomToFit,
    
    // Simulation
    onTogglePlay: togglePlay,
    onStep: step,
    
    // Tools
    onSelectTool: handleSelectTool,
    onEraser: handleEraserShortcut,
    onHandTool: handleHandToolShortcut,
    // onSelectMode: will be added when selection mode is implemented
    
    // Deselect
    onDeselect: () => {
      setSelectedComponent(null);
      setIsPanMode(false);
    },
  }, true);

  return (
    <div className="app">
      {/* Main grid - full screen */}
      <div className="grid-container-wrapper">
        <Grid
          system={system}
          selectedComponent={selectedComponent}
          onAddComponent={handleAddComponent}
          onRemoveComponent={handleRemoveComponent}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomToFit={handleZoomToFit}
          isPanMode={isPanMode}
          onHoverCell={setHoveredCell}
          onZoomChange={setCurrentZoom}
          onSelectComponent={handleSelectComponent}
        />
      </div>

      {/* Floating component palette on the left */}
      <div className="floating-panel component-palette-floating">
        <ComponentPalette
          selectedComponent={selectedComponent}
          onSelectComponent={setSelectedComponent}
          isPanMode={isPanMode}
          onTogglePanMode={togglePanMode}
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
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onSave={openSaveDialog}
          onLoad={openLoadDialog}
          onShare={handleShareURL}
          onStatistics={() => setShowStatistics(true)}
          onPreviousStep={handlePreviousStep}
          onNextStep={handleNextStep}
          canStepBack={currentStepIndex >= 0}
          canStepForward={currentStepIndex < simulationHistory.length - 1}
          totalSteps={simulationHistory.length}
        />
      </div>
      
      {/* Camera controls on the bottom left */}
      <div className="floating-panel camera-controls-floating">
        <CameraControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomToFit={handleZoomToFit}
        />
      </div>

      {/* Save/Load Dialog */}
      <SaveLoadDialog
        isOpen={showSaveLoadDialog}
        mode={saveLoadMode}
        currentExperimentName={experimentName}
        onClose={() => setShowSaveLoadDialog(false)}
        onSave={handleSave}
        onLoad={handleLoad}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Statistics Panel */}
      <StatisticsPanel
        isOpen={showStatistics}
        onClose={() => setShowStatistics(false)}
        onRun={handleRunStatistics}
        result={statisticsResult}
        isRunning={isRunningStatistics}
        progress={statisticsProgress}
      />

      {/* Component Properties Panel */}
      <ComponentPropertiesPanel
        component={selectedComponentPos ? system.experiment.components.get(vecToKey(selectedComponentPos)) || null : null}
        position={selectedComponentPos ? { x: selectedComponentPos.x.re, y: selectedComponentPos.y.re } : null}
        onClose={() => setSelectedComponentPos(null)}
        onUpdate={handleUpdateComponentProperties}
      />

      {/* Status Bar */}
      <StatusBar
        currentTool={selectedComponent}
        isPanMode={isPanMode}
        hoveredCell={hoveredCell}
        zoom={currentZoom}
        experimentName={experimentName}
        validationWarnings={validationResult.warnings.length + validationResult.errors.length}
      />
    </div>
  );
}

export default App;
