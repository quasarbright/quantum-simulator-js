// Interactive experiment grid editor with pan and zoom

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { vec, vecEqual, vecToKey, type Vec } from '../core/vec';
import type { Component, System } from '../core/types';
import { ComponentRenderer } from './ComponentRenderer';
import { ParticleVisualization } from './ParticleVisualization';

interface GridProps {
  system: System;
  selectedComponent: Component | null;
  onAddComponent: (position: Vec, component: Component) => void;
  onRemoveComponent: (position: Vec) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  isPanMode: boolean;
}

// Transform between simulation coordinates and pixel coordinates
interface Transform {
  offsetX: number; // Pixel offset
  offsetY: number;
  scale: number; // Pixels per simulation unit
}

const CELL_SIZE = 60; // Simulation unit size (constant)

// Convert simulation coordinates to pixel coordinates
const simToPixel = (simX: number, simY: number, transform: Transform) => ({
  x: simX * transform.scale + transform.offsetX,
  y: -simY * transform.scale + transform.offsetY, // Y is flipped
});

// Convert pixel coordinates to simulation coordinates
const pixelToSim = (pixelX: number, pixelY: number, transform: Transform) => ({
  x: (pixelX - transform.offsetX) / transform.scale,
  y: -(pixelY - transform.offsetY) / transform.scale, // Y is flipped
});

// Get pixel position for top-left corner of a cell at simulation coords (x, y)
const getCellTopLeft = (simX: number, simY: number, transform: Transform) => {
  // Top-left of cell is at (simX, simY + 1) in simulation space
  return simToPixel(simX, simY + 1, transform);
};

// Get pixel position for center of a cell at simulation coords (x, y)
const getCellCenter = (simX: number, simY: number, transform: Transform) => {
  // Center of cell is at (simX + 0.5, simY + 0.5) in simulation space
  return simToPixel(simX + 0.5, simY + 0.5, transform);
};

// Parse position from vecToKey format
const parseVecFromKey = (key: string): { x: number; y: number } => {
  // Keys are in format "x.re,x.im,y.re,y.im"
  const parts = key.split(',');
  return {
    x: parseFloat(parts[0]), // x.re
    y: parseFloat(parts[2]), // y.re
  };
};

export const Grid: React.FC<GridProps> = ({
  system,
  selectedComponent,
  onAddComponent,
  onRemoveComponent,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  isPanMode,
}) => {
  const { experiment, particle } = system;
  
  // Transform state - initialize with origin near bottom left
  const [transform, setTransform] = useState<Transform>(() => ({
    offsetX: 150,
    offsetY: window.innerHeight - 150,
    scale: 1.5 * CELL_SIZE, // Start at 1.5x zoom (90 pixels per cell)
  }));
  
  // Handle space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        // Stop panning when space is released
        setIsPanning(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Expose transform controls to parent
  useEffect(() => {
    // This is a bit hacky but works for passing zoom functions up
    (window as any).__gridZoomIn = () => {
      setTransform((prev) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const zoomFactor = 1.2;
        const newScale = Math.min(CELL_SIZE * 5, prev.scale * zoomFactor);
        
        const newOffsetX = centerX - (centerX - prev.offsetX) * (newScale / prev.scale);
        const newOffsetY = centerY - (centerY - prev.offsetY) * (newScale / prev.scale);
        
        return { offsetX: newOffsetX, offsetY: newOffsetY, scale: newScale };
      });
    };
    
    (window as any).__gridZoomOut = () => {
      setTransform((prev) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const zoomFactor = 0.8;
        const newScale = Math.max(CELL_SIZE * 0.1, prev.scale * zoomFactor);
        
        const newOffsetX = centerX - (centerX - prev.offsetX) * (newScale / prev.scale);
        const newOffsetY = centerY - (centerY - prev.offsetY) * (newScale / prev.scale);
        
        return { offsetX: newOffsetX, offsetY: newOffsetY, scale: newScale };
      });
    };
    
    (window as any).__gridZoomToFit = () => {
      // Calculate bounding box of all components and source
      const positions: Array<{ x: number; y: number }> = [
        { x: experiment.source.position.x.re, y: experiment.source.position.y.re },
      ];
      
      experiment.components.forEach((_, key) => {
        const pos = parseVecFromKey(key);
        positions.push(pos);
      });
      
      if (positions.length === 0) return;
      
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      positions.forEach(({ x, y }) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });
      
      // Add margin
      const margin = 2;
      minX -= margin;
      maxX += margin;
      minY -= margin;
      maxY += margin;
      
      // Calculate scale to fit
      const width = maxX - minX + 1;
      const height = maxY - minY + 1;
      const scaleX = window.innerWidth * 0.8 / width;
      const scaleY = window.innerHeight * 0.8 / height;
      const newScale = Math.min(scaleX, scaleY);
      
      // Center the view
      const centerX = (minX + maxX + 1) / 2;
      const centerY = (minY + maxY + 1) / 2;
      
      setTransform({
        offsetX: window.innerWidth / 2 - centerX * newScale,
        offsetY: window.innerHeight / 2 + centerY * newScale,
        scale: newScale,
      });
    };
  }, [experiment, onZoomIn, onZoomOut, onZoomToFit]);
  
  // Call exposed functions
  useEffect(() => {
    if (onZoomIn) (window as any).__onZoomInCallback = onZoomIn;
    if (onZoomOut) (window as any).__onZoomOutCallback = onZoomOut;
    if (onZoomToFit) (window as any).__onZoomToFitCallback = onZoomToFit;
  }, [onZoomIn, onZoomOut, onZoomToFit]);
  
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Handle wheel events for pan and zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Pinch-to-zoom centered on mouse position
      const zoomFactor = 1 - e.deltaY * 0.01;
      
      setTransform((prev) => {
        const newScale = Math.max(CELL_SIZE * 0.1, Math.min(CELL_SIZE * 5, prev.scale * zoomFactor));
        
        // Keep the point under the mouse cursor stationary
        // Point in simulation space: (mouseX - offsetX) / scale
        // After zoom, it should still be at mouseX, mouseY in pixel space
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const newOffsetX = mouseX - (mouseX - prev.offsetX) * (newScale / prev.scale);
        const newOffsetY = mouseY - (mouseY - prev.offsetY) * (newScale / prev.scale);
        
        return {
          offsetX: newOffsetX,
          offsetY: newOffsetY,
          scale: newScale,
        };
      });
    } else {
      // Pan
      setTransform((prev) => ({
        ...prev,
        offsetX: prev.offsetX - e.deltaX,
        offsetY: prev.offsetY - e.deltaY,
      }));
    }
  }, []);
  
  // Handle mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey) || (e.button === 0 && isSpacePressed) || (e.button === 0 && isPanMode)) {
      // Middle mouse, Shift+Left mouse, Space+Left mouse, or pan mode button starts panning
      e.preventDefault();
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  }, [isSpacePressed, isPanMode]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setTransform((prev) => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
      setHoveredCell(null); // Clear hover when panning
    } else if (!isSpacePressed && !isPanMode) {
      // Update hovered cell when in edit mode
      const simCoords = pixelToSim(e.clientX, e.clientY, transform);
      const gridX = Math.floor(simCoords.x);
      const gridY = Math.floor(simCoords.y);
      setHoveredCell({ x: gridX, y: gridY });
    }
  }, [isPanning, lastMousePos, isSpacePressed, isPanMode, transform]);
  
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setHoveredCell(null); // Clear hover when mouse leaves
  }, []);
  
  // Handle space key for panning mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        // Stop panning when space is released
        setIsPanning(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    
    svg.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      svg.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);
  
  const handleCellClick = (e: React.MouseEvent) => {
    if (isPanning || isSpacePressed || isPanMode) return; // Don't place components while panning or in pan mode
    
    // Only handle left click
    if (e.button !== 0) return;
    
    e.preventDefault();
    
    // Convert click position to simulation coordinates
    const simCoords = pixelToSim(e.clientX, e.clientY, transform);
    const gridX = Math.floor(simCoords.x);
    const gridY = Math.floor(simCoords.y);
    const position = vec(gridX, gridY);

    if (selectedComponent) {
      // Left click with selected component: add/replace component
      onAddComponent(position, selectedComponent);
    } else {
      // Left click with eraser (no component selected): remove component
      onRemoveComponent(position);
    }
  };
  
  // Get visible grid lines
  const getVisibleGridLines = () => {
    const topLeft = pixelToSim(0, 0, transform);
    const bottomRight = pixelToSim(viewportWidth, viewportHeight, transform);
    
    const minX = Math.floor(topLeft.x);
    const maxX = Math.ceil(bottomRight.x);
    const minY = Math.floor(bottomRight.y); // Y is flipped
    const maxY = Math.ceil(topLeft.y);
    
    return { minX, maxX, minY, maxY };
  };
  
  const { minX, maxX, minY, maxY } = getVisibleGridLines();
  
  // Check if a component at (x, y) is visible
  const isComponentVisible = (x: number, y: number) => {
    const topLeft = simToPixel(x, y + 1, transform);
    const bottomRight = simToPixel(x + 1, y, transform);
    
    return (
      bottomRight.x >= 0 &&
      topLeft.x <= viewportWidth &&
      bottomRight.y >= 0 &&
      topLeft.y <= viewportHeight
    );
  };

  return (
    <div
      className="grid-container"
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden',
        cursor: (isSpacePressed || isPanMode)
          ? (isPanning ? 'grabbing' : 'grab')
          : (isPanning ? 'grabbing' : 'default'),
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        onClick={handleCellClick}
      >
        {/* Grid lines */}
        <g>
          {/* Vertical grid lines */}
          {Array.from({ length: maxX - minX + 1 }, (_, i) => {
            const x = minX + i;
            const pixelPos = simToPixel(x, 0, transform);
            return (
              <line
                key={`vline-${x}`}
                x1={pixelPos.x}
                y1={0}
                x2={pixelPos.x}
                y2={viewportHeight}
                stroke="#404040"
                strokeWidth={0.5}
              />
            );
          })}
          
          {/* Horizontal grid lines */}
          {Array.from({ length: maxY - minY + 1 }, (_, i) => {
            const y = minY + i;
            const pixelPos = simToPixel(0, y, transform);
            return (
              <line
                key={`hline-${y}`}
                x1={0}
                y1={pixelPos.y}
                x2={viewportWidth}
                y2={pixelPos.y}
                stroke="#404040"
                strokeWidth={0.5}
              />
            );
          })}
        </g>

        {/* Components */}
        <g>
          {Array.from(experiment.components.entries()).map(([key, component]) => {
            const { x, y } = parseVecFromKey(key);
            
            if (!isComponentVisible(x, y)) return null;
            
            const position = vec(x, y);
            const isSource = vecEqual(position, experiment.source.position);
            const pixelPos = getCellTopLeft(x, y, transform);
            const cellPixelSize = transform.scale;

            return (
              <g key={`cmp-${x},${y}`}>
                {/* Source indicator */}
                {isSource && (
                  <text
                    x={pixelPos.x + cellPixelSize / 2}
                    y={pixelPos.y + 20}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#d4d4d4"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    SOURCE
                  </text>
                )}
                
                {/* Component rendering */}
                <g
                  transform={`translate(${pixelPos.x}, ${pixelPos.y}) scale(${cellPixelSize / CELL_SIZE})`}
                  style={{ pointerEvents: 'none' }}
                >
                  <ComponentRenderer component={component} cellSize={CELL_SIZE} />
                </g>
              </g>
            );
          })}
          
          {/* Source cell (if no component there) */}
          {(() => {
            const sourceX = experiment.source.position.x.re;
            const sourceY = experiment.source.position.y.re;
            const sourceKey = vecToKey(experiment.source.position);
            
            if (!experiment.components.has(sourceKey) && isComponentVisible(sourceX, sourceY)) {
              const pixelPos = getCellTopLeft(sourceX, sourceY, transform);
              const cellPixelSize = transform.scale;
              
              return (
                <g key="source-cell">
                  <text
                    x={pixelPos.x + cellPixelSize / 2}
                    y={pixelPos.y + 20}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#d4d4d4"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    SOURCE
                  </text>
                </g>
              );
            }
            return null;
          })()}
        </g>

        {/* Particles */}
        <g>
          {particle.map((branch, idx) => {
            const x = branch.position.x.re;
            const y = branch.position.y.re;
            
            if (!isComponentVisible(x, y)) return null;
            
            const pixelPos = getCellCenter(x, y, transform);
            const cellPixelSize = transform.scale;
            
            return (
              <g
                key={`particle-${idx}`}
                transform={`translate(${pixelPos.x}, ${pixelPos.y}) scale(${cellPixelSize / CELL_SIZE})`}
                style={{ pointerEvents: 'none' }}
              >
                <ParticleVisualization branch={branch} cellSize={CELL_SIZE} />
              </g>
            );
          })}
        </g>

        {/* Hovered cell highlight and ghost component (only in edit mode) */}
        {hoveredCell && !isPanMode && !isSpacePressed && (
          <g>
            {(() => {
              const pixelPos = getCellTopLeft(hoveredCell.x, hoveredCell.y, transform);
              const cellPixelSize = transform.scale;
              
              return (
                <>
                  {/* Blue border highlight */}
                  <rect
                    x={pixelPos.x}
                    y={pixelPos.y}
                    width={cellPixelSize}
                    height={cellPixelSize}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    style={{ pointerEvents: 'none' }}
                  />
                  
                  {/* Ghost component preview (only when placing) */}
                  {selectedComponent && (
                    <g
                      transform={`translate(${pixelPos.x}, ${pixelPos.y}) scale(${cellPixelSize / CELL_SIZE})`}
                      style={{ pointerEvents: 'none', opacity: 0.5 }}
                    >
                      <ComponentRenderer component={selectedComponent} cellSize={CELL_SIZE} />
                    </g>
                  )}
                </>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
};

