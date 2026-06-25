/* =====================================================================
   Shared mobile chrome wiring (bottom sheet, graph overlay, play FAB).
   Pure DOM glue — no simulation internals. Each sim page includes this
   after its own script, and exposes controls via standard IDs:
     #btn-pause, #btn-restart  (the real engine buttons, kept in sheet)
     #m-controls, #m-play, #m-restart, #m-graph  (mobile chrome)
     .sim-page, .controls (sheet), .phase-panel (graph), .touch-hint
   ===================================================================== */
(function () {
  'use strict';

  var ICON_PLAY  = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

  var page    = document.querySelector('.sim-page');
  if (!page) return;

  var btnPause   = document.getElementById('btn-pause');
  var btnRestart = document.getElementById('btn-restart');
  var mControls  = document.getElementById('m-controls');
  var mPlay      = document.getElementById('m-play');
  var mRestart   = document.getElementById('m-restart');
  var mGraph     = document.getElementById('m-graph');
  var hint       = document.querySelector('.touch-hint');

  // ---- Play / pause FAB mirrors the engine's pause button ----
  function syncPlay() {
    if (!mPlay || !btnPause) return;
    // Engine button text is "Pause" while running, "Resume" while paused.
    var running = (btnPause.textContent || '').trim().toLowerCase() === 'pause';
    mPlay.innerHTML = running ? ICON_PAUSE : ICON_PLAY;
    mPlay.setAttribute('aria-label', running ? 'Pause' : 'Play');
  }
  if (mPlay && btnPause) {
    mPlay.addEventListener('click', function () {
      btnPause.click();
      syncPlay();
    });
    // Catch changes triggered elsewhere (presets, restart, keyboard).
    var mo = new MutationObserver(syncPlay);
    mo.observe(btnPause, { childList: true, characterData: true, subtree: true });
    syncPlay();
  }

  if (mRestart && btnRestart) {
    mRestart.addEventListener('click', function () {
      btnRestart.click();
      syncPlay();
    });
  }

  // ---- Bottom sheet ----
  function setSheet(open) {
    page.classList.toggle('sheet-open', open);
    if (mControls) mControls.classList.toggle('active', open);
    if (open) setGraph(false);
  }
  if (mControls) {
    mControls.addEventListener('click', function () {
      setSheet(!page.classList.contains('sheet-open'));
    });
  }

  // ---- Graph overlay ----
  function setGraph(open) {
    page.classList.toggle('graph-open', open);
    if (mGraph) mGraph.classList.toggle('active', open);
    if (open) setSheet(false);
    // Let the sim recompute its phase canvas now that it's visible.
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);
  }
  if (mGraph) {
    mGraph.addEventListener('click', function () {
      setGraph(!page.classList.contains('graph-open'));
    });
  }

  // ---- Auto-dismiss the touch hint ----
  if (hint) {
    var dismiss = function () {
      hint.classList.add('hidden');
      window.removeEventListener('pointerdown', dismiss, true);
    };
    window.addEventListener('pointerdown', dismiss, true);
    setTimeout(dismiss, 5200);
  }
})();
