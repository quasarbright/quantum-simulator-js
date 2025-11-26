// Component properties editor panel

import React, { useState, useEffect } from 'react';
import Complex from 'complex.js';
import type { Component } from '../core/types';
import { sg, detector, mirror, splitter, glass } from '../core/types';
import { vec } from '../core/vec';

interface ComponentPropertiesPanelProps {
  component: Component | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onUpdate: (component: Component) => void;
}

export const ComponentPropertiesPanel: React.FC<ComponentPropertiesPanelProps> = ({
  component,
  position,
  onClose,
  onUpdate,
}) => {
  const [detectorName, setDetectorName] = useState('D');
  const [phaseAngle, setPhaseAngle] = useState(90);
  const [sgHorizontal, setSgHorizontal] = useState(false);
  const [mirrorOrientation, setMirrorOrientation] = useState<'/' | '\\'>('/');
  const [splitterOrientation, setSplitterOrientation] = useState<'/' | '\\'>('/');

  useEffect(() => {
    if (component) {
      switch (component.type) {
        case 'detector':
          setDetectorName(component.name);
          break;
        case 'glass':
          const angle = Math.atan2(component.phaseShift.im, component.phaseShift.re) * (180 / Math.PI);
          setPhaseAngle(Math.round(angle));
          break;
        case 'sg':
          setSgHorizontal(component.horizontal);
          break;
        case 'mirror':
          setMirrorOrientation(component.norm.x.re > 0 && component.norm.y.re > 0 ? '/' : '\\');
          break;
        case 'splitter':
          setSplitterOrientation(component.norm.x.re > 0 && component.norm.y.re > 0 ? '/' : '\\');
          break;
      }
    }
  }, [component]);

  if (!component || !position) return null;

  const handleApply = () => {
    let updatedComponent: Component;

    switch (component.type) {
      case 'detector':
        updatedComponent = detector(detectorName);
        break;
      case 'glass':
        const radians = (phaseAngle * Math.PI) / 180;
        updatedComponent = glass(new Complex(Math.cos(radians), Math.sin(radians)));
        break;
      case 'sg':
        updatedComponent = sg(sgHorizontal);
        break;
      case 'mirror':
        updatedComponent = mirror(mirrorOrientation === '/' ? vec(1, 1) : vec(1, -1));
        break;
      case 'splitter':
        updatedComponent = splitter(splitterOrientation === '/' ? vec(1, 1) : vec(1, -1));
        break;
      default:
        updatedComponent = component;
    }

    onUpdate(updatedComponent);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '24px',
        minWidth: '300px',
        border: '1px solid #404040',
        zIndex: 1000,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
      }}
    >
      <h2 style={{ margin: '0 0 16px 0', color: '#e5e5e5', fontSize: '18px' }}>
        Edit Component
      </h2>

      <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
        <div style={{ color: '#a3a3a3', fontSize: '12px' }}>Position</div>
        <div style={{ color: '#e5e5e5', fontSize: '14px' }}>
          ({position.x}, {position.y})
        </div>
      </div>

      {/* Detector properties */}
      {component.type === 'detector' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#a3a3a3', fontSize: '14px' }}>
            Detector Name:
          </label>
          <input
            type="text"
            value={detectorName}
            onChange={(e) => setDetectorName(e.target.value)}
            maxLength={3}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #404040',
              borderRadius: '6px',
              color: '#e5e5e5',
              fontSize: '14px',
            }}
          />
        </div>
      )}

      {/* Glass properties */}
      {component.type === 'glass' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#a3a3a3', fontSize: '14px' }}>
            Phase Angle: {phaseAngle}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={phaseAngle}
            onChange={(e) => setPhaseAngle(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#737373', marginTop: '4px' }}>
            <span>0°</span>
            <span>90°</span>
            <span>180°</span>
            <span>270°</span>
            <span>360°</span>
          </div>
        </div>
      )}

      {/* SG properties */}
      {component.type === 'sg' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#a3a3a3', fontSize: '14px' }}>
            Orientation:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSgHorizontal(false)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: !sgHorizontal ? '#6366f1' : '#2a2a2a',
                color: 'white',
                border: '1px solid #404040',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Vertical
            </button>
            <button
              onClick={() => setSgHorizontal(true)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: sgHorizontal ? '#6366f1' : '#2a2a2a',
                color: 'white',
                border: '1px solid #404040',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Horizontal
            </button>
          </div>
        </div>
      )}

      {/* Mirror properties */}
      {component.type === 'mirror' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#a3a3a3', fontSize: '14px' }}>
            Orientation:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setMirrorOrientation('/')}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: mirrorOrientation === '/' ? '#6366f1' : '#2a2a2a',
                color: 'white',
                border: '1px solid #404040',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              /
            </button>
            <button
              onClick={() => setMirrorOrientation('\\')}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: mirrorOrientation === '\\' ? '#6366f1' : '#2a2a2a',
                color: 'white',
                border: '1px solid #404040',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              \
            </button>
          </div>
        </div>
      )}

      {/* Splitter properties */}
      {component.type === 'splitter' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#a3a3a3', fontSize: '14px' }}>
            Orientation:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSplitterOrientation('/')}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: splitterOrientation === '/' ? '#6366f1' : '#2a2a2a',
                color: 'white',
                border: '1px solid #404040',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              /
            </button>
            <button
              onClick={() => setSplitterOrientation('\\')}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: splitterOrientation === '\\' ? '#6366f1' : '#2a2a2a',
                color: 'white',
                border: '1px solid #404040',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              \
            </button>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        <button
          onClick={handleApply}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Apply
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#404040',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

