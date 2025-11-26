// Simulation controls: play/pause/step/reset with speed control

import React from 'react';
import type { Result } from '../core/types';

interface SimulationControlsProps {
  isRunning: boolean;
  speed: number;
  stepCount: number;
  detectionResult: Result;
  onStep: () => void;
  onReset: () => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  onLoadExample: (key: 'doubleSternGerlach' | 'doubleSlit' | 'doubleSlitPartialDestructive' | 'empty') => void;
  currentExample: string;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  speed,
  stepCount,
  detectionResult,
  onStep,
  onReset,
  onTogglePlay,
  onSpeedChange,
  onLoadExample,
  currentExample,
}) => {
  const [showExamples, setShowExamples] = React.useState(false);
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >

      {/* Control buttons */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={onStep}
          disabled={isRunning || detectionResult !== null}
          title="Step"
          style={{
            padding: '8px 12px',
            backgroundColor: '#2196f3',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
            <line x1="19" y1="3" x2="19" y2="21" stroke="currentColor" strokeWidth="2"></line>
          </svg>
        </button>

        <button
          onClick={onTogglePlay}
          disabled={detectionResult !== null}
          title={isRunning ? 'Pause' : 'Play'}
          style={{
            padding: '8px 12px',
            backgroundColor: isRunning ? '#ff9800' : '#4caf50',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isRunning ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>

        <button
          onClick={onReset}
          title="Reset"
          style={{
            padding: '8px 12px',
            backgroundColor: '#f44336',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M3 21v-5h5"></path>
          </svg>
        </button>
        
        <button
          onClick={() => setShowExamples(!showExamples)}
          title="Examples"
          style={{
            padding: '8px 12px',
            backgroundColor: '#9333ea',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </button>
      </div>

      {/* Status */}
      <div
        style={{
          padding: '8px',
          backgroundColor: '#2a2a2a',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#e5e5e5',
        }}
      >
        <div><strong>Steps:</strong> {stepCount}</div>
        {detectionResult && (
          <div style={{ color: '#4caf50', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            {detectionResult.name}
          </div>
        )}
      </div>

      {/* Speed control */}
      <div
        style={{
          padding: '8px',
          backgroundColor: '#2a2a2a',
          borderRadius: '6px',
        }}
      >
        <div style={{ fontSize: '11px', color: '#a3a3a3', marginBottom: '4px' }}>
          Speed: {speed}x
        </div>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Examples dropdown */}
      {showExamples && (
        <div
          style={{
            padding: '8px',
            backgroundColor: '#2a2a2a',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {(['doubleSternGerlach', 'doubleSlit', 'doubleSlitPartialDestructive', 'empty'] as const).map(
            (key) => (
              <button
                key={key}
                onClick={() => {
                  onLoadExample(key);
                  setShowExamples(false);
                }}
                style={{
                  padding: '6px',
                  backgroundColor: currentExample === key ? '#3b82f6' : '#404040',
                  color: '#e5e5e5',
                  borderRadius: '4px',
                  fontSize: '11px',
                  textAlign: 'left',
                }}
              >
                {key === 'doubleSternGerlach'
                  ? 'Double SG'
                  : key === 'doubleSlit'
                  ? 'Double Slit'
                  : key === 'doubleSlitPartialDestructive'
                  ? 'DS + Phase'
                  : 'Empty'}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

