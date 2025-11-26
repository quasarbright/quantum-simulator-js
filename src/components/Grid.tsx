// Interactive experiment grid editor

import React from 'react';
import { vec, vecEqual, vecToKey, type Vec } from '../core/vec';
import type { Component, Experiment, System } from '../core/types';
import { ComponentRenderer } from './ComponentRenderer';
import { ParticleVisualization } from './ParticleVisualization';

interface GridProps {
  system: System;
  selectedComponent: Component | null;
  onAddComponent: (position: Vec, component: Component) => void;
  onRemoveComponent: (position: Vec) => void;
}

export const Grid: React.FC<GridProps> = ({
  system,
  selectedComponent,
  onAddComponent,
  onRemoveComponent,
}) => {
  const { experiment, particle } = system;

  // Calculate grid bounds with some margin
  const bounds = calculateBounds(experiment);
  const { minx, maxx, miny, maxy } = bounds;

  const width = maxx - minx + 1;
  const height = maxy - miny + 1;

  // Dynamically calculate cell size to fit in available space
  // Leave room for sidebars: ~700px total (300px left + 400px right)
  // Target max grid width: ~1000px on typical screen
  const maxGridWidth = Math.min(1000, window.innerWidth - 750);
  const maxGridHeight = Math.min(800, window.innerHeight - 200);
  
  const cellSizeByWidth = Math.floor(maxGridWidth / width);
  const cellSizeByHeight = Math.floor(maxGridHeight / height);
  const CELL_SIZE = Math.min(Math.max(Math.min(cellSizeByWidth, cellSizeByHeight), 40), 100);

  const handleCellClick = (x: number, y: number, e: React.MouseEvent) => {
    e.preventDefault();
    const position = vec(x, y);

    if (e.button === 2 || e.ctrlKey) {
      // Right click or Ctrl+click: remove component
      onRemoveComponent(position);
    } else if (selectedComponent) {
      // Left click with selected component: add/replace component
      onAddComponent(position, selectedComponent);
    }
  };

  return (
    <div
      className="grid-container"
      style={{
        display: 'inline-block',
        border: '2px solid #333',
        backgroundColor: '#fafafa',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        width={width * CELL_SIZE}
        height={height * CELL_SIZE}
        style={{ display: 'block' }}
      >
        {/* Render grid cells */}
        {Array.from({ length: height }, (_, row) => {
          const y = maxy - row; // Flip y-axis (SVG has y increasing downward)
          return Array.from({ length: width }, (_, col) => {
            const x = minx + col;
            const position = vec(x, y);
            const posKey = vecToKey(position);
            const component = experiment.components.get(posKey);
            const isSource = vecEqual(position, experiment.source.position);

            // Find branches at this position
            const branchesHere = particle.filter((b) =>
              vecEqual(b.position, position)
            );

            return (
              <g key={`${x},${y}`}>
                {/* Cell background */}
                <rect
                  x={col * CELL_SIZE}
                  y={row * CELL_SIZE}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill={isSource ? '#e3f2fd' : 'white'}
                  stroke="#ccc"
                  strokeWidth={1}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => handleCellClick(x, y, e)}
                  onContextMenu={(e) => handleCellClick(x, y, e)}
                />

                {/* Source indicator */}
                {isSource && (
                  <text
                    x={col * CELL_SIZE + CELL_SIZE / 2}
                    y={row * CELL_SIZE + 20}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#666"
                    pointerEvents="none"
                  >
                    SOURCE
                  </text>
                )}

                {/* Component rendering */}
                {component && (
                  <g transform={`translate(${col * CELL_SIZE}, ${row * CELL_SIZE})`}>
                    <ComponentRenderer component={component} cellSize={CELL_SIZE} />
                  </g>
                )}

                {/* Particle visualization */}
                {branchesHere.map((branch, idx) => (
                  <g
                    key={idx}
                    transform={`translate(${col * CELL_SIZE + CELL_SIZE / 2}, ${
                      row * CELL_SIZE + CELL_SIZE / 2
                    })`}
                  >
                    <ParticleVisualization branch={branch} cellSize={CELL_SIZE} />
                  </g>
                ))}
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};

// Calculate bounds of the experiment with margin
function calculateBounds(experiment: Experiment): {
  minx: number;
  maxx: number;
  miny: number;
  maxy: number;
} {
  const positions: Vec[] = [experiment.source.position];

  experiment.components.forEach((_, key) => {
    const [xRe, , yRe] = key.split(',').map(Number);
    positions.push(vec(xRe, yRe)); // Assuming real positions only
  });

  let minx = Infinity;
  let maxx = -Infinity;
  let miny = Infinity;
  let maxy = -Infinity;

  positions.forEach((pos) => {
    const x = pos.x.re;
    const y = pos.y.re;
    minx = Math.min(minx, x);
    maxx = Math.max(maxx, x);
    miny = Math.min(miny, y);
    maxy = Math.max(maxy, y);
  });

  // Add margin
  minx = Math.floor(minx) - 1;
  maxx = Math.ceil(maxx) + 1;
  miny = Math.floor(miny) - 1;
  maxy = Math.ceil(maxy) + 1;

  return { minx, maxx, miny, maxy };
}

