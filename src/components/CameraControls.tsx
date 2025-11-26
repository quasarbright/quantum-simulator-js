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
        }}
      >
        🔍
      </button>
    </div>
  );
};

