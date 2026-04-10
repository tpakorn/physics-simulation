// ============================================================
// LBM D2Q9 Solver — Vortex Street Simulation
// BGK collision, pull-based streaming, bounce-back + Zou-He BC
// ============================================================
'use strict';

// D2Q9 lattice velocities and weights
const CX  = [0, 1, 0,-1, 0, 1,-1,-1, 1];
const CY  = [0, 0, 1, 0,-1, 1, 1,-1,-1];
const W   = [4/9, 1/9, 1/9, 1/9, 1/9, 1/36, 1/36, 1/36, 1/36];
const OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6];

let NX = 0, NY = 0, Re = 100, tau = 0.6, uInlet = 0.08;
let stepsPerFrame = 20, stepCount = 0;
let f, fNew, rho, ux, uy, obstacle, vorticity;
let obstacles = [];

// --- Message handler ---
self.onmessage = function(e) {
  const m = e.data;
  switch (m.type) {
    case 'init':
      NX = m.NX; NY = m.NY;
      uInlet = m.uInlet; Re = m.Re;
      stepsPerFrame = m.stepsPerFrame || 20;
      obstacles = m.obstacles;
      allocate(); buildMask(); initEq(); stepCount = 0;
      break;
    case 'step':
      doSteps();
      break;
    case 'updateObstacles':
      obstacles = m.obstacles;
      buildMask();
      break;
    case 'updateParams':
      if (m.uInlet !== undefined) uInlet = m.uInlet;
      if (m.Re !== undefined) Re = m.Re;
      if (m.stepsPerFrame !== undefined) stepsPerFrame = m.stepsPerFrame;
      recomputeTau();
      break;
    case 'reset':
      if (!f) break; // not yet initialized
      if (m.obstacles) obstacles = m.obstacles;
      if (m.uInlet !== undefined) uInlet = m.uInlet;
      if (m.Re !== undefined) Re = m.Re;
      buildMask(); initEq(); stepCount = 0;
      break;
  }
};

function recomputeTau() {
  const D = obstacles.length > 0 ? obstacles[0].r * 2 : 40;
  const nu = uInlet * D / Math.max(Re, 1);
  tau = 3 * nu + 0.5;
}

function allocate() {
  const n = NX * NY;
  f = new Float32Array(n * 9);
  fNew = new Float32Array(n * 9);
  rho = new Float32Array(n);
  ux = new Float32Array(n);
  uy = new Float32Array(n);
  obstacle = new Uint8Array(n);
  vorticity = new Float32Array(n);
}

function buildMask() {
  obstacle.fill(0);
  for (const o of obstacles) {
    const r2 = o.r * o.r;
    const yMin = Math.max(1, Math.floor(o.y - o.r));
    const yMax = Math.min(NY - 2, Math.ceil(o.y + o.r));
    const xMin = Math.max(1, Math.floor(o.x - o.r));
    const xMax = Math.min(NX - 2, Math.ceil(o.x + o.r));
    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        if ((x - o.x) * (x - o.x) + (y - o.y) * (y - o.y) <= r2)
          obstacle[y * NX + x] = 1;
      }
    }
  }
  recomputeTau();
}

function initEq() {
  for (let y = 0; y < NY; y++) {
    for (let x = 0; x < NX; x++) {
      const idx = y * NX + x;
      const isObs = obstacle[idx];
      const u = isObs ? 0 : uInlet;
      // Small perturbation to seed vortex instability
      const v = isObs ? 0 : 0.001 * uInlet * Math.sin(2 * Math.PI * y / NY);
      rho[idx] = 1.0; ux[idx] = u; uy[idx] = v;
      const usq = u * u + v * v;
      const fi = idx * 9;
      for (let i = 0; i < 9; i++) {
        const eu = CX[i] * u + CY[i] * v;
        f[fi + i] = W[i] * (1 + 3 * eu + 4.5 * eu * eu - 1.5 * usq);
      }
    }
  }
}

// --- Collision (BGK) + macroscopic ---
function collide() {
  const inv = 1.0 / tau;
  const w0 = 4/9, w1 = 1/9, w5 = 1/36;
  const n = NX * NY;
  for (let idx = 0; idx < n; idx++) {
    if (obstacle[idx]) { ux[idx] = 0; uy[idx] = 0; rho[idx] = 0; continue; }
    const fi = idx * 9;
    const f0=f[fi],f1=f[fi+1],f2=f[fi+2],f3=f[fi+3],f4=f[fi+4];
    const f5=f[fi+5],f6=f[fi+6],f7=f[fi+7],f8=f[fi+8];
    const r = f0+f1+f2+f3+f4+f5+f6+f7+f8;
    const invR = 1.0 / r;
    const u = (f1 - f3 + f5 - f6 - f7 + f8) * invR;
    const v = (f2 - f4 + f5 + f6 - f7 - f8) * invR;
    rho[idx] = r; ux[idx] = u; uy[idx] = v;
    const usqH = 1.5 * (u*u + v*v);
    let eu, feq;
    eu=0;       feq=w0*r*(1-usqH);             f[fi]  -=(f0-feq)*inv;
    eu=u;       feq=w1*r*(1+3*eu+4.5*eu*eu-usqH); f[fi+1]-=(f1-feq)*inv;
    eu=v;       feq=w1*r*(1+3*eu+4.5*eu*eu-usqH); f[fi+2]-=(f2-feq)*inv;
    eu=-u;      feq=w1*r*(1+3*eu+4.5*eu*eu-usqH); f[fi+3]-=(f3-feq)*inv;
    eu=-v;      feq=w1*r*(1+3*eu+4.5*eu*eu-usqH); f[fi+4]-=(f4-feq)*inv;
    eu=u+v;     feq=w5*r*(1+3*eu+4.5*eu*eu-usqH); f[fi+5]-=(f5-feq)*inv;
    eu=-u+v;    feq=w5*r*(1+3*eu+4.5*eu*eu-usqH); f[fi+6]-=(f6-feq)*inv;
    eu=-u-v;    feq=w5*r*(1+3*eu+4.5*eu*eu-usqH); f[fi+7]-=(f7-feq)*inv;
    eu=u-v;     feq=w5*r*(1+3*eu+4.5*eu*eu-usqH); f[fi+8]-=(f8-feq)*inv;
  }
}

// --- Streaming (pull-based, unrolled with bounce-back) ---
function stream() {
  for (let y = 0; y < NY; y++) {
    for (let x = 0; x < NX; x++) {
      const idx = y * NX + x;
      const fi = idx * 9;
      fNew[fi] = f[fi]; // dir 0
      fNew[fi+1] = (x>0     && !obstacle[idx-1])       ? f[(idx-1)*9+1]     : f[fi+3];
      fNew[fi+2] = (y>0     && !obstacle[idx-NX])      ? f[(idx-NX)*9+2]    : f[fi+4];
      fNew[fi+3] = (x<NX-1  && !obstacle[idx+1])       ? f[(idx+1)*9+3]     : f[fi+1];
      fNew[fi+4] = (y<NY-1  && !obstacle[idx+NX])      ? f[(idx+NX)*9+4]    : f[fi+2];
      fNew[fi+5] = (x>0 && y>0     && !obstacle[idx-NX-1]) ? f[(idx-NX-1)*9+5] : f[fi+7];
      fNew[fi+6] = (x<NX-1 && y>0  && !obstacle[idx-NX+1]) ? f[(idx-NX+1)*9+6] : f[fi+8];
      fNew[fi+7] = (x<NX-1 && y<NY-1 && !obstacle[idx+NX+1]) ? f[(idx+NX+1)*9+7] : f[fi+5];
      fNew[fi+8] = (x>0 && y<NY-1  && !obstacle[idx+NX-1]) ? f[(idx+NX-1)*9+8] : f[fi+6];
    }
  }
  const tmp = f; f = fNew; fNew = tmp;
}

// --- Boundary conditions ---
function applyBC() {
  // Inlet (x=0): Zou-He velocity BC
  for (let y = 1; y < NY - 1; y++) {
    const fi = (y * NX) * 9;
    const u = uInlet;
    const r = (f[fi] + f[fi+2] + f[fi+4] + 2*(f[fi+3] + f[fi+6] + f[fi+7])) / (1 - u);
    f[fi+1] = f[fi+3] + (2/3)*r*u;
    f[fi+5] = f[fi+7] + (1/6)*r*u - 0.5*(f[fi+2] - f[fi+4]);
    f[fi+8] = f[fi+6] + (1/6)*r*u + 0.5*(f[fi+2] - f[fi+4]);
    rho[y*NX] = r; ux[y*NX] = u; uy[y*NX] = 0;
  }
  // Outlet (x=NX-1): zero-gradient
  for (let y = 0; y < NY; y++) {
    const dst = (y*NX + NX-1)*9, src = (y*NX + NX-2)*9;
    for (let i = 0; i < 9; i++) f[dst+i] = f[src+i];
  }
}

// --- Vorticity ---
function computeVorticity() {
  for (let y = 1; y < NY-1; y++) {
    for (let x = 1; x < NX-1; x++) {
      const idx = y*NX+x;
      if (obstacle[idx]) { vorticity[idx] = 0; continue; }
      vorticity[idx] = (uy[idx+1]-uy[idx-1])*0.5 - (ux[idx+NX]-ux[idx-NX])*0.5;
    }
  }
  // Zero boundaries
  for (let x = 0; x < NX; x++) { vorticity[x]=0; vorticity[(NY-1)*NX+x]=0; }
  for (let y = 0; y < NY; y++) { vorticity[y*NX]=0; vorticity[y*NX+NX-1]=0; }
}

// --- Run steps and report ---
function doSteps() {
  for (let s = 0; s < stepsPerFrame; s++) {
    collide();
    stream();
    applyBC();
    stepCount++;
  }
  computeVorticity();

  // Probe: downstream of first obstacle
  let px, py;
  if (obstacles.length > 0) {
    px = Math.min(NX-2, Math.floor(obstacles[0].x + obstacles[0].r*4));
    py = Math.floor(obstacles[0].y);
  } else {
    px = Math.floor(NX*0.75); py = Math.floor(NY/2);
  }

  self.postMessage({
    type: 'frame',
    vorticity: vorticity.slice(),
    probeVorticity: vorticity[py*NX+px],
    stepCount: stepCount,
    tau: tau
  });
}
