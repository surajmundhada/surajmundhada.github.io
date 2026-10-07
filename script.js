const toggle=document.getElementById('theme-toggle');
function updateThemeLabel(){const dark=document.documentElement.dataset.theme==='dark';toggle.setAttribute('aria-label',`Switch to ${dark?'light':'dark'} mode`);toggle.title=toggle.getAttribute('aria-label');}
toggle.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('suraj-theme',next)}catch{}updateThemeLabel()});
updateThemeLabel();
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',event=>{try{if(localStorage.getItem('suraj-theme'))return}catch{}document.documentElement.dataset.theme=event.matches?'dark':'light';updateThemeLabel()});
document.getElementById('year').textContent=new Date().getFullYear();
document.getElementById('copy-email').addEventListener('click',async()=>{const status=document.getElementById('copy-status');try{await navigator.clipboard.writeText('surajmundhada24@gmail.com');status.textContent='Copied!'}catch{status.textContent='Select the email to copy it.'}setTimeout(()=>status.textContent='',3000)});

// A small companion that patrols the viewport and returns to the quote rail.
(() => {
  const pet = document.getElementById('companion');
  const control = document.getElementById('character-toggle');
  const quote = document.querySelector('.quote-section');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  let paused = false;
  try { paused = localStorage.getItem('suraj-character-paused') === 'true'; } catch {}
  let x = 18, y = Math.max(10, innerHeight - 94), targetX = x;
  let direction = 1, lastTime = 0, nextMove = 0, waveUntil = 0, hopUntil = 0;
  let hovering = false, focused = false, frameId = null, previousMode = '';
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  function updateControl() {
    control.textContent = paused ? 'Resume character' : 'Pause character';
    control.setAttribute('aria-pressed', String(paused));
    pet.title = paused ? 'Click for a little hop · animation paused' : 'Click for a little hop';
  }
  control.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('suraj-character-paused', String(paused)); } catch {}
    nextMove = 0;
    updateControl();
    start();
  });
  pet.addEventListener('pointerenter', () => { hovering = true; });
  pet.addEventListener('pointerleave', () => { hovering = false; waveUntil = performance.now() + 600; });
  pet.addEventListener('focus', () => { focused = true; });
  pet.addEventListener('blur', () => { focused = false; });
  pet.addEventListener('click', () => {
    if (reduced.matches) return;
    hopUntil = performance.now() + 700;
    waveUntil = hopUntil + 500;
    start();
  });
  window.addEventListener('pointermove', event => {
    if (!finePointer.matches || paused || reduced.matches || hovering) return;
    // React only when the pointer is near the character's walking lane.
    if (Math.abs(event.clientY - (y + 45)) < 75 && Math.abs(event.clientX - x) < 180 && !event.target.closest('a,button,summary')) {
      targetX = event.clientX - 25;
      nextMove = performance.now() + 1600;
    }
  }, { passive: true });
  function tick(now) {
    frameId = null;
    const dt = Math.min((now - (lastTime || now)) / 1000, .04);
    lastTime = now;
    const rect = quote.getBoundingClientRect();
    const docked = rect.top >= 88 && rect.top < innerHeight - 70;
    const mode = docked ? 'quote' : 'roam';
    const minX = docked ? rect.left + 15 : 12;
    const maxX = Math.max(minX, docked ? rect.right - 65 : innerWidth - 64);
    const floorY = docked ? rect.top - 74 : Math.max(8, innerHeight - 94);
    if (mode !== previousMode) {
      targetX = minX;
      nextMove = now + 700;
      previousMode = mode;
    }
    const staticMode = paused || reduced.matches;
    if (staticMode) {
      x = minX; y = floorY;
    } else {
      if (now > nextMove && !hovering && !focused) {
        targetX = x < (minX + maxX) / 2 ? maxX : minX;
        nextMove = now + Math.abs(targetX - x) / 54 * 1000 + 2400;
      }
      targetX = clamp(targetX, minX, maxX);
      const dx = targetX - x, dy = floorY - y;
      const resting = hovering || focused || now < waveUntil || now < hopUntil;
      if (!resting) {
        x += Math.sign(dx) * Math.min(Math.abs(dx), 54 * dt);
        if (Math.abs(dx) > 1) direction = dx > 0 ? 1 : -1;
      }
      y += Math.sign(dy) * Math.min(Math.abs(dy), 250 * dt);
      x = clamp(x, 8, Math.max(8, innerWidth - 58));
      y = clamp(y, 8, Math.max(8, innerHeight - 84));
    }
    const walking = !staticMode && Math.abs(targetX - x) > 2 && !hovering && !focused && now >= waveUntil && now >= hopUntil;
    const hopping = now < hopUntil && !reduced.matches;
    const hop = hopping ? Math.sin((1 - (hopUntil - now) / 700) * Math.PI) * 30 : 0;
    pet.dataset.state = hopping ? 'hop' : walking ? 'walk' : 'idle';
    pet.dataset.paused = String(staticMode);
    pet.dataset.location = mode;
    pet.style.transform = `translate3d(${x}px,${y - hop}px,0)`;
    pet.style.setProperty('--facing', direction);
    pet.style.setProperty('--walk-frame', `${Math.floor(now / 140) % 4 * 100 / 3}%`);
    if (!document.hidden && (!staticMode || hopping)) frameId = requestAnimationFrame(tick);
  }
  function start() {
    if (frameId === null && !document.hidden) { lastTime = 0; frameId = requestAnimationFrame(tick); }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frameId !== null) { cancelAnimationFrame(frameId); frameId = null; }
    else start();
  });
  reduced.addEventListener('change', start);
  window.addEventListener('scroll', start, { passive: true });
  window.addEventListener('resize', start, { passive: true });
  updateControl();
  start();
})();
