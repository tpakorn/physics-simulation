# CLAUDE.md — Physics Simulation & Visualization (Static Site)

## 🎯 Project Overview

This project is a **static-site physics simulation platform** hosted on GitHub Pages, focused on:

- Interactive simulations
- Clean, minimal UI
- High-performance client-side computation
- Educational + visual intuition (especially chaos)

All computation must run **client-side**, with emphasis on:
- Performance (prefer compiled/WASM for core solvers)
- Smooth rendering (no UI blocking)
- Clear separation between UI, simulation, and rendering

---

# 🧱 Core Architecture

## High-Level Structure

```
/src
  /core          # Simulation engines (WASM or JS)
  /render        # Visualization (Canvas/WebGL)
  /ui            # Controls (sliders, buttons)
  /pages         # Individual simulations
  /shared        # Utilities (math, state, config)
  
/public
  index.html     # Landing page
  styles.css     # Global minimal styling
```

---

## Execution Model

- UI triggers parameter updates
- Simulation runs in **separate thread (Web Worker)** or WASM
- Renderer updates frame via `requestAnimationFrame`
- State is passed efficiently (TypedArrays)

---

## Performance Strategy

### Priority order:
1. **WASM (C/C++/Rust)** for core physics solvers
2. **Web Workers** for async computation
3. **Typed Arrays** for numerical data
4. **Canvas/WebGL** for rendering (avoid DOM-heavy updates)

---

## Simulation Loop Pattern

```
while (running):
    step_simulation(dt)
    update_render()
```

Must:
- Never block main thread
- Maintain ~60 FPS responsiveness
- Decouple simulation timestep from render rate

---

# 🎨 Design System (Global)

## Philosophy
- Minimalistic
- No clutter
- Dark-mode first
- Focus on motion + clarity

---

## Layout Rules

- Left: controls panel (fixed width)
- Right: simulation canvas
- Optional: secondary panel (phase space)

---

## Typography

- Sans-serif (clean, modern)
- Minimal text
- Labels > paragraphs

---

## UI Components

- Sliders (primary input)
- Toggle buttons (states)
- Reset / Pause / Play controls
- No dropdown unless necessary

---

## Visual Behavior

- Smooth transitions
- No flickering
- Fading trails (important for chaos visualization)

---

# 🎨 Color Themes (Strict)

Each simulation MUST have a distinct, consistent theme:

---

## 1. N-Pendulum (Chaotic Mechanics)

- Primary: Deep Blue
- Accent: Cyan
- Highlight: Electric Purple

Feel:
> Smooth, continuous, fluid chaos

---

## 2. N-Body (Gravitational System)

- Primary: Black / Space
- Accent: Gold / Yellow (mass)
- Highlight: White (trajectories)

Feel:
> Cosmic, orbital, elegant

---

## 3. N-Ball in Circle (Billiard Chaos)

- Primary: Dark Green
- Accent: Neon Green
- Highlight: Red collisions

Feel:
> Sharp, energetic, collision-driven

---

# 🏠 Landing Page (index.html)

## Requirements

- Clean minimal layout
- Title + short description
- 3 large clickable cards

Each card:
- Title
- Short description
- Color theme preview
- Link to simulation

---

# 🔬 Simulation Pages (General Rules)

Each simulation page must include:

## Layout

```
[ Controls Panel ] [ Main Canvas ] [ Phase Space Plot ]
```

---

## Shared Features

- Start / Pause / Reset buttons
- Adjustable timestep (optional)
- Real-time simulation
- Trail visualization (fade over time)
- Phase space plot (live)

---

## State Handling

- Central state object
- Immutable updates preferred
- Efficient memory reuse

---

# 🧪 Simulation 1: N-Pendulum

## Description

Chain of N pendulums (max N = 10), showing chaotic sensitivity.

---

## Controls

- Slider: N (1 → 10)
- Buttons: 3 preset initial conditions
- Restart button
- Pause/Resume button

---

## Physics

- Coupled nonlinear ODEs
- Prefer:
  - RK4 (initial version)
  - Optionally Verlet or symplectic later

---

## Visualization

- Pendulum rods + masses
- Smooth motion
- Trail for last mass (fading)

---

## Phase Space

- Plot:
  - angle vs angular velocity (last pendulum)
- Real-time updating

---

## Performance Notes

- Preallocate arrays
- Avoid recomputing structure when N unchanged

---

# 🌌 Simulation 2: N-Body (Gravity)

## Description

N-body gravitational interaction with chaotic trajectories.

---

## Controls

- Slider: N (suggest max ~50 depending on performance)
- Preset initial conditions (3)
- Restart
- Pause/Resume

---

## Physics

- Newtonian gravity
- Pairwise interaction (O(N²))
- Softening factor to avoid singularities

---

## Optimization

- Use WASM if possible
- Otherwise:
  - Typed arrays
  - Spatial partitioning (optional future)

---

## Visualization

- Particles as glowing points
- Trails fade over time
- Mass indicated by size or brightness

---

## Phase Space

- Energy vs time OR
- Velocity distribution

---

# 🟢 Simulation 3: N-Ball in Circle

## Description

Elastic collisions inside circular boundary → chaotic billiard system.

---

## Controls

- Slider: N (suggest max ~50–100)
- Restart
- Pause/Resume

---

## Physics

- Elastic collisions:
  - ball-ball
  - ball-wall (circle boundary)

---

## Requirements

- Accurate collision detection
- Stable reflection handling
- No overlap artifacts

---

## Visualization

- Fast motion
- Collision highlights (flash red)
- Trails fade over time

---

## Phase Space

- Speed distribution OR
- Angular momentum distribution

---

# ⚙️ Technical Requirements

## MUST

- No backend
- Fully static deploy (GitHub Pages)
- All simulations run client-side

---

## SHOULD

- Core physics in WASM (C/C++/Rust)
- UI in vanilla JS or lightweight framework
- No heavy frameworks unless necessary

---

## AVOID

- Blocking main thread
- Large memory allocations per frame
- DOM-heavy rendering

---

# 🧠 Development Phases

## Phase 1 (MVP)

- JS-only implementation
- Basic UI + simulation working

---

## Phase 2 (Performance)

- Move simulation to Web Worker
- Introduce Typed Arrays

---

## Phase 3 (Optimization)

- Port core solver to WASM
- Optimize rendering (Canvas/WebGL)

---

## Phase 4 (Polish)

- UI refinement
- Smooth transitions
- Consistent theme

---

# 🧭 Guiding Principles

1. **Responsiveness > accuracy (initially)**
2. **Clarity > complexity**
3. **Minimal UI, maximal insight**
4. **Everything must feel smooth**
5. **User should “see physics”, not code**

---

# 🚀 End Goal

A clean, fast, visually compelling set of physics demos that:

- Run entirely in browser
- Demonstrate chaotic dynamics clearly
- Are extensible for future simulations

---

END OF FILE