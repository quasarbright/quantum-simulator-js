# Quantum Simulator

This is an interactive quantum mechanics simulator that lets you build and visualize single-electron quantum experiments on a 2D grid.

## How It Works

The simulator models a _single_ electron moving through space and interacting with various optical and quantum components. The electron can be in a superposition of positions and velocities, which we'll call branches. Each branch has

- **Position**
- **velocity**: Indicated with a green arrow
- **Spin state**: Indicated with a red line
- **Amplitude** (a complex number representing the probability amplitude): Indicated with a blue line for phase (direction) and a pie chart for probability.

### Quantum Superposition

When a particle encounters certain components, it may branch into a **superposition** of possible trajectories. The particle's state is described by a superposition of branches:

$$\ket{\psi} = \sum_i c_i \ket{x_i\ v_i} \otimes \ket{s_i}$$

Where

- $i$ enumerates over branches, possible trajectories
- $c_i$ is a branch's probability amplitude, a complex number representing how likely the electron is to be in this branch
- $x_i$ is a branch's position
- $v_i$ is a branch's velocity
- $s_i$ is a branch's spin state

In the real world, a particle's position and momentum/velocity can never be perfectly known. This simulation is a massive simplification, so it is not accurate. Its goal is to demonstrate a few interesting quantum phenomena and nothing more.

### Measurement and Collapse

When a branch reaches a **detector**, the particle gets detected with probability $|c|^2$, where $c$ is the amplitude of that branch. In the case that the particle is detected, all other branches vanish since the particle is definitely at the detector. If the particle is not detected, that means the particle is not there, so that branch is removed from the superposition and other branches' amplitudes are renormalized to make sure the total probability is 1 (unitarity).

### Interference

When two branches have the same position and velocity, they combine into a single branch. Branch amplitudes combine, meaning it is possible to have constructive and destructive interference depending on the phase of the branch (phase is the angle of the probability amplitude). Spin states combine as a sum weighted by branch amplitudes, which is then renormalized to maintain unitarity within the spin state.

This model of interference is not physically accurate and can result in nonsense like the particle "vanishing" if all branches perfectly destructively interfere. We have discrete branches with perfectly known, discrete positions and velocities. In reality, the wavefunction is continuously spread out through space and interference is more nuanced.

### Time Evolution

Each branch undergoes time-evolution, shifting the phase of its amplitude depending on its velocity.

### Spin State

A particle can have "spin" in some direction. We can imagine the "direction" of this spin as a point on the surface of the sphere, called the Bloch sphere. Let's say the particle is spin-up (positive along the $z$-axis). If we measure the particle's spin along the $z$-axis, we'll get spin-up 100% of the time and spin-down 0% of the time. However, being in a definite spin state on one axis means being a superposition of spin states along another axis. So if we measure the spin along the $x$-axis, we will see 50-50 between left and right spin.

Each branch has a spin state, which is computationally represented as a superposition of spin-up and spin-down (z-axis):

$$\ket{s} = \alpha \ket{\uparrow} + \beta \ket{\downarrow}$$

However, any other basis, like left-right would be equally valid. We can indicate the direction of definite spin by computing the spin-state's location on the Bloch sphere. We visualize the spin of a branch by computing its position on the Bloch sphere and projecting that position onto the $xz$ plane, and draw a red line from the branch's center to this position.

### Unitarity

The total probability across all branches must be 1

$$\sum_i |c_i|^2 = 1$$

This is called unitarity.

Additionally, each spin state much maintain internal unitarity:

$$|\alpha|^2 + |\beta|^2 = 1$$

Some events may disturb unitarity and require renormalization, where everything is uniformly scaled to make sure the total probability is 1. This shouldn't be necessary and is a result of the physical inaccuracy of this simplified simulation.

## Components

### Stern-Gerlach Apparatus (SG)

The Stern-Gerlach apparatus measures the spin of a particle along a specific axis:

- **Vertical SG**: Measures spin along the z-axis, splitting branch into spin-up (sending to the right) and spin-down (sending up) states
- **Horizontal SG**: Measures spin along the x-axis, splitting particles into spin-right (sending to the right) and spin-left (sending up) states

When a branch with state

$$\ket{\psi} = c \ket{x\ [1\ 0]} \otimes \ket{s}$$

passes through an SG device measuring along some axis corresponding to basis spin states $\ket{+},\ket{-}$, it splits into two branches with amplitudes determined by the inner product:

$$\ket{\psi_+} = c\braket{+|s} \ket{x\ [1\ 0]} \otimes \ket{+}$$
$$\ket{\psi_-} = c\braket{-|s} \ket{x\ [0\ 1]} \otimes \ket{-}$$

In other words, a superposition of spin states becomes a superposition of velocity states.

For example, if we represent spin in the $z$ basis and pass a branch through an SG aligned on the $z$-axis:

$$\ket{\psi} = c \ket{x\ [1\ 0]} \otimes (\alpha \ket{\uparrow} + \beta\ket{\downarrow})$$

$$\ket{\psi_\uparrow} = c\alpha \ket{x\ [1\ 0]} \otimes \ket{\uparrow}$$
$$\ket{\psi_\downarrow} = c\beta \ket{x\ [0\ 1]} \otimes \ket{\downarrow}$$

### Beam Splitter

A beam splitter divides a branch's amplitude equally between two paths and shifts the phase of the deflected path. The particle enters a superposition of going in two different directions.

### Joiner

If a particle enters from below, it is deflected to the right and its phase is shifted. Otherwise the particle is left alone.

A joiner can combine two branches that enter at the same time. These two branches will then interfere.

The joiner is kind of like the opposite of the beam splitter and its deflection phase shift undoes the splitter's deflection phase shift.

### Mirror

Reflects a particle's direction of travel by 90 degrees and shifts its phase.

### Glass

Introduces a phase shift to the particle's amplitude as it passes through.

### Detector

Measures the particle's position, causing superposition collapse. The probability of detection is:

$$P = |c|^2$$

where $c$ is the amplitude of the branch reaching the detector.

## Famous Experiments

### Double Stern-Gerlach

Demonstrates that measuring spin along one axis destroys information about spin along perpendicular axes. A particle measured as spin-up along the $z$-axis has equal probability of being spin-right or spin-left along the $x$-axis.

Even though the particle was in a definite state of spin-up and then definite spin-right, measuring its vertical state again results in a superposition of spin-up and spin-down because being in a definite state of spin-right is being in a superposition of spin-up and spin-down.

### Double-Slit Experiment

The classic demonstration of quantum interference. A particle may go through one path or another, and these paths may interfere with each other. This simulation does not support diffraction or continuous waves, so beam splitters represent slits.

## Tips

- Use **Select mode** (V) to select, move, copy, and paste components
- Use **Ctrl/Cmd + Z** to undo and **Ctrl/Cmd + Shift + Z** to redo
- Click the **Statistics** button to run experiments multiple times and see probability distributions
- Use **Save/Load** to preserve your experiments or share them via URL
