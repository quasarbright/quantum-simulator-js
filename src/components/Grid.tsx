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
  onHoverCell: (cell: { x: number; y: number } | null) => void;
  onZoomChange: (zoom: number) => void;
  onSelectComponent: (position: Vec) => void;
  isSimulationRunning: boolean;
  isSelectMode: boolean;
  selectedPositions: Set<string>;
  onSelectionClick: (position: Vec, isShiftKey: boolean) => void;
  onSelectionRectangle: (x1: number, y1: number, x2: number, y2: number) => void;
  selectionStart: { x: number; y: number } | null;
  onSetSelectionStart: (start: { x: number; y: number } | null) => void;
  onMoveSelection: (offsetX: number, offsetY: number) => void;
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
  onHoverCell,
  onZoomChange,
  onSelectComponent,
  isSimulationRunning,
  isSelectMode,
  selectedPositions,
  onSelectionClick,
  onSelectionRectangle,
  selectionStart,
  onSetSelectionStart,
  onMoveSelection,
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
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
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
        
        // Notify parent of zoom change
        onZoomChange(newScale / CELL_SIZE);
        
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
    // Prevent text selection during drag
    e.preventDefault();
    
    // Pan mode handling
    if (e.button === 1 || (e.button === 0 && e.shiftKey) || (e.button === 0 && isSpacePressed) || (e.button === 0 && isPanMode)) {
      // Middle mouse, Shift+Left mouse, Space+Left mouse, or pan mode button starts panning
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    // Left click only
    if (e.button !== 0) return;
    
    // Store mouse down position for click vs drag detection
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setIsMouseDown(true);
    
    // Skip if simulation is running
    if (isSimulationRunning) return;
    
    // In select mode, check if clicking on a selected cell
    if (isSelectMode) {
      const simCoords = pixelToSim(e.clientX, e.clientY, transform);
      const gridX = Math.floor(simCoords.x);
      const gridY = Math.floor(simCoords.y);
      const posKey = vecToKey(vec(gridX, gridY));
      
      // If clicking on a selected cell, prepare for drag-to-move
      if (selectedPositions.has(posKey)) {
        setIsDraggingSelection(true);
        setDragOffset({ x: 0, y: 0 });
        return;
      }
      
      // Otherwise, start rectangle selection
      onSetSelectionStart({ x: gridX, y: gridY });
    }
  }, [isSpacePressed, isPanMode, isSelectMode, isSimulationRunning, transform, selectedPositions, onSetSelectionStart]);
  
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
    } else if (isDraggingSelection && mouseDownPos) {
      // Calculate drag offset in grid cells
      const startSimCoords = pixelToSim(mouseDownPos.x, mouseDownPos.y, transform);
      const currentSimCoords = pixelToSim(e.clientX, e.clientY, transform);
      const offsetX = Math.floor(currentSimCoords.x) - Math.floor(startSimCoords.x);
      const offsetY = Math.floor(currentSimCoords.y) - Math.floor(startSimCoords.y);
      setDragOffset({ x: offsetX, y: offsetY });
    } else if (!isSpacePressed && !isPanMode) {
      // Update hovered cell when in edit mode
      const simCoords = pixelToSim(e.clientX, e.clientY, transform);
      const gridX = Math.floor(simCoords.x);
      const gridY = Math.floor(simCoords.y);
      const cell = { x: gridX, y: gridY };
      setHoveredCell(cell);
      onHoverCell(cell);
    }
  }, [isPanning, lastMousePos, isSpacePressed, isPanMode, transform, onHoverCell, isDraggingSelection, mouseDownPos]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Calculate if this was a click or a drag
    const wasClick = mouseDownPos && 
      Math.abs(e.clientX - mouseDownPos.x) < 5 && 
      Math.abs(e.clientY - mouseDownPos.y) < 5;
    
    const simCoords = pixelToSim(e.clientX, e.clientY, transform);
    const gridX = Math.floor(simCoords.x);
    const gridY = Math.floor(simCoords.y);
    
    // Handle drag-to-move completion
    if (isDraggingSelection && dragOffset && !wasClick) {
      if (dragOffset.x !== 0 || dragOffset.y !== 0) {
        onMoveSelection(dragOffset.x, dragOffset.y);
      }
      setIsDraggingSelection(false);
      setDragOffset(null);
    }
    // Handle rectangle selection completion
    else if (isSelectMode && selectionStart && !isSimulationRunning && !wasClick) {
      onSelectionRectangle(selectionStart.x, selectionStart.y, gridX, gridY);
      onSetSelectionStart(null);
    }
    // Handle single cell click in select mode
    else if (isSelectMode && wasClick && !isSimulationRunning) {
      const position = vec(gridX, gridY);
      onSelectionClick(position, e.shiftKey);
    }
    // Handle component placement/removal click (not in select mode)
    else if (!isSelectMode && wasClick && !isPanning && !isSpacePressed && !isPanMode && !isSimulationRunning) {
      const position = vec(gridX, gridY);
      const posKey = vecToKey(position);
      
      // Check for properties editing
      if (e.ctrlKey || e.metaKey) {
        if (experiment.components.has(posKey)) {
          onSelectComponent(position);
        }
      } else if (selectedComponent) {
        onAddComponent(position, selectedComponent);
      } else {
        onRemoveComponent(position);
      }
    }

    setIsPanning(false);
    setMouseDownPos(null);
    setIsMouseDown(false);
    setIsDraggingSelection(false);
    setDragOffset(null);
  }, [isSelectMode, selectionStart, isSimulationRunning, transform, onSelectionRectangle, onSetSelectionStart, 
      mouseDownPos, isDraggingSelection, dragOffset, onSelectionClick, isPanning, isSpacePressed, isPanMode,
      selectedComponent, onAddComponent, onRemoveComponent, onSelectComponent, experiment]);
  
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setIsMouseDown(false);
    setMouseDownPos(null);
    setIsDraggingSelection(false);
    setDragOffset(null);
    setHoveredCell(null); // Clear hover when mouse leaves
    onHoverCell(null);
  }, [onHoverCell]);
  
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
  
  // Note: handleCellClick is no longer used - all logic moved to handleMouseUp for proper click/drag detection
  
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
        style={{ 
          display: 'block',
          cursor: isDraggingSelection ? 'grabbing' : (isSelectMode && hoveredCell && selectedPositions.has(vecToKey(vec(hoveredCell.x, hoveredCell.y)))) ? 'move' : 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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
                
                {/* Selection highlight for components */}
                {selectedPositions.has(key) && (
                  <rect
                    x={pixelPos.x}
                    y={pixelPos.y}
                    width={cellPixelSize}
                    height={cellPixelSize}
                    fill="rgba(99, 102, 241, 0.2)"
                    stroke="#6366f1"
                    strokeWidth={3}
                    pointerEvents="none"
                  />
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

          {/* Live preview of cells being selected during drag (only while mouse is down) */}
          {isSelectMode && selectionStart && hoveredCell && !isDraggingSelection && isMouseDown && (() => {
            const minX = Math.min(selectionStart.x, hoveredCell.x);
            const maxX = Math.max(selectionStart.x, hoveredCell.x);
            const minY = Math.min(selectionStart.y, hoveredCell.y);
            const maxY = Math.max(selectionStart.y, hoveredCell.y);
            
            const cells = [];
            for (let x = minX; x <= maxX; x++) {
              for (let y = minY; y <= maxY; y++) {
                if (!isComponentVisible(x, y)) continue;
                
                const pixelPos = getCellTopLeft(x, y, transform);
                const cellPixelSize = transform.scale;
                
                cells.push(
                  <rect
                    key={`preview-${x}-${y}`}
                    x={pixelPos.x}
                    y={pixelPos.y}
                    width={cellPixelSize}
                    height={cellPixelSize}
                    fill="rgba(99, 102, 241, 0.15)"
                    stroke="#6366f1"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                );
              }
            }
            return <g>{cells}</g>;
          })()}

          {/* Selected empty cells (cells without components) */}
          {isSelectMode && Array.from(selectedPositions).map((posKey) => {
            // Only render highlight if there's no component at this position
            if (experiment.components.has(posKey)) return null;
            
            const parts = posKey.split(',');
            const x = parseFloat(parts[0]);
            const y = parseFloat(parts[2]);
            
            if (!isComponentVisible(x, y)) return null;
            
            const pixelPos = getCellTopLeft(x, y, transform);
            const cellPixelSize = transform.scale;
            
            return (
              <rect
                key={`selected-empty-${posKey}`}
                x={pixelPos.x}
                y={pixelPos.y}
                width={cellPixelSize}
                height={cellPixelSize}
                fill="rgba(99, 102, 241, 0.2)"
                stroke="#6366f1"
                strokeWidth={3}
                pointerEvents="none"
              />
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

        {/* Ghost preview of components being dragged */}
        {isDraggingSelection && dragOffset && (
          <g style={{ opacity: 0.5 }}>
            {Array.from(selectedPositions).map((posKey) => {
              const component = experiment.components.get(posKey);
              if (!component) return null; // Skip empty selected cells
              
              const parts = posKey.split(',');
              const oldX = parseFloat(parts[0]);
              const oldY = parseFloat(parts[2]);
              const newX = oldX + dragOffset.x;
              const newY = oldY + dragOffset.y;
              
              if (!isComponentVisible(newX, newY)) return null;
              
              const pixelPos = getCellTopLeft(newX, newY, transform);
              const cellPixelSize = transform.scale;
              
              return (
                <g
                  key={`ghost-${posKey}`}
                  transform={`translate(${pixelPos.x}, ${pixelPos.y}) scale(${cellPixelSize / CELL_SIZE})`}
                  style={{ pointerEvents: 'none' }}
                >
                  <ComponentRenderer component={component} cellSize={CELL_SIZE} />
                </g>
              );
            })}
          </g>
        )}

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

        {/* Hovered cell highlight (only in placement mode, not select mode or running) */}
        {hoveredCell && !isPanMode && !isSpacePressed && !isSimulationRunning && !isSelectMode && (
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
                  {!isSelectMode && selectedComponent && (
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

