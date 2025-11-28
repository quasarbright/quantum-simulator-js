// Status bar showing current mode, coordinates, and context

import React from 'react';
import type { Component, Mode } from '../core/types';

interface StatusBarProps {
  mode: Mode;
  hoveredCell: { x: number; y: number } | null;
  zoom: number;
  experimentName?: string;
  validationWarnings?: number;
  isRunning: boolean;
  onShowValidation?: () => void;
}

function getToolName(component: Component | null): string {
  if (!component) return 'Eraser';
  
  switch (component.type) {
    case 'sg':
      return component.horizontal ? 'SG (Horizontal)' : 'SG (Vertical)';
    case 'detector':
      return `Detector (${component.name})`;
    case 'splitter':
      return component.norm.x.re > 0 && component.norm.y.re > 0 ? 'Splitter (/)' : 'Splitter (\\)';
    case 'joiner':
      return 'Joiner';
    case 'mirror':
      return component.norm.x.re > 0 && component.norm.y.re > 0 ? 'Mirror (/)' : 'Mirror (\\)';
    case 'glass':
      // Calculate phase angle from complex number
      const angle = Math.atan2(component.phaseShift.im, component.phaseShift.re) * (180 / Math.PI);
      return `Glass (${Math.round(angle)}°)`;
    default:
      return 'Unknown';
  }
}

export const StatusBar: React.FC<StatusBarProps> = ({
  mode,
  hoveredCell,
  zoom,
  experimentName,
  validationWarnings = 0,
  isRunning,
  onShowValidation,
}) => {
  const getModeDisplay = () => {
    if (isRunning) return 'Simulation Running (Editing Disabled)';
    if (mode === 'PAN') return 'Hand Tool';
    if (mode === 'SELECT') return 'Select Tool';
    if (mode === 'ERASER') return 'Eraser';
    return `Placing: ${getToolName(mode)}`;
  };
  
  const modeDisplay = getModeDisplay();
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '32px',
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #404040',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: '12px',
        color: '#a3a3a3',
        zIndex: 100,
      }}
    >
      {/* Left: Current mode/tool */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: '#e5e5e5', fontWeight: 'bold' }}>
          {modeDisplay}
        </span>
        {experimentName && (
          <span style={{ color: '#737373' }}>
            {experimentName}
          </span>
        )}
      </div>

      {/* Center: Coordinates */}
      <div>
        {hoveredCell && (
          <span>
            Position: ({hoveredCell.x}, {hoveredCell.y})
          </span>
        )}
      </div>

      {/* Right: Zoom and warnings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {validationWarnings > 0 && (
          <span
            onClick={onShowValidation}
            style={{
              color: '#f59e0b',
              cursor: onShowValidation ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: onShowValidation ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (onShowValidation) {
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (onShowValidation) {
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
              }
            }}
            title={onShowValidation ? 'Click to view validation issues' : undefined}
          >
            ⚠ {validationWarnings} warning{validationWarnings !== 1 ? 's' : ''}
          </span>
        )}
        <span>
          Zoom: {zoomPercent}%
        </span>
      </div>
    </div>
  );
};

