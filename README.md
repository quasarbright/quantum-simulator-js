# Quantum Simulator Web

A web-based quantum physics simulator with an interactive experiment editor. This is a faithful port of the original Racket-based quantum simulator, preserving all simulation logic and edge cases.

## Features

- **Interactive Grid Editor**: Click to place quantum components on a grid
- **Real-time Visualization**: Watch particles evolve through quantum states
- **Step-by-Step Simulation**: Step through experiments manually or run automatically with speed control
- **Pre-loaded Examples**: 
  - Double Stern-Gerlach experiment
  - Double-slit experiment
  - Double-slit with phase shifter (partial destructive interference)

## Components

The simulator includes the following quantum components:

- **Stern-Gerlach (SG)**: Measures spin and creates spatial superposition (vertical or horizontal)
- **Detector**: Collapses wave function when particle is detected
- **Beam Splitter**: Creates spatial superposition with +90° phase shift
- **Joiner**: Combines paths from multiple directions with -90° phase shift
- **Mirror**: Reflects particles with 180° phase shift
- **Glass**: Applies arbitrary phase shift

## Particle Visualization

Each particle branch is visualized with:
- **Circle**: Represents the particle
- **Gray pie slice**: Shows probability (amplitude squared)
- **Blue line**: Shows phase angle
- **Red line**: Shows spin direction (Bloch sphere xz projection)
- **Black arrow**: Shows velocity direction

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm build
```

## How to Use

1. **Select a Component**: Click on a component in the palette (left sidebar)
2. **Place Component**: Click on any grid cell to place the selected component
3. **Remove Component**: Right-click (or Ctrl+click) on a cell to remove a component
4. **Run Simulation**: 
   - Click "Step" to advance one timestep
   - Click "Play" to run automatically
   - Adjust speed slider to control playback speed
5. **Reset**: Click "Reset" to restart from the beginning
6. **Load Examples**: Click on example buttons to load pre-configured experiments

## Implementation Details

This simulator implements quantum mechanics concepts including:

- Wave function superposition
- Quantum interference (constructive and destructive)
- Wave function collapse (measurement)
- Phase evolution from time and momentum
- Component-specific phase shifts
- Spin state manipulation

### Critical Edge Cases

The simulation preserves several important edge cases from the original:

- Stern-Gerlach only affects particles moving right (→)
- Joiner only redirects particles moving down (↓)
- Destructive interference can lead to zero amplitude
- Spin state can be annihilated during interference
- Phase shifts are precisely calibrated for interference patterns

### Phase Shifts

- **Time evolution**: -1 (e^iπ)
- **Momentum**: i for each velocity component (e^iπ/2)
- **Splitter reflection**: +i (+90°)
- **Joiner from up**: -i (-90°)
- **Mirror**: -1 (180°)

## Technologies

- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Immer**: Immutable state updates
- **complex.js**: Complex number operations
- **SVG**: Component and particle visualization

## License

MIT
