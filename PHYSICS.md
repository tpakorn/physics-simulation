# Physics Summary

A quick reference for the equations and methods behind each simulation.

---

## 1. N-Pendulum — Chaotic Mechanics

A chain of N rigid rods with point masses, swinging under gravity.

### Equations of Motion (Lagrangian)

The system is governed by coupled nonlinear ODEs derived from the Lagrangian. Defining θᵢ as the angle and ωᵢ = θ̇ᵢ as the angular velocity of the i-th pendulum:

$$\sum_{j} M_{ij}\,\dot{\omega}_j = F_i$$

**Mass matrix:**
$$M_{ij} = \left(\sum_{k=\max(i,j)}^{N-1} m_k\right) l_i l_j \cos(\theta_i - \theta_j)$$

**Force vector:**
$$F_i = -\sum_{j} \left(\sum_{k=\max(i,j)}^{N-1} m_k\right) l_i l_j \sin(\theta_i - \theta_j)\,\omega_j^2 - \left(\sum_{k=i}^{N-1} m_k\right) g\, l_i \sin\theta_i$$

The linear system M·α = F is solved each step via Gaussian elimination.

### Numerical Method
**RK4 (4th-order Runge-Kutta)** — fixed timestep Δt = 1/240 s.

$$k_1 = f(t,\,y), \quad k_2 = f\!\left(t+\tfrac{\Delta t}{2},\,y+\tfrac{\Delta t}{2}k_1\right), \quad \ldots$$
$$y_{n+1} = y_n + \tfrac{\Delta t}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$

### Why Chaotic?
Tiny differences in initial conditions (e.g. 0.001° apart) diverge exponentially — the Lyapunov exponent λ > 0. The phase-space plot (θ vs ω) reveals the strange attractor-like structure.

### Conserved Quantity
Total mechanical energy (monitored, not enforced):
$$E = \underbrace{\tfrac{1}{2}\sum_i m_i v_i^2}_{T} + \underbrace{\sum_i m_i g y_i}_{V}$$

---

## 2. N-Body Gravity — Newtonian Dynamics

N point masses interacting via pairwise gravitational attraction.

### Equations of Motion

$$\ddot{\mathbf{r}}_i = \sum_{j \neq i} \frac{G m_j\,(\mathbf{r}_j - \mathbf{r}_i)}{(|\mathbf{r}_j - \mathbf{r}_i|^2 + \varepsilon^2)^{3/2}}$$

The softening term ε² prevents the force from diverging when bodies get very close.

### Numerical Method
**Velocity Verlet** (symplectic, 2nd-order) — preserves energy better than plain Euler:

$$\mathbf{v}_{n+1/2} = \mathbf{v}_n + \tfrac{\Delta t}{2}\,\mathbf{a}_n$$
$$\mathbf{r}_{n+1} = \mathbf{r}_n + \Delta t\,\mathbf{v}_{n+1/2}$$
$$\mathbf{v}_{n+1} = \mathbf{v}_{n+1/2} + \tfrac{\Delta t}{2}\,\mathbf{a}_{n+1}$$

Complexity: O(N²) per step (all pairs).

### Conserved Quantities
$$E = \sum_i \tfrac{1}{2}m_i v_i^2 - \sum_{i<j} \frac{G m_i m_j}{r_{ij}}$$

Total momentum **p** = Σ mᵢ**v**ᵢ is also conserved (no external forces).

---

## 3. Billiard in Circle — Elastic Collisions

N equal-mass balls bouncing inside a circular boundary.

### Ball–Ball Collision

For two balls with positions **r**ᵢ, **r**ⱼ and velocities **v**ᵢ, **v**ⱼ, the collision normal is:

$$\hat{n} = \frac{\mathbf{r}_i - \mathbf{r}_j}{|\mathbf{r}_i - \mathbf{r}_j|}$$

Equal-mass elastic exchange (impulse method):

$$\Delta \mathbf{v} = [(\mathbf{v}_i - \mathbf{v}_j)\cdot\hat{n}]\,\hat{n}$$
$$\mathbf{v}_i' = \mathbf{v}_i - \Delta\mathbf{v}, \qquad \mathbf{v}_j' = \mathbf{v}_j + \Delta\mathbf{v}$$

### Ball–Wall Collision

Reflect the radial component of velocity. If **r** is the ball position and R is the boundary radius:

$$\hat{n} = \frac{\mathbf{r}}{|\mathbf{r}|}, \qquad \mathbf{v}' = \mathbf{v} - 2(\mathbf{v}\cdot\hat{n})\,\hat{n}$$

### Numerical Method
**Semi-implicit Euler** with 8 sub-steps per frame:

$$\mathbf{r}_{n+1} = \mathbf{r}_n + \mathbf{v}_n\,\Delta t$$

Overlapping pairs are pushed apart by half the overlap before velocity exchange.

### Conservation Laws
- Kinetic energy: E = Σ ½vᵢ² (conserved per elastic collision)
- Total momentum: Σ mᵢ**v**ᵢ (not globally conserved — wall exerts impulse)

### Emergent Statistics
With many balls, the speed distribution relaxes toward the **Maxwell–Boltzmann** distribution:

$$f(v) \propto v\,e^{-v^2 / 2\sigma^2}$$

---

## 4. Vortex Street — Lattice Boltzmann (LBM)

Fluid flow past circular obstacles, producing the Kármán vortex street.

### LBM Overview

Instead of solving the Navier-Stokes equations directly, LBM tracks a probability distribution fᵢ(x, t) — the fraction of "fluid particles" moving in each of 9 lattice directions (D2Q9).

```
  6  2  5
   \ | /
 3 — 0 — 1
   / | \
  7  4  8
```

### BGK Collision Step

$$f_i^{\text{new}}(\mathbf{x},t) = f_i(\mathbf{x},t) - \frac{1}{\tau}\bigl[f_i(\mathbf{x},t) - f_i^{\text{eq}}(\mathbf{x},t)\bigr]$$

**Equilibrium distribution:**
$$f_i^{\text{eq}} = W_i\,\rho\left[1 + 3(\mathbf{c}_i\cdot\mathbf{u}) + \tfrac{9}{2}(\mathbf{c}_i\cdot\mathbf{u})^2 - \tfrac{3}{2}|\mathbf{u}|^2\right]$$

τ is the relaxation time; it controls viscosity:
$$\nu = \frac{2\tau - 1}{6}, \qquad \text{Re} = \frac{U\,D}{\nu}$$

### Streaming Step

$$f_i(\mathbf{x} + \mathbf{c}_i,\, t+1) = f_i^{\text{new}}(\mathbf{x},\, t)$$

Obstacle surfaces use **bounce-back** (fᵢ → f_opposite), enforcing the no-slip condition.

### Macroscopic Quantities

Density and momentum are recovered as moments:
$$\rho = \sum_i f_i, \qquad \rho\,\mathbf{u} = \sum_i f_i\,\mathbf{c}_i$$

### Vorticity

Computed via finite differences to visualise the vortex street:
$$\omega = \frac{\partial u_y}{\partial x} - \frac{\partial u_x}{\partial y}$$

### Strouhal Number

The shedding frequency f of the vortices (found via FFT of a downstream probe) obeys:
$$\text{St} = \frac{f\,D}{U} \approx 0.2 \quad \text{for Re} \approx 100$$

---

## Quick Reference

| Simulation | Method | Time complexity | Key parameter |
|---|---|---|---|
| N-Pendulum | RK4 | O(N³) | N pendulums, initial angles |
| N-Body | Velocity Verlet | O(N²) | N bodies, softening ε |
| Billiard | Euler + impulse | O(N²) | N balls, radius, speed |
| Vortex Street | LBM D2Q9 | O(NX·NY) | Reynolds number Re |
