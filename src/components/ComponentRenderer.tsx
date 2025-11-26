// SVG rendering for experiment components
// Matches visual style from the Racket implementation

import React from 'react';
import type { Component } from '../core/types';

interface ComponentRendererProps {
  component: Component;
  cellSize: number;
}

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  cellSize,
}) => {
  switch (component.type) {
    case 'sg':
      return <SGRenderer horizontal={component.horizontal} cellSize={cellSize} />;
    case 'detector':
      return <DetectorRenderer name={component.name} cellSize={cellSize} />;
    case 'splitter':
      return <SplitterRenderer norm={component.norm} cellSize={cellSize} />;
    case 'joiner':
      return <JoinerRenderer cellSize={cellSize} />;
    case 'mirror':
      return <MirrorRenderer norm={component.norm} cellSize={cellSize} />;
    case 'glass':
      return <GlassRenderer cellSize={cellSize} />;
    default:
      return null;
  }
};

// Stern-Gerlach apparatus
const SGRenderer: React.FC<{ horizontal: boolean; cellSize: number }> = ({
  horizontal,
  cellSize,
}) => {
  return (
    <g>
      <rect
        x={0}
        y={0}
        width={cellSize}
        height={cellSize}
        fill="none"
        stroke="black"
        strokeWidth={2}
      />
      {horizontal ? (
        <line
          x1={cellSize / 4}
          y1={cellSize / 2}
          x2={(3 * cellSize) / 4}
          y2={cellSize / 2}
          stroke="black"
          strokeWidth={2}
        />
      ) : (
        <line
          x1={cellSize / 2}
          y1={cellSize / 4}
          x2={cellSize / 2}
          y2={(3 * cellSize) / 4}
          stroke="black"
          strokeWidth={2}
        />
      )}
    </g>
  );
};

// Detector
const DetectorRenderer: React.FC<{ name: string; cellSize: number }> = ({
  name,
  cellSize,
}) => {
  return (
    <g>
      <rect
        x={0}
        y={0}
        width={cellSize}
        height={cellSize}
        fill="none"
        stroke="black"
        strokeWidth={3}
      />
      <text
        x={cellSize / 2}
        y={cellSize / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={cellSize * 0.4}
        fontWeight="bold"
        fill="black"
      >
        {name}
      </text>
    </g>
  );
};

// Beam splitter
const SplitterRenderer: React.FC<{ norm: any; cellSize: number }> = ({
  norm,
  cellSize,
}) => {
  // Check if it's diagonal / or \
  const isDiagonalUp = norm.x.re === 1 && norm.y.re === 1;
  const isDiagonalDown = norm.x.re === 1 && norm.y.re === -1;

  if (isDiagonalUp) {
    // Diagonal /
    return (
      <line
        x1={0}
        y1={cellSize}
        x2={cellSize}
        y2={0}
        stroke="black"
        strokeWidth={2}
        strokeDasharray="5,5"
      />
    );
  } else if (isDiagonalDown) {
    // Diagonal \
    return (
      <line
        x1={0}
        y1={0}
        x2={cellSize}
        y2={cellSize}
        stroke="black"
        strokeWidth={2}
        strokeDasharray="5,5"
      />
    );
  }

  return null;
};

// Beam joiner
const JoinerRenderer: React.FC<{ cellSize: number }> = ({ cellSize }) => {
  const arrowSize = cellSize / 5;

  return (
    <g>
      <line
        x1={cellSize * 0.15}
        y1={cellSize / 2}
        x2={cellSize * 0.7}
        y2={cellSize / 2}
        stroke="black"
        strokeWidth={2}
      />
      <polygon
        points={`${cellSize * 0.7},${cellSize / 2 - arrowSize / 2} ${
          cellSize * 0.7 + arrowSize
        },${cellSize / 2} ${cellSize * 0.7},${cellSize / 2 + arrowSize / 2}`}
        fill="black"
      />
    </g>
  );
};

// Mirror
const MirrorRenderer: React.FC<{ norm: any; cellSize: number }> = ({
  norm,
  cellSize,
}) => {
  // Check if it's diagonal / or \
  const isDiagonalUp = norm.x.re === 1 && norm.y.re === 1;
  const isDiagonalDown = norm.x.re === 1 && norm.y.re === -1;

  if (isDiagonalUp) {
    // Diagonal /
    return (
      <line
        x1={0}
        y1={cellSize}
        x2={cellSize}
        y2={0}
        stroke="black"
        strokeWidth={3}
      />
    );
  } else if (isDiagonalDown) {
    // Diagonal \
    return (
      <line
        x1={0}
        y1={0}
        x2={cellSize}
        y2={cellSize}
        stroke="black"
        strokeWidth={3}
      />
    );
  }

  return null;
};

// Glass (phase shifter)
const GlassRenderer: React.FC<{ cellSize: number }> = ({ cellSize }) => {
  return (
    <rect
      x={0}
      y={0}
      width={cellSize}
      height={cellSize}
      fill="gray"
      opacity={0.5}
    />
  );
};

