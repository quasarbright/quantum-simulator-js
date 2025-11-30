// Statistics panel for batch simulations

import React, { useState } from 'react';
import type { StatisticsResult } from '../core/statistics';

interface StatisticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (numRuns: number) => void;
  result: StatisticsResult | null;
  isRunning: boolean;
  progress: { current: number; total: number } | null;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  isOpen,
  onClose,
  onRun,
  result,
  isRunning,
  progress,
}) => {
  const [numRuns, setNumRuns] = useState(1000);

  if (!isOpen) return null;

  const handleRun = () => {
    if (!isRunning && numRuns > 0 && numRuns <= 10000) {
      onRun(numRuns);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #404040',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0', color: '#e5e5e5', fontSize: '20px' }}>
          Batch Statistics
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#a3a3a3', fontSize: '14px' }}>
            Number of runs:
          </label>
          <input
            type="number"
            value={numRuns}
            onChange={(e) => setNumRuns(parseInt(e.target.value) || 1000)}
            min="1"
            max="10000"
            disabled={isRunning}
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
          <button
            onClick={handleRun}
            disabled={isRunning || numRuns < 1 || numRuns > 10000}
            style={{
              marginTop: '12px',
              padding: '10px 20px',
              backgroundColor: isRunning ? '#404040' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              width: '100%',
            }}
          >
            {isRunning ? 'Running...' : 'Run Batch Simulation'}
          </button>
        </div>

        {progress && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#a3a3a3', fontSize: '12px', marginBottom: '8px' }}>
              Progress: {progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
            </div>
            <div style={{ backgroundColor: '#2a2a2a', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  backgroundColor: '#4caf50',
                  height: '100%',
                  width: `${(progress.current / progress.total) * 100}%`,
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>
        )}

        {result && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#e5e5e5', fontSize: '16px' }}>
              Results
            </h3>

            <div style={{ backgroundColor: '#2a2a2a', borderRadius: '6px', padding: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#a3a3a3', fontSize: '12px' }}>Total Runs</div>
                <div style={{ color: '#e5e5e5', fontSize: '18px', fontWeight: 'bold' }}>
                  {result.totalRuns}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#a3a3a3', fontSize: '12px' }}>Average Steps</div>
                <div style={{ color: '#e5e5e5', fontSize: '16px' }}>
                  {result.averageSteps.toFixed(1)} (min: {result.minSteps}, max: {result.maxSteps})
                </div>
              </div>

              {result.allDetectorNames.length > 0 && (
                <div>
                  <div style={{ color: '#a3a3a3', fontSize: '12px', marginBottom: '8px' }}>
                    Detections
                  </div>
                  {result.allDetectorNames.map((name) => {
                    const count = result.detectionCounts.get(name) || 0;
                    const percentage = ((count / result.totalRuns) * 100).toFixed(1);
                    return (
                      <div
                        key={name}
                        style={{
                          marginBottom: '8px',
                          padding: '8px',
                          backgroundColor: '#1a1a1a',
                          borderRadius: '4px',
                          opacity: count === 0 ? 0.5 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#e5e5e5', fontWeight: 'bold' }}>Detector {name}</span>
                          <span style={{ color: count > 0 ? '#4caf50' : '#737373' }}>
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div style={{ backgroundColor: '#2a2a2a', borderRadius: '2px', height: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              backgroundColor: count > 0 ? '#4caf50' : '#404040',
                              height: '100%',
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {result.noDetectionCount > 0 && (
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#3f1515', borderRadius: '4px' }}>
                  <span style={{ color: '#e5e5e5' }}>No Detection: </span>
                  <span style={{ color: '#f44336', fontWeight: 'bold' }}>
                    {result.noDetectionCount} ({((result.noDetectionCount / result.totalRuns) * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: '12px',
            padding: '10px 20px',
            backgroundColor: '#404040',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

