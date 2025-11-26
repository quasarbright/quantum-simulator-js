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
          }}
        >
          ⏭
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
          }}
        >
          {isRunning ? '⏸' : '▶'}
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
          }}
        >
          🔄
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
          }}
        >
          📚
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
          <div style={{ color: '#4caf50', marginTop: '4px' }}>
            ✓ {detectionResult.name}
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

