/* HAMRA — the loom in 2D: any rug of the collection woven row by row on a canvas (warp threads, shuttle with a coloured weft, comb beating the row down).
   Also used as the hero when WebGL is not available. */
import { paintRug, buildGrid, palRGB } from './rugkit.js';

export function createLoom(host, spec, o = {}) {
  const cv = document.createElement('canvas'); host.append(cv); const ctx = cv.getContext('2d');
  let rug, cw = 0, ch = 0, dpr = 1, p = 0, playing = false, raf = 0, last = 0, speed = o.speed || 1, phase = 0, dur = o.duration || 14, done = false, rgb = [], G;
  const api = { cv, get p() { return p; }, get playing() { return playing; } };
  function build() { G = buildGrid(spec); rgb = palRGB(spec.pal, spec.wear, spec.cols); rug = document.createElement('canvas'); paintRug(rug, spec, Math.max(3, Math.round((cv.width || 600) / spec.W)), { noFringe: true }); cw = rug.width; ch = rug.height; cv.width = cw; cv.height = ch; cv.style.aspectRatio = cw + '/' + ch; }
  function draw() {
    const ys = Math.round(ch * (1 - p)), W = spec.W, cell = cw / W;
    ctx.fillStyle = '#100b08'; ctx.fillRect(0, 0, cw, ch);
    const g = ctx.createLinearGradient(0, 0, cw, 0); g.addColorStop(0, 'rgba(255,255,255,.0)'); g.addColorStop(0.5, 'rgba(255,240,210,.05)'); g.addColorStop(1, 'rgba(255,255,255,.0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    // warp threads
    ctx.lineWidth = Math.max(1, cell * 0.28);
    for (let x = 0; x < W; x++) { const X = (x + 0.5) * cell; ctx.strokeStyle = `rgba(232,220,196,${(0.42 + ((x * 7) % 5) * 0.05).toFixed(2)})`; ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X, ys + 2); ctx.stroke(); }
    // woven part
    if (ys < ch) ctx.drawImage(rug, 0, ys, cw, ch - ys, 0, ys, cw, ch - ys);
    if (p > 0 && p < 1) {
      const hot = ctx.createLinearGradient(0, ys - 4, 0, ys + cell * 3); hot.addColorStop(0, 'rgba(255,226,160,.0)'); hot.addColorStop(0.25, 'rgba(255,226,160,.5)'); hot.addColorStop(1, 'rgba(255,226,160,0)'); ctx.fillStyle = hot; ctx.fillRect(0, ys - 4, cw, cell * 3 + 4);
      // comb: brass bar with teeth, strikes down each shuttle pass
      const strike = Math.max(0, Math.sin(phase * 1)) ** 3, cy = ys - cell * 2.4 + strike * cell * 1.8;
      ctx.fillStyle = '#6f5326'; ctx.fillRect(0, cy - cell * 1.1, cw, cell * 1.3); ctx.fillStyle = '#c9a050'; ctx.fillRect(0, cy - cell * 1.1, cw, Math.max(2, cell * 0.28));
      ctx.strokeStyle = 'rgba(30,20,10,.55)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x <= W; x += 1) { const X = x * cell; ctx.moveTo(X, cy + cell * 0.2); ctx.lineTo(X, cy + cell * 1.5); } ctx.stroke();
      // shuttle with the colour of the knot it is placing
      const sx = cw * (0.5 + 0.46 * Math.sin(phase * 0.5)), row = Math.min(spec.H - 1, Math.max(0, Math.floor((ys - cell) / cell))), col = Math.min(W - 1, Math.max(0, Math.floor(sx / cell))), idx = G.g[row * W + col], c = rgb[idx] || [220, 200, 160], sy = cy - cell * 1.6, L = Math.max(46, cw * 0.1), Hh = Math.max(14, cw * 0.028);
      ctx.save(); ctx.translate(sx, sy); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(2, Hh * 0.9, L * 0.5, Hh * 0.35, 0, 0, 7); ctx.fill();
      const sg = ctx.createLinearGradient(0, -Hh / 2, 0, Hh / 2); sg.addColorStop(0, '#d9b277'); sg.addColorStop(0.5, '#a9783f'); sg.addColorStop(1, '#5e3b1d'); ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(-L * 0.28, -Hh / 2, 0, -Hh / 2); ctx.quadraticCurveTo(L * 0.28, -Hh / 2, L / 2, 0); ctx.quadraticCurveTo(L * 0.28, Hh / 2, 0, Hh / 2); ctx.quadraticCurveTo(-L * 0.28, Hh / 2, -L / 2, 0); ctx.fill();
      ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.fillRect(-L * 0.18, -Hh * 0.28, L * 0.36, Hh * 0.56); ctx.restore();
      ctx.strokeStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.lineWidth = Math.max(1.5, cell * 0.4); ctx.beginPath(); ctx.moveTo(sx, sy + Hh * 0.3); ctx.quadraticCurveTo(sx - 20, ys, sx > cw / 2 ? 0 : cw, ys + cell * 0.5); ctx.stroke();
    }
    if (o.onProgress) o.onProgress(p);
  }
  function tick(now) { raf = 0; if (!playing) return; const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; p = Math.min(1, p + dt * speed / dur); phase += dt * speed * 5.2; draw(); if (p >= 1) { playing = false; done = true; draw(); o.onDone && o.onDone(); return; } raf = requestAnimationFrame(tick); }
  api.play = () => { if (done || p >= 1) { p = 0; done = false; } if (playing) return; playing = true; last = performance.now(); if (!raf) raf = requestAnimationFrame(tick); };
  api.pause = () => { playing = false; cancelAnimationFrame(raf); raf = 0; };
  api.restart = () => { p = 0; done = false; api.play(); };
  api.seek = (v) => { p = Math.max(0, Math.min(1, v)); draw(); };
  api.speed = (v) => { speed = v; };
  api.setSpec = (s, keep) => { spec = s; build(); if (!keep) p = 0; done = false; draw(); };
  api.destroy = () => { api.pause(); cv.remove(); };
  cv.width = o.width || Math.min(720, host.clientWidth || 600); build(); draw();
  if ('ResizeObserver' in window) new ResizeObserver(() => { const w = Math.min(900, Math.round(host.clientWidth * Math.min(devicePixelRatio || 1, 1.5))); if (Math.abs(w - cw) > cw * 0.25 && w > 100) { cv.width = w; build(); draw(); } }).observe(host);
  if (o.autoplay) api.play();
  return api;
}
