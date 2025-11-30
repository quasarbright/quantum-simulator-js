// Main application component integrating all parts of the quantum simulator

import { useState, useEffect, useCallback, useRef } from 'react';
import Complex from 'complex.js';
import { vec, vecToKey, type Vec } from './core/vec';
import { SPIN_UP } from './core/spin-state';
import type { Branch, Component, Experiment, System, Mode } from './core/types';
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
import { ValidationPanel } from './components/ValidationPanel';
import { AboutModal } from './components/AboutModal';
import { useHistory } from './hooks/useHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSelection } from './hooks/useSelection';
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
import { experimentEquals } from './utils/experimentEquals';
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
  const [mode, setMode] = useState<Mode>('SELECT');
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [stepCount, setStepCount] = useState(0);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [nextDetectorName, setNextDetectorName] = useState<string>('A');
  
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
  
  // Validation panel state
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  
  // About modal state
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // Component properties editing (different from selection mode)
  const [selectedComponentPos, setSelectedComponentPos] = useState<Vec | null>(null);
  
  // Selection state
  const selection = useSelection();
  
  // Rectangle selection state
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);

  // Animation loop
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastStepTimeRef = useRef<number>(0);
  
  // Validation timer
  const validationTimerRef = useRef<number | undefined>(undefined);
  
  // Refs for step function to avoid recreating it
  const currentStepIndexRef = useRef(currentStepIndex);
  const simulationHistoryRef = useRef(simulationHistory);
  
  // Keep refs in sync with state
  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
    simulationHistoryRef.current = simulationHistory;
  }, [currentStepIndex, simulationHistory]);

  // Step the simulation
  const step = useCallback(() => {
    let newSystem: System;
    
    setSystem((prevSystem) => {
      newSystem = systemStep(prevSystem);
      const result = systemCheckForDetection(newSystem);

      if (result) {
        setDetectionResult(result);
        setIsRunning(false);
      } else if (systemDone(newSystem)) {
        setIsRunning(false);
      }

      return newSystem;
    });
    
    // Update history - using refs to avoid recreating step callback
    setSimulationHistory((prev) => {
      const currentIndex = currentStepIndexRef.current;
      // If we're not at the end of history, truncate future steps
      const newHistory = currentIndex >= 0 && currentIndex < prev.length - 1
        ? prev.slice(0, currentIndex + 1)
        : prev;
      return [...newHistory, newSystem];
    });
    
    setCurrentStepIndex((prev) => prev + 1);
    setStepCount((count) => count + 1);
  }, []);

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

  // Generate next available detector name (A, B, C, ..., Z, AA, AB, ...)
  const getNextDetectorName = useCallback((components: Map<string, Component>): string => {
    const existingNames = new Set<string>();
    components.forEach(comp => {
      if (comp.type === 'detector') {
        existingNames.add(comp.name);
      }
    });

    // Try single letters first: A-Z
    for (let i = 0; i < 26; i++) {
      const name = String.fromCharCode(65 + i);
      if (!existingNames.has(name)) {
        return name;
      }
    }

    // Then try double letters: AA, AB, AC, ..., AZ, BA, BB, ...
    for (let i = 0; i < 26; i++) {
      for (let j = 0; j < 26; j++) {
        const name = String.fromCharCode(65 + i) + String.fromCharCode(65 + j);
        if (!existingNames.has(name)) {
          return name;
        }
      }
    }

    // Fallback (should never reach here in practice)
    return 'A';
  }, []);

  // Update next detector name when experiment changes
  useEffect(() => {
    setNextDetectorName(getNextDetectorName(system.experiment.components));
  }, [system.experiment.components, getNextDetectorName]);

  // Validate experiment on initial load and when it changes
  useEffect(() => {
    setValidationResult(validateExperiment(system.experiment));
  }, [system.experiment]);

  // Add component to grid
  const handleAddComponent = useCallback((position: Vec, component: Component) => {
    // Don't allow editing while running
    if (isRunning) return;
    
    const posKey = vecToKey(position);

    setSystem((prevSystem) => {
      // Use the component as-is (detector name is already set when mode is selected)
      const componentToAdd = component;

      const newComponents = new Map(prevSystem.experiment.components);
      newComponents.set(posKey, componentToAdd);

      const newExperiment = {
        ...prevSystem.experiment,
        components: newComponents,
      };

      // Only push to history if experiment actually changed
      if (!experimentEquals(prevSystem.experiment, newExperiment)) {
        const newSystem = createSystem(newExperiment);
        setInitialSystem(newSystem);
        setStepCount(0);
        setDetectionResult(null);
        setIsRunning(false);
        setSimulationHistory([]);
        setCurrentStepIndex(-1);

        // Push to history for undo/redo
        history.push(newExperiment);
        
        // If we added a detector, update the next detector name and mode
        if (componentToAdd.type === 'detector') {
          const newNextName = getNextDetectorName(newComponents);
          setNextDetectorName(newNextName);
          // Update the mode to use the new detector name
          setMode(detector(newNextName));
        }
        
        // Validate experiment (debounced)
        if (validationTimerRef.current) {
          clearTimeout(validationTimerRef.current);
        }
        validationTimerRef.current = window.setTimeout(() => {
          setValidationResult(validateExperiment(newExperiment));
        }, 500);

        return newSystem;
      }
      
      // No change, return previous system
      return prevSystem;
    });
  }, [history, isRunning, getNextDetectorName]);

  // Remove component from grid
  const handleRemoveComponent = useCallback((position: Vec) => {
    // Don't allow editing while running
    if (isRunning) return;
    
    const posKey = vecToKey(position);

    setSystem((prevSystem) => {
      const newComponents = new Map(prevSystem.experiment.components);
      const didDelete = newComponents.delete(posKey);

      // Only proceed if we actually deleted something
      if (!didDelete) {
        return prevSystem;
      }

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
  }, [history, isRunning]);

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
    setMode('SELECT');
    setSimulationHistory([]);
    setCurrentStepIndex(-1);
    
    // Clear history when loading example
    history.clear();
  }, [history]);


  // Undo last action
  const handleUndo = useCallback(() => {
    // Don't allow undo while running
    if (isRunning) return;
    
    const previousExperiment = history.undo();
    if (previousExperiment) {
      const newSystem = createSystem(previousExperiment);
      setSystem(newSystem);
      setInitialSystem(newSystem);
      setStepCount(0);
      setDetectionResult(null);
      setIsRunning(false);
      setSimulationHistory([]);
      setCurrentStepIndex(-1);
    }
  }, [history, isRunning]);

  // Redo last undone action
  const handleRedo = useCallback(() => {
    // Don't allow redo while running
    if (isRunning) return;
    
    const nextExperiment = history.redo();
    if (nextExperiment) {
      const newSystem = createSystem(nextExperiment);
      setSystem(newSystem);
      setInitialSystem(newSystem);
      setStepCount(0);
      setDetectionResult(null);
      setIsRunning(false);
      setSimulationHistory([]);
      setCurrentStepIndex(-1);
    }
  }, [history, isRunning]);

  // Handle tool selection by number (1-9)
  const handleSelectTool = useCallback((toolIndex: number) => {
    // Don't allow tool selection while running
    if (isRunning) return;
    
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
      setMode(tools[toolIndex]);
    }
  }, [isRunning]);

  // Handle eraser shortcut
  const handleEraserShortcut = useCallback(() => {
    // Don't allow tool selection while running
    if (isRunning) return;
    setMode('ERASER');
  }, [isRunning]);

  // Handle hand tool shortcut
  const handleHandToolShortcut = useCallback(() => {
    // Don't allow tool selection while running (but pan mode is OK)
    // Actually, let's keep pan mode available during simulation for better UX
    setMode('PAN');
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
      setSimulationHistory([]);
      setCurrentStepIndex(-1);
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
      setSimulationHistory([]);
      setCurrentStepIndex(-1);
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

  // Copy selection
  const handleCopy = useCallback(() => {
    if (mode !== 'SELECT' || !selection.hasSelection) return;
    selection.copySelection(system.experiment);
  }, [mode, selection, system.experiment]);

  // Cut selection
  const handleCut = useCallback(() => {
    if (mode !== 'SELECT' || !selection.hasSelection || isRunning) return;
    
    const keysToRemove = selection.cutSelection(system.experiment);
    
    setSystem((prevSystem) => {
      const newComponents = new Map(prevSystem.experiment.components);
      for (const key of keysToRemove) {
        newComponents.delete(key);
      }

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

      history.push(newExperiment);

      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
      validationTimerRef.current = window.setTimeout(() => {
        setValidationResult(validateExperiment(newExperiment));
      }, 500);

      return newSystem;
    });

    selection.clearSelection();
  }, [mode, selection, system.experiment, isRunning, history]);

  // Paste selection
  const handlePaste = useCallback(() => {
    if (mode !== 'SELECT' || !selection.hasClipboard || isRunning) return;
    
    // Only paste if a cell is selected
    if (selection.selectedPositions.size === 0) return;
    
    // Use first selected cell position as paste target
    const firstKey = Array.from(selection.selectedPositions)[0];
    const parts = firstKey.split(',');
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[2]);
    const pastePos = vec(x, y);
    const newComponents = selection.pasteSelection(pastePos);

    if (!newComponents) return;

    setSystem((prevSystem) => {
      const components = new Map(prevSystem.experiment.components);
      
      // Add all pasted components
      for (const [key, component] of newComponents) {
        components.set(key, component);
      }

      const newExperiment = {
        ...prevSystem.experiment,
        components,
      };

      if (!experimentEquals(prevSystem.experiment, newExperiment)) {
        const newSystem = createSystem(newExperiment);
        setInitialSystem(newSystem);
        setStepCount(0);
        setDetectionResult(null);
        setIsRunning(false);
        setSimulationHistory([]);
        setCurrentStepIndex(-1);

        history.push(newExperiment);

        if (validationTimerRef.current) {
          clearTimeout(validationTimerRef.current);
        }
        validationTimerRef.current = window.setTimeout(() => {
          setValidationResult(validateExperiment(newExperiment));
        }, 500);

        // Clear selection after pasting
        selection.clearSelection();

        return newSystem;
      }

      return prevSystem;
    });
  }, [selection, isRunning, history, mode]);

  // Delete selection
  const handleDeleteSelection = useCallback(() => {
    if (mode !== 'SELECT' || !selection.hasSelection || isRunning) return;

    setSystem((prevSystem) => {
      const newComponents = new Map(prevSystem.experiment.components);
      
      for (const key of selection.selectedPositions) {
        newComponents.delete(key);
      }

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

      history.push(newExperiment);

      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
      validationTimerRef.current = window.setTimeout(() => {
        setValidationResult(validateExperiment(newExperiment));
      }, 500);

      return newSystem;
    });

    selection.clearSelection();
  }, [mode, selection, isRunning, history]);

  // Move selection by offset
  const handleMoveSelection = useCallback((offsetX: number, offsetY: number) => {
    if (mode !== 'SELECT' || !selection.hasSelection || isRunning) return;

    const moveResult = selection.moveSelection(system.experiment, offsetX, offsetY);
    if (!moveResult) return;

    setSystem((prevSystem) => {
      const newComponents = new Map(prevSystem.experiment.components);
      
      // Remove components from old positions
      for (const key of moveResult.keysToRemove) {
        newComponents.delete(key);
      }
      
      // Add components to new positions (only non-empty cells)
      for (const [key, component] of moveResult.componentsToMove) {
        newComponents.set(key, component);
      }

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

      history.push(newExperiment);

      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
      validationTimerRef.current = window.setTimeout(() => {
        setValidationResult(validateExperiment(newExperiment));
      }, 500);

      return newSystem;
    });

    // Update selection to reflect new positions
    const newSelection = new Set<string>();
    for (const key of moveResult.keysToRemove) {
      const parts = key.split(',');
      const oldX = parseFloat(parts[0]);
      const oldY = parseFloat(parts[2]);
      const newPos = vec(oldX + offsetX, oldY + offsetY);
      newSelection.add(vecToKey(newPos));
    }
    selection.selectedPositions.clear();
    for (const key of newSelection) {
      selection.selectedPositions.add(key);
    }
  }, [mode, selection, isRunning, system.experiment, history]);

  // Select component for editing
  const handleSelectComponent = useCallback((position: Vec) => {
    // Don't allow editing while running
    if (isRunning) return;
    
    setSelectedComponentPos(position);
  }, [isRunning]);

  // Update component properties
  const handleUpdateComponentProperties = useCallback((updatedComponent: Component) => {
    if (!selectedComponentPos || isRunning) return;

    const posKey = vecToKey(selectedComponentPos);
    
    setSystem((prevSystem) => {
      const newComponents = new Map(prevSystem.experiment.components);
      newComponents.set(posKey, updatedComponent);

      const newExperiment = {
        ...prevSystem.experiment,
        components: newComponents,
      };

      // Only push to history if experiment actually changed
      if (!experimentEquals(prevSystem.experiment, newExperiment)) {
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
      }
      
      // No change, return previous system
      return prevSystem;
    });
  }, [selectedComponentPos, history, isRunning]);

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
    onCopy: handleCopy,
    onCut: handleCut,
    onPaste: handlePaste,
    onDelete: handleDeleteSelection,
    onSelectAll: () => mode === 'SELECT' && selection.selectAll(system.experiment),
    
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
    
    // Deselect
    onDeselect: () => {
      setMode('SELECT');
      selection.clearSelection();
      setSelectionStart(null);
    },
  }, true);

  return (
    <div className="app">
      {/* Main grid - full screen */}
      <div className="grid-container-wrapper">
        <Grid
          system={system}
          mode={mode}
          onAddComponent={handleAddComponent}
          onRemoveComponent={handleRemoveComponent}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomToFit={handleZoomToFit}
          onHoverCell={setHoveredCell}
          onZoomChange={setCurrentZoom}
          onSelectComponent={handleSelectComponent}
          isSimulationRunning={isRunning}
          selectedPositions={selection.selectedPositions}
          onSelectionClick={(pos, isShift) => {
            if (isShift) {
              selection.addToSelection(vecToKey(pos));
            } else {
              selection.selectComponent(vecToKey(pos));
            }
          }}
          onSelectionRectangle={(x1, y1, x2, y2) => selection.selectRectangle(x1, y1, x2, y2, system.experiment)}
          selectionStart={selectionStart}
          onSetSelectionStart={setSelectionStart}
          onMoveSelection={handleMoveSelection}
        />
      </div>

      {/* Floating component palette on the left */}
      <div className="floating-panel component-palette-floating">
        <ComponentPalette
          mode={mode}
          onSelectMode={(newMode) => {
            // If selecting detector, use the next available name
            if (typeof newMode === 'object' && newMode.type === 'detector') {
              setMode(detector(nextDetectorName));
            } else {
              setMode(newMode);
            }
            if (newMode !== 'SELECT') {
              selection.clearSelection();
            }
          }}
          isSimulationRunning={isRunning}
          nextDetectorName={nextDetectorName}
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
          canStepBack={currentStepIndex >= 0}
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

      {/* About button on the bottom right */}
      <div className="floating-panel about-button-floating">
        <button
          onClick={() => setShowAboutModal(true)}
          title="About"
          style={{
            padding: '12px 16px',
            backgroundColor: '#06b6d4',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          About
        </button>
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

      {/* Validation Panel */}
      <ValidationPanel
        isOpen={showValidationPanel}
        validationResult={validationResult}
        onClose={() => setShowValidationPanel(false)}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      {/* Status Bar */}
      <StatusBar
        mode={mode}
        hoveredCell={hoveredCell}
        zoom={currentZoom}
        experimentName={experimentName}
        validationWarnings={validationResult.warnings.length + validationResult.errors.length}
        isRunning={isRunning}
        onShowValidation={() => setShowValidationPanel(true)}
      />
    </div>
  );
}

export default App;
