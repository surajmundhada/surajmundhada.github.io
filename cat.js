// Optional cursor companion. It never intercepts clicks or moves on its own.
(() => {
  const button = document.getElementById('cat-toggle');
  const cat = document.getElementById('cursor-cat');
  const desktop = matchMedia('(min-width: 701px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = false, frame = null, last = 0, sleepTimer = null;
  let x = 0, y = 0, targetX = 0, targetY = 0, facing = 1;
  const allowed = () => desktop.matches && !reduced.matches;
  const clamp = (value, max) => Math.max(8, Math.min(value, Math.max(8, max)));
  function cancel() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    last = 0;
    clearTimeout(sleepTimer);
  }
  function draw() {
    cat.style.transform = `translate3d(${x}px,${y}px,0)`;
    cat.style.setProperty('--cat-facing', facing);
  }
  function settle() {
    cat.dataset.state = 'sit';
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(() => {
      if (enabled && !cat.hidden) cat.dataset.state = 'sleep';
    }, 5000);
  }
  function tick(now) {
    frame = null;
    if (!enabled || document.hidden || !allowed()) return;
    const dt = last ? Math.min((now - last) / 1000, .04) : .016;
    last = now;
    const dx = targetX - x, dy = targetY - y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 2) {
      x = targetX; y = targetY;
      draw(); settle(); last = 0;
      return;
    }
    if (Math.abs(dx) > 2) facing = dx < 0 ? -1 : 1;
    const step = Math.min(distance, 135 * dt);
    x += dx / distance * step;
    y += dy / distance * step;
    cat.dataset.state = 'run';
    draw();
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (frame === null && enabled && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function updateControl() {
    if (!allowed()) { enabled = false; cancel(); cat.hidden = true; }
    button.disabled = !allowed();
    button.textContent = enabled ? 'Hide cat' : 'Play with cat';
    button.setAttribute('aria-pressed', String(enabled));
    button.title = !allowed() ? 'Available with a mouse and motion enabled' : 'A little cat that follows your cursor';
  }
  button.addEventListener('click', event => {
    if (!allowed()) return;
    enabled = !enabled;
    cancel();
    cat.hidden = !enabled;
    if (enabled) {
      // Start beside the control; following begins with the next mouse move.
      x = targetX = clamp(event.clientX + 24, innerWidth - 46);
      y = targetY = clamp(event.clientY - 52, innerHeight - 46);
      draw(); settle();
    }
    updateControl();
  });
  window.addEventListener('pointermove', event => {
    if (!enabled || event.pointerType !== 'mouse' || !allowed()) return;
    clearTimeout(sleepTimer);
    cat.hidden = false;
    // Leave room around the pointer, including at the viewport edges.
    targetX = clamp(event.clientX + (event.clientX > innerWidth - 90 ? -60 : 24), innerWidth - 46);
    targetY = clamp(event.clientY + (event.clientY > innerHeight - 90 ? -60 : 24), innerHeight - 46);
    start();
  }, { passive: true });
  function hide() { cancel(); cat.hidden = true; }
  document.documentElement.addEventListener('pointerleave', hide);
  window.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('resize', () => { hide(); updateControl(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  desktop.addEventListener('change', updateControl);
  reduced.addEventListener('change', updateControl);
  updateControl();
})();
