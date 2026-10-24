/* HAMRA — living canvases shared by the atelier and the about page. Each scene mounts into a host element and runs only while it is on screen. */
import { catalog, paintRug, buildGrid, palRGB, rngOf } from './rugkit.js';
import { createLoom } from './weave.js';
const cat = catalog(), pick = (f, s = 'rect') => cat.find((c) => c.fam === f && c.shape === s) || cat[0];
const mk = (host) => { const cv = document.createElement('canvas'), W = 880, H = 660; cv.width = W; cv.height = H; host.append(cv); return { host, cv, ctx: cv.getContext('2d'), W, H }; };
function loopOn(host, fn) { let raf = 0, on = false; const f = (t) => { raf = requestAnimationFrame(f); fn(t / 1000); }; new IntersectionObserver(([e]) => { if (e.isIntersecting && !on) { on = true; raf = requestAnimationFrame(f); } else if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(raf); } }, { rootMargin: '80px' }).observe(host); }

/* wool: drifting fibres in raking light */
export function wool(host) {
  const { ctx, W, H } = mk(host), r = rngOf(4), fib = Array.from({ length: 170 }, () => ({ x: r() * W, y: r() * H, a: r() * 6.28, l: 90 + r() * 200, c: r(), w: 1 + r() * 2.6, s: 0.2 + r() }));
  loopOn(host, (t) => {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2a1d14'); g.addColorStop(1, '#0f0a07'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.lineCap = 'round';
    for (const f of fib) { const sw = Math.sin(t * f.s + f.a) * 26, x2 = f.x + Math.cos(f.a) * f.l, y2 = f.y + Math.sin(f.a) * f.l * 0.4; ctx.strokeStyle = f.c < 0.5 ? 'rgba(236,224,196,.5)' : 'rgba(205,176,130,.45)'; ctx.lineWidth = f.w; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.bezierCurveTo(f.x + sw, f.y - 50, x2 - sw, y2 + 50, x2, y2); ctx.stroke(); }
    const lg = ctx.createRadialGradient(W * 0.3, H * 0.25, 10, W * 0.3, H * 0.25, W * 0.7); lg.addColorStop(0, 'rgba(255,214,150,.22)'); lg.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
  });
}

/* dye: pigments blooming into water */
export function dye(host) {
  const { ctx, W, H } = mk(host), cols = ['#8a1b20', '#d9a645', '#1b2a52', '#2f6f58', '#a4482c', '#512a5a'], r = rngOf(8), bl = cols.map((c, i) => ({ c, x: (i + 0.5) * W / cols.length, y: H * (0.3 + r() * 0.4), ph: r() * 6, sp: 0.2 + r() * 0.3 }));
  loopOn(host, (t) => {
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#17110c'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'screen';
    for (const b of bl) for (let k = 0; k < 4; k++) { const rr = 90 + 80 * Math.sin(t * b.sp + b.ph + k) + k * 46, x = b.x + Math.sin(t * 0.3 + k + b.ph) * 90, y = b.y + Math.cos(t * 0.27 + k * 1.3) * 100, g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, b.c + 'cc'); g.addColorStop(1, b.c + '00'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(W * (0.1 + i * 0.07), H * 0.5 + Math.sin(t + i) * 18, 12 + (i % 4) * 8, 0, 7); ctx.stroke(); }
  });
}

/* design: the knot grid the weaver reads */
export function grid(host) {
  const { cv, ctx, W, H } = mk(host), it = pick('medallion'), g = buildGrid(it.spec), off = document.createElement('canvas'); paintRug(off, it.spec, 8, { noFringe: true }); let mx = -1, my = -1;
  cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; }); cv.addEventListener('pointerleave', () => { mx = -1; });
  const pal = palRGB(it.spec.pal, it.spec.wear), rw = off.width * H / off.height, ox = (W - rw) / 2;
  loopOn(host, (t) => {
    ctx.fillStyle = '#1b140f'; ctx.fillRect(0, 0, W, H); ctx.drawImage(off, ox, 0, rw, H); const cw = rw / g.W, ch = H / g.H; ctx.strokeStyle = 'rgba(255,248,230,.16)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x <= g.W; x++) { ctx.moveTo(ox + x * cw, 0); ctx.lineTo(ox + x * cw, H); } for (let y = 0; y <= g.H; y++) { ctx.moveTo(ox, y * ch); ctx.lineTo(ox + rw, y * ch); } ctx.stroke();
    let cx, cy; if (mx >= 0) { cx = Math.floor(((mx * W) - ox) / cw); cy = Math.floor(my * H / ch); } else { cx = Math.floor(g.W / 2 + Math.sin(t * 0.7) * g.W * 0.3); cy = Math.floor(g.H / 2 + Math.cos(t * 0.5) * g.H * 0.3); }
    if (cx >= 0 && cy >= 0 && cx < g.W && cy < g.H) { const c = pal[g.g[cy * g.W + cx]]; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.strokeRect(ox + cx * cw - 1, cy * ch - 1, cw + 2, ch + 2); ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.fillRect(W - 92, 22, 62, 62); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(W - 92, 22, 62, 62); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '500 13px Jost, sans-serif'; ctx.fillText(`${cx + 1} · ${cy + 1}`, W - 92, 106); }
  });
}

/* knot: the loom itself */
export function knot(host, family = 'garden') {
  host.style.cssText += ';background:#100b08;display:grid;place-items:center'; const it = pick(family), lh = document.createElement('div'); lh.style.cssText = 'height:100%;aspect-ratio:' + it.spec.W + '/' + it.spec.H; host.append(lh);
  const loom = createLoom(lh, it.spec, { duration: 12, width: 520, onDone: () => setTimeout(() => loom.restart(), 2200) }); loom.cv.style.cssText = 'width:100%;height:100%';
  new IntersectionObserver(([e]) => (e.isIntersecting ? loom.play() : loom.pause())).observe(host);
}

/* wash: sun on the freshly washed pile */
export function wash(host) {
  const { ctx, W, H } = mk(host), it = pick('oushak'), off = document.createElement('canvas'); paintRug(off, it.spec, 8, { noFringe: true }); const rw = off.width * H / off.height * 0.92, rh = H * 0.92;
  loopOn(host, (t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d8c7a4'); g.addColorStop(1, '#a89874'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.shadowColor = 'rgba(40,24,10,.4)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 18; ctx.drawImage(off, (W - rw) / 2, (H - rh) / 2, rw, rh); ctx.restore();
    const k = (t * 0.18) % 1.6 - 0.3, x = (W - rw) / 2 + k * rw; ctx.save(); ctx.beginPath(); ctx.rect((W - rw) / 2, (H - rh) / 2, rw, rh); ctx.clip(); ctx.globalCompositeOperation = 'soft-light'; const sg = ctx.createLinearGradient(x - 120, 0, x + 120, rh * 0.6); sg.addColorStop(0, 'rgba(255,240,200,0)'); sg.addColorStop(0.5, 'rgba(255,248,225,.95)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 18; i++) { const px = (i * 97 + t * 14) % W, py = (i * 61 + t * 40) % H; ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t + i); ctx.beginPath(); ctx.arc(px, py, 1.5 + (i % 3), 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
  });
}

/* finish: the shears glide over the pile and the fringe is knotted */
export function finish(host) {
  const { ctx, W, H } = mk(host), it = pick('allover'), off = document.createElement('canvas'); paintRug(off, it.spec, 8, { noFringe: true }); const rw = off.width * H / off.height * 0.84, rh = H * 0.84, x0 = (W - rw) / 2, y0 = (H - rh) / 2 - 8;
  loopOn(host, (t) => {
    ctx.fillStyle = '#d9cbb0'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.shadowColor = 'rgba(40,24,10,.4)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 14; ctx.drawImage(off, x0, y0, rw, rh); ctx.restore(); const k = (t * 0.2) % 1.2, y = y0 + Math.min(1, k / 1.0) * rh;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, rw, Math.min(rh, y - y0)); ctx.clip(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,250,235,.55)'; ctx.fillRect(x0, y0, rw, rh); ctx.restore();
    if (k < 1.0) { ctx.fillStyle = '#b9bdc2'; ctx.fillRect(x0 - 16, y - 7, rw + 32, 14); ctx.fillStyle = '#6a6e74'; ctx.fillRect(x0 - 16, y + 5, rw + 32, 4); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x0, y + 9, rw, 8); }
    ctx.lineCap = 'round'; for (let e = 0; e < 2; e++) for (let i = 0; i < 44; i++) { const x = x0 + (i + 0.5) * rw / 44, ybase = e ? y0 + rh : y0, dir = e ? 1 : -1, ln = 34 + (i * 7 % 9), sw = Math.sin(t * 1.2 + i * 0.6) * 3; ctx.strokeStyle = 'rgba(244,236,216,.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, ybase); ctx.quadraticCurveTo(x + sw, ybase + dir * ln * 0.5, x + sw * 1.5 + (i % 2 ? 2 : -2), ybase + dir * ln); ctx.stroke(); }
  });
}
