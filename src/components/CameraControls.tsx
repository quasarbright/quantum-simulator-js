// Camera controls for pan and zoom

import React from 'react';

interface CameraControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onZoomToFit,
}) => {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      <button
        onClick={onZoomIn}
        title="Zoom In"
        style={{
          padding: '8px 12px',
          backgroundColor: '#2a2a2a',
          color: '#e5e5e5',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 'bold',
          border: '1px solid #404040',
        }}
      >
        +
      </button>

      <button
        onClick={onZoomOut}
        title="Zoom Out"
        style={{
          padding: '8px 12px',
          backgroundColor: '#2a2a2a',
          color: '#e5e5e5',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 'bold',
          border: '1px solid #404040',
        }}
      >
        −
      </button>

      <button
        onClick={onZoomToFit}
        title="Zoom to Fit"
        style={{
          padding: '8px 12px',
          backgroundColor: '#2a2a2a',
          color: '#e5e5e5',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          border: '1px solid #404040',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>
    </div>
  );
};

