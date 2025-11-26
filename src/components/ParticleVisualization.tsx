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
  const ELECTRON_RADIUS = cellSize / 4;

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

      {/* Base circle with probability pie slice */}
      <circle
        cx={0}
        cy={0}
        r={ELECTRON_RADIUS}
        fill="white"
        stroke="black"
        strokeWidth={2}
      />

      {/* Probability pie slice */}
      {p > 0 && (
        <PieSlice
          radius={ELECTRON_RADIUS}
          startAngle={0}
          endAngle={pAngle}
          color="#ccc"
        />
      )}

      {/* Phase arrow (blue line from center) */}
      <PhaseArrow angle={phaseAngle} radius={ELECTRON_RADIUS} />

      {/* Spin direction (red line from center) */}
      <SpinLine angle={spinAngle} radius={ELECTRON_RADIUS} />
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
  const arrowLineLength = 1.5 * radius;
  const arrowheadSize = cellSize / 10;

  return (
    <g transform={`rotate(${(angle * 180) / Math.PI})`}>
      <line
        x1={0}
        y1={0}
        x2={arrowLineLength}
        y2={0}
        stroke="black"
        strokeWidth={2}
      />
      <polygon
        points={`${arrowLineLength},${-arrowheadSize / 2} ${
          arrowLineLength + arrowheadSize
        },0 ${arrowLineLength},${arrowheadSize / 2}`}
        fill="black"
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

// Phase arrow component (blue line)
const PhaseArrow: React.FC<{ angle: number; radius: number }> = ({
  angle,
  radius,
}) => {
  // Phase angle is already in standard complex number convention (0 = right)
  // which matches SVG convention, so no conversion needed
  return (
    <g transform={`rotate(${(angle * 180) / Math.PI})`}>
      <line
        x1={0}
        y1={0}
        x2={radius}
        y2={0}
        stroke="blue"
        strokeWidth={2}
      />
    </g>
  );
};

// Spin line component (red line)
const SpinLine: React.FC<{ angle: number; radius: number }> = ({
  angle,
  radius,
}) => {
  const length = radius / 2;

  // Convert from Bloch sphere angle (0 = up) to SVG angle (0 = right)
  // In SVG: 0° = right, 90° = down (y-axis points down!)
  // In Bloch: 0° = up (z-axis), 90° = right (x-axis)
  // Bloch is rotated 90° counterclockwise from SVG
  // So we subtract 90° to convert: SVG angle = Bloch angle - 90°
  const svgAngle = angle - Math.PI / 2;

  return (
    <g transform={`rotate(${(svgAngle * 180) / Math.PI})`}>
      <line
        x1={0}
        y1={0}
        x2={length}
        y2={0}
        stroke="red"
        strokeWidth={2}
      />
    </g>
  );
};

