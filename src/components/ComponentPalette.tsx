// Component palette for selecting and placing components

import React from 'react';
import Complex from 'complex.js';
import { vec } from '../core/vec';
import type { Component } from '../core/types';
import { sg, detector, splitter, joiner, mirror, glass } from '../core/types';
import { ComponentRenderer } from './ComponentRenderer';

interface ComponentPaletteProps {
  selectedComponent: Component | null;
  onSelectComponent: (component: Component | null) => void;
}

interface ComponentOption {
  name: string;
  description: string;
  component: Component;
}

const COMPONENT_OPTIONS: ComponentOption[] = [
  {
    name: 'SG (V)',
    description: 'Vertical Stern-Gerlach (measures vertical spin)',
    component: sg(false),
  },
  {
    name: 'SG (H)',
    description: 'Horizontal Stern-Gerlach (measures horizontal spin)',
    component: sg(true),
  },
  {
    name: 'Detector',
    description: 'Particle detector (collapses wave function)',
    component: detector('D'),
  },
  {
    name: 'Splitter /',
    description: 'Beam splitter (diagonal /)',
    component: splitter(vec(1, 1)),
  },
  {
    name: 'Splitter \\',
    description: 'Beam splitter (diagonal \\)',
    component: splitter(vec(1, -1)),
  },
  {
    name: 'Joiner',
    description: 'Beam joiner (combines paths)',
    component: joiner(),
  },
  {
    name: 'Mirror /',
    description: 'Mirror (diagonal /)',
    component: mirror(vec(1, 1)),
  },
  {
    name: 'Mirror \\',
    description: 'Mirror (diagonal \\)',
    component: mirror(vec(1, -1)),
  },
  {
    name: 'Glass',
    description: 'Phase shifter (i = +90°)',
    component: glass(new Complex(0, 1)),
  },
];

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  selectedComponent,
  onSelectComponent,
}) => {
  const isSelected = (option: ComponentOption) => {
    if (!selectedComponent) return false;
    return JSON.stringify(option.component) === JSON.stringify(selectedComponent);
  };

  const CELL_SIZE = 48;

  return (
    <>
      {COMPONENT_OPTIONS.map((option, idx) => (
        <button
          key={idx}
          onClick={() => {
            if (isSelected(option)) {
              onSelectComponent(null);
            } else {
              onSelectComponent(option.component);
            }
          }}
          title={`${option.name}: ${option.description}`}
          style={{
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
            padding: '0',
            backgroundColor: '#1a1a1a',
            border: isSelected(option) ? '2px solid #3b82f6' : '1px solid #404040',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <svg
            width={CELL_SIZE}
            height={CELL_SIZE}
            style={{ display: 'block' }}
          >
            <ComponentRenderer component={option.component} cellSize={CELL_SIZE} />
          </svg>
        </button>
      ))}
      
      {/* Eraser */}
      <button
        onClick={() => onSelectComponent(null)}
        title="Eraser (or right-click to remove)"
        style={{
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          padding: '0',
          backgroundColor: '#1a1a1a',
          color: '#e5e5e5',
          border: selectedComponent === null ? '2px solid #3b82f6' : '1px solid #404040',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        🗑️
      </button>
    </>
  );
};

