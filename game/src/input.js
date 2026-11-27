// Gobble Run — input: keyboard, touch buttons and canvas clicks.
// Everything the game loop needs is a small set of edge-triggered intents:
// jump, slide held, pause, mute, and a click point for menu buttons.

export function createInput(canvas) {
  const state = {
    jumpQueued: false,
    slideHeld: false,
    pauseQueued: false,
    muteQueued: false,
    anyQueued: false, // any key/tap: used to start from the title screen
    click: null, // {x, y} in canvas logical coordinates, consumed by the game
    isTouch: false,
  };

  function queueJump() { state.jumpQueued = true; state.anyQueued = true; }
  function queuePause() { state.pauseQueued = true; state.anyQueued = true; }
  function queueMute() { state.muteQueued = true; }

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      queueJump();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      state.slideHeld = true;
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      queuePause();
    } else if (e.code === 'KeyM') {
      queueMute();
    } else if (e.code === 'Enter') {
      state.anyQueued = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') state.slideHeld = false;
  });

  // Touch detection: coarse pointer, or a first touch anywhere.
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    state.isTouch = true;
    document.body.classList.add('touch');
  }
  window.addEventListener('touchstart', () => {
    if (!state.isTouch) {
      state.isTouch = true;
      document.body.classList.add('touch');
    }
  }, { once: true, passive: true });

  // On-screen buttons (DOM, shown only on touch devices by CSS).
  const btnJump = document.getElementById('btnJump');
  const btnSlide = document.getElementById('btnSlide');
  if (btnJump) {
    btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); queueJump(); }, { passive: false });
    btnJump.addEventListener('mousedown', (e) => { e.preventDefault(); queueJump(); });
  }
  if (btnSlide) {
    const on = (e) => { e.preventDefault(); state.slideHeld = true; };
    const off = (e) => { e.preventDefault(); state.slideHeld = false; };
    btnSlide.addEventListener('touchstart', on, { passive: false });
    btnSlide.addEventListener('touchend', off, { passive: false });
    btnSlide.addEventListener('touchcancel', off, { passive: false });
    btnSlide.addEventListener('mousedown', on);
    btnSlide.addEventListener('mouseup', off);
    btnSlide.addEventListener('mouseleave', off);
  }

  // Canvas taps: tap = jump while running; click point for menu buttons.
  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (canvas.width / r.width);
    const cy = (e.clientY - r.top) * (canvas.height / r.height);
    return { x: cx, y: cy };
  }
  canvas.addEventListener('pointerdown', (e) => {
    state.click = canvasPoint(e);
    queueJump();
  });

  return {
    state,
    consumeJump() { const j = state.jumpQueued; state.jumpQueued = false; return j; },
    consumePause() { const p = state.pauseQueued; state.pauseQueued = false; return p; },
    consumeMute() { const m = state.muteQueued; state.muteQueued = false; return m; },
    consumeAny() { const a = state.anyQueued; state.anyQueued = false; return a; },
    consumeClick() { const c = state.click; state.click = null; return c; },
    isSliding() { return state.slideHeld; },
  };
}
