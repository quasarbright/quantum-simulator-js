// Status bar showing current mode, coordinates, and context

import React from 'react';
import type { Component } from '../core/types';

interface StatusBarProps {
  currentTool: Component | null;
  isPanMode: boolean;
  hoveredCell: { x: number; y: number } | null;
  zoom: number;
  experimentName?: string;
  validationWarnings?: number;
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
  currentTool,
  isPanMode,
  hoveredCell,
  zoom,
  experimentName,
  validationWarnings = 0,
}) => {
  const mode = isPanMode ? 'Hand Tool' : (currentTool ? `Placing: ${getToolName(currentTool)}` : 'Eraser');
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
          {mode}
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
          <span style={{ color: '#f59e0b' }}>
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

