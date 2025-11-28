// SVG rendering for experiment components with modern, informative design

import React from 'react';
import type { Component } from '../core/types';
import {
  SG_BACKGROUND,
  SG_BORDER,
  SG_INDICATOR,
  DETECTOR_BACKGROUND,
  DETECTOR_BORDER,
  DETECTOR_ICON,
  DETECTOR_TEXT,
  GLASS_BACKGROUND,
  GLASS_BORDER,
  GLASS_TEXT,
  MOVEMENT_GLOW,
  GREEN_SOLID,
} from '../styles/colors';

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
      return <GlassRenderer phaseShift={component.phaseShift} cellSize={cellSize} />;
    default:
      return null;
  }
};

// Stern-Gerlach apparatus - looks like two spin indicators
const SGRenderer: React.FC<{ horizontal: boolean; cellSize: number }> = ({
  horizontal,
  cellSize,
}) => {
  const center = cellSize / 2;
  const indicatorLength = cellSize * 0.3;
  const dotRadius = 3;
  const inset = 2; // Inset to prevent border overlap
  
  return (
    <g>
      {/* Dark red background */}
      <rect
        x={inset}
        y={inset}
        width={cellSize - 2 * inset}
        height={cellSize - 2 * inset}
        fill={SG_BACKGROUND}
        stroke={SG_BORDER}
        strokeWidth={2}
        rx={4}
      />
      
      {/* Two spin indicators showing measurement directions */}
      {horizontal ? (
        <>
          {/* Left indicator (SPIN_LEFT) */}
          <g transform={`translate(${center}, ${center})`}>
            <circle cx={0} cy={0} r={dotRadius} fill={SG_INDICATOR} />
            <line
              x1={0}
              y1={0}
              x2={-indicatorLength}
              y2={0}
              stroke={SG_INDICATOR}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </g>
          
          {/* Right indicator (SPIN_RIGHT) */}
          <g transform={`translate(${center}, ${center})`}>
            <line
              x1={0}
              y1={0}
              x2={indicatorLength}
              y2={0}
              stroke={SG_INDICATOR}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </g>
        </>
      ) : (
        <>
          {/* Up indicator (SPIN_UP) */}
          <g transform={`translate(${center}, ${center})`}>
            <circle cx={0} cy={0} r={dotRadius} fill={SG_INDICATOR} />
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={-indicatorLength}
              stroke={SG_INDICATOR}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </g>
          
          {/* Down indicator (SPIN_DOWN) */}
          <g transform={`translate(${center}, ${center})`}>
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={indicatorLength}
              stroke={SG_INDICATOR}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </g>
        </>
      )}
    </g>
  );
};

// Detector - indigo theme matching probability pie chart
const DetectorRenderer: React.FC<{ name: string; cellSize: number }> = ({
  name,
  cellSize,
}) => {
  const inset = 2; // Inset to prevent border overlap
  
  return (
    <g>
      {/* Detector background - indigo theme */}
      <rect
        x={inset}
        y={inset}
        width={cellSize - 2 * inset}
        height={cellSize - 2 * inset}
        fill={DETECTOR_BACKGROUND}
        stroke={DETECTOR_BORDER}
        strokeWidth={2}
        rx={4}
      />
      
      {/* Detector icon (target symbol) - centered */}
      <circle
        cx={cellSize / 2}
        cy={cellSize / 2}
        r={cellSize * 0.15}
        fill="none"
        stroke={DETECTOR_ICON}
        strokeWidth={2}
      />
      <circle
        cx={cellSize / 2}
        cy={cellSize / 2}
        r={cellSize * 0.08}
        fill={DETECTOR_ICON}
      />
      
      {/* Detector label - bottom-left corner */}
      <text
        x={cellSize * 0.1}
        y={cellSize * 0.88}
        textAnchor="start"
        fontSize={cellSize * 0.25}
        fontWeight="700"
        fill={DETECTOR_TEXT}
      >
        {name}
      </text>
    </g>
  );
};

// Beam splitter - just like mirror but dashed, green theme
const SplitterRenderer: React.FC<{ norm: any; cellSize: number }> = ({
  norm,
  cellSize,
}) => {
  const isDiagonalUp = norm.x.re === 1 && norm.y.re === 1;
  const isDiagonalDown = norm.x.re === 1 && norm.y.re === -1;

  return (
    <g>
      {/* Reflective surface gradient - darker green for dark theme */}
      <defs>
        <linearGradient id="splitter-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: MOVEMENT_GLOW, stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: MOVEMENT_GLOW, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: MOVEMENT_GLOW, stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {isDiagonalUp ? (
        <>
          <line
            x1={cellSize * 0.05}
            y1={cellSize * 0.95}
            x2={cellSize * 0.95}
            y2={cellSize * 0.05}
            stroke="url(#splitter-gradient)"
            strokeWidth={cellSize * 0.15}
          />
          <line
            x1={cellSize * 0.05}
            y1={cellSize * 0.95}
            x2={cellSize * 0.95}
            y2={cellSize * 0.05}
            stroke={GREEN_SOLID}
            strokeWidth={3}
            strokeDasharray="8,4"
          />
        </>
      ) : isDiagonalDown ? (
        <>
          <line
            x1={cellSize * 0.05}
            y1={cellSize * 0.05}
            x2={cellSize * 0.95}
            y2={cellSize * 0.95}
            stroke="url(#splitter-gradient)"
            strokeWidth={cellSize * 0.15}
          />
          <line
            x1={cellSize * 0.05}
            y1={cellSize * 0.05}
            x2={cellSize * 0.95}
            y2={cellSize * 0.95}
            stroke={GREEN_SOLID}
            strokeWidth={3}
            strokeDasharray="8,4"
          />
        </>
      ) : null}
    </g>
  );
};

// Beam joiner - T shape with arrowhead on right, green theme with glow
const JoinerRenderer: React.FC<{ cellSize: number }> = ({ cellSize }) => {
  const center = cellSize / 2;
  const arrowSize = cellSize * 0.15;
  const arrowSizeGlow = cellSize * 0.3; // Bigger for glow effect

  return (
    <g>
      {/* Background glow - darker green for dark theme */}
      {/* Horizontal line (from left to center) - glow */}
      <line
        x1={cellSize * 0.15}
        y1={center}
        x2={center}
        y2={center}
        stroke={MOVEMENT_GLOW}
        strokeWidth={12}
        strokeLinecap="round"
      />
      
      {/* Vertical line (from bottom) - glow */}
      <line
        x1={center}
        y1={cellSize * 0.85}
        x2={center}
        y2={center}
        stroke={MOVEMENT_GLOW}
        strokeWidth={12}
        strokeLinecap="round"
      />
      
      {/* Horizontal line (center to right with arrow) - glow */}
      <line
        x1={center}
        y1={center}
        x2={cellSize * 0.70}
        y2={center}
        stroke={MOVEMENT_GLOW}
        strokeWidth={12}
      />
      
      {/* Arrowhead - glow (bigger than foreground) */}
      <polygon
        points={`${cellSize * 0.70},${center - arrowSizeGlow / 2} ${
          cellSize * 0.95
        },${center} ${cellSize * 0.70},${center + arrowSizeGlow / 2}`}
        fill={MOVEMENT_GLOW}
      />
      
      {/* Foreground - normal green, thinner */}
      {/* Horizontal line (from left to center) */}
      <line
        x1={cellSize * 0.15}
        y1={center}
        x2={center}
        y2={center}
        stroke={GREEN_SOLID}
        strokeWidth={3}
        strokeLinecap="round"
      />
      
      {/* Vertical line (from bottom) */}
      <line
        x1={center}
        y1={cellSize * 0.85}
        x2={center}
        y2={center}
        stroke={GREEN_SOLID}
        strokeWidth={3}
        strokeLinecap="round"
      />
      
      {/* Horizontal line (center to right with arrow) */}
      <line
        x1={center}
        y1={center}
        x2={cellSize * 0.78}
        y2={center}
        stroke={GREEN_SOLID}
        strokeWidth={3}
      />
      
      {/* Arrowhead - foreground */}
      <polygon
        points={`${cellSize * 0.73},${center - arrowSize / 2} ${
          cellSize * 0.88
        },${center} ${cellSize * 0.73},${center + arrowSize / 2}`}
        fill={GREEN_SOLID}
      />
    </g>
  );
};

// Mirror - green theme, solid line
const MirrorRenderer: React.FC<{ norm: any; cellSize: number }> = ({
  norm,
  cellSize,
}) => {
  const isDiagonalUp = norm.x.re === 1 && norm.y.re === 1;
  const isDiagonalDown = norm.x.re === 1 && norm.y.re === -1;

  return (
    <g>
      {/* Reflective surface gradient - darker green for dark theme */}
      <defs>
        <linearGradient id="mirror-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: MOVEMENT_GLOW, stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: MOVEMENT_GLOW, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: MOVEMENT_GLOW, stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {isDiagonalUp ? (
        <>
          <line
            x1={cellSize * 0.05}
            y1={cellSize * 0.95}
            x2={cellSize * 0.95}
            y2={cellSize * 0.05}
            stroke="url(#mirror-gradient)"
            strokeWidth={cellSize * 0.15}
          />
          <line
            x1={cellSize * 0.05}
            y1={cellSize * 0.95}
            x2={cellSize * 0.95}
            y2={cellSize * 0.05}
            stroke={GREEN_SOLID}
            strokeWidth={3}
          />
        </>
      ) : isDiagonalDown ? (
        <>
          <line
            x1={cellSize * 0.05}
            y1={cellSize * 0.05}
            x2={cellSize * 0.95}
            y2={cellSize * 0.95}
            stroke="url(#mirror-gradient)"
            strokeWidth={cellSize * 0.15}
          />
          <line
            x1={cellSize * 0.05}
            y1={cellSize * 0.05}
            x2={cellSize * 0.95}
            y2={cellSize * 0.95}
            stroke={GREEN_SOLID}
            strokeWidth={3}
          />
        </>
      ) : null}
    </g>
  );
};

// Glass (phase shifter) - cyan theme matching phase indicator
const GlassRenderer: React.FC<{ phaseShift: any; cellSize: number }> = ({
  phaseShift,
  cellSize,
}) => {
  // Calculate phase angle in degrees for display
  const phaseAngle = (phaseShift.arg() * 180 / Math.PI).toFixed(0);
  const inset = 2; // Inset to prevent border overlap
  
  return (
    <g>
      {/* Glass material - darker cyan for dark theme */}
      <rect
        x={inset}
        y={inset}
        width={cellSize - 2 * inset}
        height={cellSize - 2 * inset}
        fill={GLASS_BACKGROUND}
      />
      <rect
        x={inset}
        y={inset}
        width={cellSize - 2 * inset}
        height={cellSize - 2 * inset}
        fill="none"
        stroke={GLASS_BORDER}
        strokeWidth={2}
        strokeDasharray="4,2"
        rx={2}
      />
      
      {/* Phase shift indicator */}
      <text
        x={cellSize / 2}
        y={cellSize * 0.4}
        textAnchor="middle"
        fontSize={cellSize * 0.2}
        fontWeight="600"
        fill={GLASS_TEXT}
      >
        φ
      </text>
      <text
        x={cellSize / 2}
        y={cellSize * 0.65}
        textAnchor="middle"
        fontSize={cellSize * 0.18}
        fontWeight="500"
        fill={GLASS_TEXT}
      >
        {phaseAngle}°
      </text>
    </g>
  );
};

