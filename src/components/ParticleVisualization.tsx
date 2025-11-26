// SVG rendering of particle branches
// Matches the visualization from the Racket implementation

import React from 'react';
import { branchProbability } from '../core/simulation';
import { vecZero } from '../core/vec';
import type { Branch } from '../core/types';

interface ParticleVisualizationProps {
  branch: Branch;
  cellSize: number;
}

export const ParticleVisualization: React.FC<ParticleVisualizationProps> = ({
  branch,
  cellSize,
}) => {
  const ELECTRON_RADIUS = cellSize / 3.5;

  // Calculate display values
  const p = branchProbability(branch);
  const pAngle = p * 2 * Math.PI;
  const phaseAngle = p === 0 ? 0 : branch.amplitude.arg();

  // Calculate spin direction (Bloch sphere xz projection)
  const spinAngle = getDefiniteSpinAngle(branch);

  // Velocity arrow
  const v = branch.velocity;
  const hasVelocity = !vecZero(v);

  return (
    <g>
      {/* Velocity arrow (behind circle) */}
      {hasVelocity && (
        <VelocityArrow
          vx={v.x.re}
          vy={v.y.re}
          radius={ELECTRON_RADIUS}
          cellSize={cellSize}
        />
      )}

      {/* Base circle with subtle gradient */}
      <defs>
        <radialGradient id="particle-gradient">
          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
          <stop offset="70%" style={{ stopColor: '#f9fafb', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#e5e7eb', stopOpacity: 1 }} />
        </radialGradient>
      </defs>
      <circle
        cx={0}
        cy={0}
        r={ELECTRON_RADIUS}
        fill="url(#particle-gradient)"
        stroke="#374151"
        strokeWidth={2}
      />

      {/* Probability pie slice */}
      {p > 0 && (
        <PieSlice
          radius={ELECTRON_RADIUS}
          startAngle={0}
          endAngle={pAngle}
          color="#6366f1"
        />
      )}

      {/* Phase arrow (cyan line from center) */}
      <PhaseArrow angle={phaseAngle} radius={ELECTRON_RADIUS} />

      {/* Spin direction (magenta line from center) */}
      <SpinLine angle={spinAngle} radius={ELECTRON_RADIUS} />
      
      {/* Probability label */}
      {p > 0 && p < 1 && (
        <text
          x={0}
          y={ELECTRON_RADIUS + 12}
          textAnchor="middle"
          fontSize={Math.max(8, cellSize * 0.08)}
          fill="#374151"
          fontWeight="500"
        >
          {(p * 100).toFixed(0)}%
        </text>
      )}
    </g>
  );
};

// Calculate spin angle for Bloch sphere xz projection
function getDefiniteSpinAngle(branch: Branch): number {
  const s = branch.state;
  const up = s.x;
  const down = s.y;

  // Bloch sphere coordinates
  const upConj = up.conjugate();
  const downConj = down.conjugate();

  const x = up.mul(downConj).add(upConj.mul(down)).re;
  const z = upConj.mul(up).sub(downConj.mul(down)).re;

  return Math.atan2(x, z);
}

// Velocity arrow component
const VelocityArrow: React.FC<{
  vx: number;
  vy: number;
  radius: number;
  cellSize: number;
}> = ({ vx, vy, radius, cellSize }) => {
  // Simulation coords: +x right, +y up
  // SVG coords: +x right, +y down
  // So negate vy when computing angle
  const angle = Math.atan2(-vy, vx);
  
  // Arrow extends just beyond the circle but stays within cell
  const arrowheadSize = Math.min(cellSize * 0.12, 12);
  const arrowLineLength = radius * 1.15; // Just barely extends past circle
  const arrowTipLength = arrowLineLength + arrowheadSize;

  return (
    <g transform={`rotate(${(angle * 180) / Math.PI})`}>
      <line
        x1={0}
        y1={0}
        x2={arrowLineLength}
        y2={0}
        stroke="#10b981"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <polygon
        points={`${arrowLineLength},${-arrowheadSize / 2} ${
          arrowTipLength
        },0 ${arrowLineLength},${arrowheadSize / 2}`}
        fill="#10b981"
      />
    </g>
  );
};

// Pie slice component
const PieSlice: React.FC<{
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
}> = ({ radius, startAngle, endAngle, color }) => {
  // Convert to degrees for SVG arc
  const startX = radius * Math.cos(startAngle);
  const startY = radius * Math.sin(startAngle);
  const endX = radius * Math.cos(endAngle);
  const endY = radius * Math.sin(endAngle);

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  const pathData = [
    `M 0 0`,
    `L ${startX} ${startY}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    `Z`,
  ].join(' ');

  return <path d={pathData} fill={color} />;
};

// Phase arrow component (cyan line)
const PhaseArrow: React.FC<{ angle: number; radius: number }> = ({
  angle,
  radius,
}) => {
  // Phase angle is already in standard complex number convention (0 = right)
  // which matches SVG convention, so no conversion needed
  const length = radius * 0.85;
  
  return (
    <g>
      {/* Center dot */}
      <circle cx={0} cy={0} r={3} fill="#06b6d4" />
      
      {/* Line from center */}
      <g transform={`rotate(${(angle * 180) / Math.PI})`}>
        <line
          x1={0}
          y1={0}
          x2={length}
          y2={0}
          stroke="#06b6d4"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
};

// Spin line component (magenta line)
const SpinLine: React.FC<{ angle: number; radius: number }> = ({
  angle,
  radius,
}) => {
  const length = radius * 0.6;

  // Convert from Bloch sphere angle (0 = up) to SVG angle (0 = right)
  // In SVG: 0° = right, 90° = down (y-axis points down!)
  // In Bloch: 0° = up (z-axis), 90° = right (x-axis)
  // Bloch is rotated 90° counterclockwise from SVG
  // So we subtract 90° to convert: SVG angle = Bloch angle - 90°
  const svgAngle = angle - Math.PI / 2;

  return (
    <g>
      {/* Center dot */}
      <circle cx={0} cy={0} r={3} fill="#ec4899" />
      
      {/* Line from center */}
      <g transform={`rotate(${(svgAngle * 180) / Math.PI})`}>
        <line
          x1={0}
          y1={0}
          x2={length}
          y2={0}
          stroke="#ec4899"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
};

