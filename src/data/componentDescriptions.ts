// Component descriptions for educational tooltips

export const COMPONENT_DESCRIPTIONS = {
  'sg-vertical': {
    name: 'Stern-Gerlach (Vertical)',
    shortcut: '1',
    description: 'Measures vertical (z-axis) spin of particles',
    details: 'Splits particles into spin-up and spin-down paths based on vertical spin measurement. Only affects particles moving right (→).',
    usage: 'Used to measure quantum spin states and demonstrate quantum superposition.',
  },
  'sg-horizontal': {
    name: 'Stern-Gerlach (Horizontal)',
    shortcut: '2',
    description: 'Measures horizontal (x-axis) spin of particles',
    details: 'Splits particles into spin-left and spin-right paths based on horizontal spin measurement. Only affects particles moving right (→).',
    usage: 'Used to demonstrate that spin measurements in different axes are incompatible observables.',
  },
  detector: {
    name: 'Detector',
    shortcut: '3',
    description: 'Detects particles and collapses wave function',
    details: 'When a particle reaches a detector, the wave function collapses probabilistically. Detection ends the simulation.',
    usage: 'Place detectors at endpoints to measure final particle states and probabilities.',
  },
  'splitter-forward': {
    name: 'Beam Splitter (/)',
    shortcut: '4',
    description: 'Splits particle into two paths at 50/50 probability',
    details: 'Creates quantum superposition by splitting into reflected and transmitted paths. Adds +90° phase shift to reflected path.',
    usage: 'Essential for creating interference patterns in double-slit experiments.',
  },
  'splitter-backward': {
    name: 'Beam Splitter (\\)',
    shortcut: '5',
    description: 'Splits particle into two paths at 50/50 probability',
    details: 'Creates quantum superposition by splitting into reflected and transmitted paths. Adds +90° phase shift to reflected path.',
    usage: 'Essential for creating interference patterns in double-slit experiments.',
  },
  joiner: {
    name: 'Beam Joiner',
    shortcut: '6',
    description: 'Combines two paths with phase shift',
    details: 'Accepts particles from left and below, outputs right. Adds -90° phase shift to particles from above. Enables quantum interference.',
    usage: 'Combine split paths to create interference effects.',
  },
  'mirror-forward': {
    name: 'Mirror (/)',
    shortcut: '7',
    description: 'Reflects particles with 180° phase shift',
    details: 'Reflects particle trajectory and adds 180° phase shift (multiply amplitude by -1).',
    usage: 'Redirect particles and control phase for interference patterns.',
  },
  'mirror-backward': {
    name: 'Mirror (\\)',
    shortcut: '8',
    description: 'Reflects particles with 180° phase shift',
    details: 'Reflects particle trajectory and adds 180° phase shift (multiply amplitude by -1).',
    usage: 'Redirect particles and control phase for interference patterns.',
  },
  glass: {
    name: 'Phase Shifter (Glass)',
    shortcut: '9',
    description: 'Adds phase shift to particle amplitude',
    details: 'Multiplies particle amplitude by a complex phase factor. Default is +90° (multiply by i).',
    usage: 'Control relative phases between paths to create constructive or destructive interference.',
  },
  eraser: {
    name: 'Eraser',
    shortcut: 'E',
    description: 'Remove components from grid',
    details: 'Click on components to remove them from the experiment.',
    usage: 'Clean up unwanted components.',
  },
  hand: {
    name: 'Hand Tool',
    shortcut: 'H or Space',
    description: 'Pan the canvas',
    details: 'Drag to move the view around. Use mouse wheel to zoom.',
    usage: 'Navigate large experiments.',
  },
};

export type ComponentKey = keyof typeof COMPONENT_DESCRIPTIONS;

