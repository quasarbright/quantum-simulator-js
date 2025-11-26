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
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onLoad: () => void;
  onShare: () => void;
  onStatistics: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
  canStepBack: boolean;
  canStepForward: boolean;
  totalSteps: number;
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
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onLoad,
  onShare,
  onStatistics,
  onPreviousStep,
  onNextStep,
  canStepBack,
  canStepForward,
  totalSteps,
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
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {/* Undo button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl/Cmd+Z)"
          style={{
            padding: '8px 12px',
            backgroundColor: canUndo ? '#6366f1' : '#404040',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            opacity: canUndo ? 1 : 0.5,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"></path>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
          </svg>
        </button>

        {/* Redo button */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl/Cmd+Shift+Z)"
          style={{
            padding: '8px 12px',
            backgroundColor: canRedo ? '#6366f1' : '#404040',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canRedo ? 'pointer' : 'not-allowed',
            opacity: canRedo ? 1 : 0.5,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6"></path>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
          </svg>
        </button>
      </div>

      {/* Simulation control buttons */}
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

        <button
          onClick={onSave}
          title="Save (Ctrl/Cmd+S)"
          style={{
            padding: '8px 12px',
            backgroundColor: '#f59e0b',
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
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
        </button>

        <button
          onClick={onLoad}
          title="Load (Ctrl/Cmd+O)"
          style={{
            padding: '8px 12px',
            backgroundColor: '#f59e0b',
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>

        <button
          onClick={onShare}
          title="Share URL"
          style={{
            padding: '8px 12px',
            backgroundColor: '#10b981',
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
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </button>

        <button
          onClick={onStatistics}
          title="Batch Statistics"
          style={{
            padding: '8px 12px',
            backgroundColor: '#8b5cf6',
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
            <line x1="12" y1="20" x2="12" y2="10"></line>
            <line x1="18" y1="20" x2="18" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="16"></line>
          </svg>
        </button>
      </div>

      {/* Step navigation */}
      {totalSteps > 0 && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={onPreviousStep}
            disabled={!canStepBack}
            title="Previous Step"
            style={{
              padding: '8px',
              backgroundColor: canStepBack ? '#6366f1' : '#404040',
              color: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: canStepBack ? 'pointer' : 'not-allowed',
              opacity: canStepBack ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          
          <div style={{ 
            padding: '4px 8px', 
            backgroundColor: '#2a2a2a', 
            borderRadius: '4px',
            fontSize: '11px',
            minWidth: '60px',
            textAlign: 'center'
          }}>
            {stepCount} / {totalSteps}
          </div>
          
          <button
            onClick={onNextStep}
            disabled={!canStepForward}
            title="Next Step"
            style={{
              padding: '8px',
              backgroundColor: canStepForward ? '#6366f1' : '#404040',
              color: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: canStepForward ? 'pointer' : 'not-allowed',
              opacity: canStepForward ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      )}

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

