// Component palette for selecting and placing components

import React from 'react';
import Complex from 'complex.js';
import { vec } from '../core/vec';
import type { Component } from '../core/types';
import { sg, detector, splitter, joiner, mirror, glass } from '../core/types';

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

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        maxWidth: '300px',
      }}
    >
      <h3 style={{ marginTop: 0 }}>Component Palette</h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
        Click to select a component, then click on the grid to place it. Right-click
        to remove.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            style={{
              padding: '12px',
              backgroundColor: isSelected(option) ? '#2196f3' : 'white',
              color: isSelected(option) ? 'white' : '#333',
              border: '2px solid ' + (isSelected(option) ? '#1976d2' : '#ddd'),
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isSelected(option)) {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected(option)) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {option.name}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {option.description}
            </div>
          </button>
        ))}

        {selectedComponent && (
          <button
            onClick={() => onSelectComponent(null)}
            style={{
              padding: '12px',
              backgroundColor: '#ff5252',
              color: 'white',
              border: '2px solid #f44336',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '8px',
            }}
          >
            Clear Selection
          </button>
        )}
      </div>
    </div>
  );
};

