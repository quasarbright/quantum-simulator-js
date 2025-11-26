// Centralized color constants for quantum simulator components and visualizations

const PROBABILITY_COLOR = '#393cdb';
const PROBABILITY_BACKGROUND = '#1e1b3d';

const PHASE_COLOR = '#06b6d4';
const PHASE_BACKGROUND = '#1a3842';

const SPIN_COLOR = '#ec4899';
const SPIN_BACKGROUND = '#3f1515';

const VELOCITY_COLOR = '#10b981';
const VELOCITY_BACKGROUND = '#1a3329';

// === Particle Visualization Colors ===

// Particle circle background (uses detector background color)
export const PARTICLE_BACKGROUND = PROBABILITY_BACKGROUND; // Same as DETECTOR_BACKGROUND
export const PARTICLE_BORDER = PROBABILITY_COLOR; // Same as DETECTOR_BORDER

// Probability (Indigo/Purple theme)
export const PROBABILITY_PIE = PARTICLE_BORDER;
export const PROBABILITY_TEXT = '#94a3b8';

// Phase (Cyan/Turquoise theme)
export const PHASE_LINE = PHASE_COLOR;
export const PHASE_DOT = PHASE_COLOR;

// Spin (Magenta/Pink theme)
export const SPIN_LINE = SPIN_COLOR;
export const SPIN_DOT = SPIN_COLOR;

// Velocity (Green theme)
export const VELOCITY_ARROW = VELOCITY_COLOR;
export const VELOCITY_ARROWHEAD = VELOCITY_COLOR;

// === Component Colors ===

// Stern-Gerlach (Red theme)
export const SG_BACKGROUND = SPIN_BACKGROUND;
export const SG_BORDER = SPIN_COLOR;
export const SG_INDICATOR = SPIN_COLOR;

// Detector (Indigo theme)
export const DETECTOR_BACKGROUND = PARTICLE_BACKGROUND;
export const DETECTOR_BORDER = PARTICLE_BORDER;
export const DETECTOR_ICON = PARTICLE_BORDER;
export const DETECTOR_TEXT = PROBABILITY_COLOR;

// Glass (Cyan/Turquoise theme)
export const GLASS_BACKGROUND = PHASE_BACKGROUND;
export const GLASS_BORDER = PHASE_COLOR;
export const GLASS_TEXT = PHASE_COLOR;

// Mirrors, Splitters, Joiners (Green theme)
export const MOVEMENT_GLOW = VELOCITY_BACKGROUND;
export const GREEN_SOLID = VELOCITY_COLOR;

