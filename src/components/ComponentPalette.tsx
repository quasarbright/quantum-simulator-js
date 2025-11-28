// Component palette for selecting and placing components

import React from 'react';
import Complex from 'complex.js';
import { vec } from '../core/vec';
import type { Component, Mode } from '../core/types';
import { sg, detector, splitter, joiner, mirror, glass } from '../core/types';
import { ComponentRenderer } from './ComponentRenderer';
import { COMPONENT_DESCRIPTIONS } from '../data/componentDescriptions';

interface ComponentPaletteProps {
  mode: Mode;
  onSelectMode: (mode: Mode) => void;
  isSimulationRunning: boolean;
  nextDetectorName: string;
}

interface ComponentOption {
  name: string;
  description: string;
  component: Component;
}

const COMPONENT_OPTIONS: ComponentOption[] = [
  {
    name: 'SG (V)',
    description: `${COMPONENT_DESCRIPTIONS['sg-vertical'].name} (${COMPONENT_DESCRIPTIONS['sg-vertical'].shortcut})\n${COMPONENT_DESCRIPTIONS['sg-vertical'].description}\n${COMPONENT_DESCRIPTIONS['sg-vertical'].details}`,
    component: sg(false),
  },
  {
    name: 'SG (H)',
    description: `${COMPONENT_DESCRIPTIONS['sg-horizontal'].name} (${COMPONENT_DESCRIPTIONS['sg-horizontal'].shortcut})\n${COMPONENT_DESCRIPTIONS['sg-horizontal'].description}\n${COMPONENT_DESCRIPTIONS['sg-horizontal'].details}`,
    component: sg(true),
  },
  {
    name: 'Detector',
    description: `${COMPONENT_DESCRIPTIONS.detector.name} (${COMPONENT_DESCRIPTIONS.detector.shortcut})\n${COMPONENT_DESCRIPTIONS.detector.description}\n${COMPONENT_DESCRIPTIONS.detector.details}`,
    component: detector('D'),
  },
  {
    name: 'Splitter /',
    description: `${COMPONENT_DESCRIPTIONS['splitter-forward'].name} (${COMPONENT_DESCRIPTIONS['splitter-forward'].shortcut})\n${COMPONENT_DESCRIPTIONS['splitter-forward'].description}\n${COMPONENT_DESCRIPTIONS['splitter-forward'].details}`,
    component: splitter(vec(1, 1)),
  },
  {
    name: 'Splitter \\',
    description: `${COMPONENT_DESCRIPTIONS['splitter-backward'].name} (${COMPONENT_DESCRIPTIONS['splitter-backward'].shortcut})\n${COMPONENT_DESCRIPTIONS['splitter-backward'].description}\n${COMPONENT_DESCRIPTIONS['splitter-backward'].details}`,
    component: splitter(vec(1, -1)),
  },
  {
    name: 'Joiner',
    description: `${COMPONENT_DESCRIPTIONS.joiner.name} (${COMPONENT_DESCRIPTIONS.joiner.shortcut})\n${COMPONENT_DESCRIPTIONS.joiner.description}\n${COMPONENT_DESCRIPTIONS.joiner.details}`,
    component: joiner(),
  },
  {
    name: 'Mirror /',
    description: `${COMPONENT_DESCRIPTIONS['mirror-forward'].name} (${COMPONENT_DESCRIPTIONS['mirror-forward'].shortcut})\n${COMPONENT_DESCRIPTIONS['mirror-forward'].description}\n${COMPONENT_DESCRIPTIONS['mirror-forward'].details}`,
    component: mirror(vec(1, 1)),
  },
  {
    name: 'Mirror \\',
    description: `${COMPONENT_DESCRIPTIONS['mirror-backward'].name} (${COMPONENT_DESCRIPTIONS['mirror-backward'].shortcut})\n${COMPONENT_DESCRIPTIONS['mirror-backward'].description}\n${COMPONENT_DESCRIPTIONS['mirror-backward'].details}`,
    component: mirror(vec(1, -1)),
  },
  {
    name: 'Glass',
    description: `${COMPONENT_DESCRIPTIONS.glass.name} (${COMPONENT_DESCRIPTIONS.glass.shortcut})\n${COMPONENT_DESCRIPTIONS.glass.description}\n${COMPONENT_DESCRIPTIONS.glass.details}`,
    component: glass(new Complex(0, 1)),
  },
];

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  mode,
  onSelectMode,
  isSimulationRunning,
  nextDetectorName,
}) => {
  const isSelected = (option: ComponentOption) => {
    if (typeof mode === 'string') return false;
    return JSON.stringify(option.component) === JSON.stringify(mode);
  };

  const CELL_SIZE = 48;

  // Update detector component with next available name
  const getComponentForDisplay = (component: Component): Component => {
    if (component.type === 'detector') {
      return detector(nextDetectorName);
    }
    return component;
  };

  return (
    <>
      {/* Hand tool (pan mode) - always available for navigation */}
      <button
        onClick={() => onSelectMode('PAN')}
        title={`${COMPONENT_DESCRIPTIONS.hand.name} (${COMPONENT_DESCRIPTIONS.hand.shortcut})\n${COMPONENT_DESCRIPTIONS.hand.description}\n${COMPONENT_DESCRIPTIONS.hand.details}`}
        style={{
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          padding: '0',
          backgroundColor: '#1a1a1a',
          color: '#e5e5e5',
          border: mode === 'PAN' ? '2px solid #3b82f6' : '1px solid #404040',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
        </svg>
      </button>

      {/* Select Tool */}
      <button
        onClick={() => !isSimulationRunning && onSelectMode('SELECT')}
        disabled={isSimulationRunning}
        title={isSimulationRunning ? 'Disabled during simulation' : 'Select Tool: Select, copy, cut, paste, and move components (S)'}
        style={{
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          padding: '0',
          backgroundColor: '#1a1a1a',
          color: '#e5e5e5',
          border: mode === 'SELECT' ? '2px solid #3b82f6' : '1px solid #404040',
          borderRadius: '8px',
          cursor: isSimulationRunning ? 'not-allowed' : 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          opacity: isSimulationRunning ? 0.5 : 1,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
          <path d="M13 13l6 6"></path>
        </svg>
      </button>
      
      {COMPONENT_OPTIONS.map((option, idx) => (
        <button
          key={idx}
          onClick={() => {
            if (isSimulationRunning) return;
            if (isSelected(option)) {
              onSelectMode('ERASER');
            } else {
              onSelectMode(option.component);
            }
          }}
          disabled={isSimulationRunning}
          title={isSimulationRunning ? 'Disabled during simulation' : `${option.name}: ${option.description}`}
          style={{
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
            padding: '0',
            backgroundColor: '#1a1a1a',
            border: isSelected(option) ? '2px solid #3b82f6' : '1px solid #404040',
            borderRadius: '8px',
            cursor: isSimulationRunning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            overflow: 'hidden',
            position: 'relative',
            opacity: isSimulationRunning ? 0.5 : 1,
          }}
        >
          <svg
            width={CELL_SIZE - 8}
            height={CELL_SIZE - 8}
            style={{ display: 'block' }}
          >
            <ComponentRenderer component={getComponentForDisplay(option.component)} cellSize={CELL_SIZE - 8} />
          </svg>
        </button>
      ))}
      
      {/* Eraser */}
      <button
        onClick={() => !isSimulationRunning && onSelectMode('ERASER')}
        disabled={isSimulationRunning}
        title={isSimulationRunning ? 'Disabled during simulation' : 'Eraser: Remove components'}
        style={{
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          padding: '0',
          backgroundColor: '#1a1a1a',
          color: '#e5e5e5',
          border: mode === 'ERASER' ? '2px solid #3b82f6' : '1px solid #404040',
          borderRadius: '8px',
          cursor: isSimulationRunning ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          opacity: isSimulationRunning ? 0.5 : 1,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path>
          <path d="M22 21H7"></path>
          <path d="m5 11 9 9"></path>
        </svg>
      </button>
    </>
  );
};

