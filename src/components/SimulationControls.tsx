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
}) => {
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        maxWidth: '400px',
        border: '1px solid #404040',
      }}
    >
      <h3 style={{ marginTop: 0, color: '#e5e5e5' }}>Simulation Controls</h3>

      {/* Status display */}
      <div
        style={{
          padding: '12px',
          backgroundColor: '#0a0a0a',
          borderRadius: '4px',
          marginBottom: '15px',
          border: '1px solid #525252',
          color: '#e5e5e5',
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <strong>Step Count:</strong> {stepCount}
        </div>
        {detectionResult && (
          <div
            style={{
              padding: '8px',
              backgroundColor: '#4caf50',
              color: 'white',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            Detected at: {detectionResult.name}
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '15px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={onStep}
          disabled={isRunning || detectionResult !== null}
          style={{
            flex: 1,
            padding: '12px 20px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: detectionResult ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            opacity: isRunning || detectionResult ? 0.5 : 1,
          }}
        >
          Step
        </button>

        <button
          onClick={onTogglePlay}
          disabled={detectionResult !== null}
          style={{
            flex: 1,
            padding: '12px 20px',
            backgroundColor: isRunning ? '#ff9800' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: detectionResult ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            opacity: detectionResult ? 0.5 : 1,
          }}
        >
          {isRunning ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={onReset}
          style={{
            flex: 1,
            padding: '12px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          Reset
        </button>
      </div>

      {/* Speed control */}
      <div style={{ marginTop: '15px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#e5e5e5',
          }}
        >
          Speed: {speed}x
        </label>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: '12px',
            color: '#a3a3a3',
            marginTop: '4px',
            position: 'relative',
          }}
        >
          <span style={{ position: 'absolute', left: '0%', transform: 'translateX(0%)' }}>0.25x</span>
          <span style={{ position: 'absolute', left: '20%', transform: 'translateX(-50%)' }}>1x</span>
          <span style={{ position: 'absolute', left: '46.67%', transform: 'translateX(-50%)' }}>2x</span>
          <span style={{ position: 'absolute', left: '73.33%', transform: 'translateX(-50%)' }}>3x</span>
          <span style={{ position: 'absolute', left: '100%', transform: 'translateX(-100%)' }}>4x</span>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#0a0a0a',
          borderRadius: '4px',
          fontSize: '12px',
          lineHeight: '1.5',
          border: '1px solid #525252',
          color: '#d4d4d4',
        }}
      >
        <strong>Instructions:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Click <strong>Step</strong> to advance one timestep</li>
          <li>Click <strong>Play</strong> to run automatically</li>
          <li>Click <strong>Reset</strong> to restart from the beginning</li>
          <li>Adjust the speed slider to control playback speed</li>
        </ul>
      </div>
    </div>
  );
};

