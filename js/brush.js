/* HAMRA — "run your hand across the pile": strokes against the grain lighten the rug, strokes with it deepen it; the pile slowly recovers. 2D canvas only. */
export function enableBrush(wrap, base) {
  const ov = document.createElement('canvas'); ov.className = 'ov'; wrap.append(ov); const ctx = ov.getContext('2d'); let down = false, lx = 0, ly = 0, raf = 0, active = false, alive = 0;
  const fit = () => { const r = base.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); ov.width = Math.max(2, Math.round(r.width * d)); ov.height = Math.max(2, Math.round(r.height * d)); ov.style.width = r.width + 'px'; ov.style.height = r.height + 'px'; };
  fit(); if ('ResizeObserver' in window) new ResizeObserver(fit).observe(base);
  const pos = (e) => { const r = ov.getBoundingClientRect(); return [(e.clientX - r.left) * ov.width / r.width, (e.clientY - r.top) * ov.height / r.height]; };
  function stroke(x, y) {
    const dy = y - ly, dx = x - lx; if (Math.hypot(dx, dy) < 2) return; const up = dy < 0, w = ov.width * 0.075;
    ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'round'; ctx.lineWidth = w; ctx.strokeStyle = up ? 'rgba(255,236,196,.55)' : 'rgba(10,4,2,.55)'; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke(); lx = x; ly = y; alive = 240; if (!raf) raf = requestAnimationFrame(fade);
  }
  function fade() { raf = 0; ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,.035)'; ctx.fillRect(0, 0, ov.width, ov.height); if (--alive > 0 || down) raf = requestAnimationFrame(fade); else ctx.clearRect(0, 0, ov.width, ov.height); }
  const md = (e) => { if (!active) return; down = true; [lx, ly] = pos(e); try { wrap.setPointerCapture(e.pointerId); } catch (x) { } e.preventDefault(); };
  const mm = (e) => { if (!down) return; const [x, y] = pos(e); stroke(x, y); e.preventDefault(); };
  const mu = () => { down = false; };
  wrap.addEventListener('pointerdown', md); wrap.addEventListener('pointermove', mm); wrap.addEventListener('pointerup', mu); wrap.addEventListener('pointercancel', mu); wrap.addEventListener('pointerleave', mu);
  return { set(on) { active = on; wrap.classList.toggle('on', on); if (!on) ctx.clearRect(0, 0, ov.width, ov.height); }, get on() { return active; }, fit, destroy() { ov.remove(); } };
}
