/* HAMRA — one rug: big rug, watch it woven, brush the pile, details, room view, similar rugs */
import { $, $$, esc, t, tl, href, mountChrome, sel, HEART, waUrl, waText, lang, toast } from './shared.js';
import { catalog, paintRug, PALETTES } from './rugkit.js';
import { createLoom } from './weave.js';
import { enableBrush } from './brush.js';
mountChrome('collection');
const cat = catalog(), id = Math.min(cat.length, Math.max(1, +new URLSearchParams(location.search).get('id') || 1)), it = cat[id - 1];
const bw = $('#bw'), rc = $('#rc'); let loom = null, brush = null, mode = 'rug';
function fill() {
  const pal = PALETTES[it.pal], dens = it.density ? t('r.dens.v', { n: it.density.toLocaleString(lang === 'ar' ? 'en' : lang) }) : '—';
  document.title = `${it.name} · HAMRA`; $('#back').href = href('collection.html');
  $('#info').innerHTML = `<span class="k">${esc(tl('col.' + it.col))}</span><h1>${esc(it.name)}</h1><div class="code">${esc(it.code)}</div>
    <p class="lede">${esc(t('r.lede', { style: tl('fam.' + it.fam), coll: tl('col.' + it.col), tech: tl('tech.' + it.tech), mat: tl('mat.' + it.mat), pile: tl('pile.' + it.pile) }))}</p>
    <div class="pal">${pal.c.map((c) => `<i style="background:${c}"></i>`).join('')}</div><div style="color:var(--mute);font-size:14.5px">${esc(t('r.palette'))} · ${esc(pal.n[lang] || pal.n.en)}</div>
    <div class="spec"><div><b>${esc(t('r.style'))}</b><span>${esc(tl('fam.' + it.fam))}</span></div><div><b>${esc(t('r.mat'))}</b><span>${esc(tl('mat.' + it.mat))}</span></div><div><b>${esc(t('r.tech'))}</b><span>${esc(tl('tech.' + it.tech))}</span></div><div><b>${esc(t('r.pile'))}</b><span>${esc(tl('pile.' + it.pile))}</span></div><div><b>${esc(t('r.dens'))}</b><span>${esc(dens)}</span></div><div><b>${esc(t('r.rooms'))}</b><span>${esc(it.rooms.map((r) => tl('room.' + r)).join(' · '))}</span></div><div><b>${esc(t('r.sizes'))}</b><span class="sizes">${it.sizes.map((s) => `<span class="chip ltr">${esc(s)}</span>`).join('')}</span></div></div>
    <p style="color:var(--ink2)">${esc(t('r.made'))}</p>
    <div class="acts" id="acts"></div>`;
  const w = waUrl(waText()); $('#acts').innerHTML = `<button type="button" class="btn" id="bAdd"></button>${w ? '' : ''}<a class="btn line" id="bAsk" href="${href('contact.html?id=' + it.id)}">${esc(t('r.ask'))}</a>`;
  syncHeart(); $('#bAdd').addEventListener('click', () => { sel.toggle(it.id); syncHeart(); });
  $('#bWeave').textContent = t(mode === 'weave' ? 'r.rug' : 'r.weave'); $('#bBrush').textContent = t('r.brush');
}
function syncHeart() { const on = sel.has(it.id); $('#bAdd') && ($('#bAdd').textContent = on ? t('r.remove') : t('r.add')); $('#bHeart').innerHTML = HEART.replace('<svg', `<svg style="width:18px;fill:${on ? 'var(--madder)' : 'none'};stroke:${on ? 'var(--madder)' : 'currentColor'};stroke-width:1.8"`); }
function paint() { paintRug(rc, it.spec, Math.max(5, Math.min(10, 900 / it.spec.W))); brush && brush.fit(); }
paint(); fill(); brush = enableBrush(bw, rc);
$('#bHeart').addEventListener('click', () => { sel.toggle(it.id); syncHeart(); });
$('#bBrush').addEventListener('click', () => { if (mode === 'weave') toRug(); const on = !brush.on; brush.set(on); $('#bBrush').classList.toggle('on', on); $('#tip').hidden = !on; if (on) setTimeout(() => { $('#tip').style.opacity = 0; }, 3500); else $('#tip').style.opacity = 1; });
function toWeave() { brush.set(false); $('#bBrush').classList.remove('on'); $('#tip').hidden = true; mode = 'weave'; rc.style.visibility = 'hidden'; if (!loom) { const host = document.createElement('div'); host.style.cssText = 'position:absolute;inset:0;background:#100b08'; bw.append(host); loom = createLoom(host, it.spec, { duration: 15, width: 760, onDone: () => { } }); loom.host = host; host.firstChild.style.cssText = 'width:100%;height:100%;object-fit:contain'; } loom.host.style.display = ''; loom.restart(); $('#bWeave').textContent = t('r.rug'); }
function toRug() { mode = 'rug'; if (loom) { loom.pause(); loom.host.style.display = 'none'; } rc.style.visibility = ''; $('#bWeave').textContent = t('r.weave'); }
$('#bWeave').addEventListener('click', () => (mode === 'rug' ? toWeave() : toRug()));
addEventListener('langchange', fill);

/* similar rugs */
const sim = cat.filter((x) => x.id !== it.id && (x.fam === it.fam || x.color === it.color)).sort((a, b) => (b.fam === it.fam && b.color === it.color) - (a.fam === it.fam && a.color === it.color) || Math.abs(a.id - it.id) - Math.abs(b.id - it.id)).slice(0, 4);
$('#sim').innerHTML = sim.map((x) => `<a class="rc" href="${href('rug.html?id=' + x.id)}"><div class="face"><canvas data-id="${x.id}"></canvas></div><div class="meta"><h3>${esc(x.name)}</h3><span>${esc(x.code)}</span></div></a>`).join('');
$$('#sim canvas').forEach((c) => { const x = cat[+c.dataset.id - 1]; paintRug(c, x.spec, Math.max(3.4, Math.min(7, 340 / x.spec.W))); });

/* room view: images rendered offline (empty floor + a map of the light that falls on it); the rug is baked with that light and laid on the floor plane with a CSS homography */
(async () => {
  let rooms; try { rooms = await (await fetch('assets/rooms/rooms.json')).json(); } catch (e) { return; } if (!rooms || !rooms.list) return;
  const sec = $('#room'), tabs = $('#roomtabs'), v = $('#roomv'); sec.hidden = false;
  const base = document.createElement('canvas'); paintRug(base, it.spec, Math.max(4, Math.min(9, 700 / it.spec.W)));
  const holder = document.createElement('div'); holder.className = 'rugq'; const rcv = document.createElement('canvas'); holder.append(rcv);
  const cap = document.createElement('p'); cap.className = 'roomcap'; v.after(cap);
  const imgs = {}, fxs = {}; let cur = 0, tod = 'day', tok = 0, place = null;
  const loadImg = (src) => (imgs[src] ||= new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
  const loadFx = (src) => (fxs[src] ||= loadImg(src).then((im) => { if (!im) return null; const c = document.createElement('canvas'); c.width = rooms.fx.w; c.height = rooms.fx.h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, c.width, c.height); return x.getImageData(0, 0, c.width, c.height); }));
  const parse = (s) => (s.includes('x') ? s.split('x').map(Number) : [+s, +s]);
  function fit(r) { // physical size (cm) of the rug in this room: the largest listed size that fits the free floor, else the smallest, scaled to fit
    const asp = base.height / base.width, free = r.rug; let best = null;
    for (const s of it.sizes) { const w = parse(s)[0], d = w * asp; if (w <= free.w && d <= free.d && (!best || w > best.w)) best = { w, d }; }
    if (!best) { const w0 = Math.min(...it.sizes.map((s) => parse(s)[0])), k = Math.min(1, free.w / w0, free.d / (w0 * asp)); best = { w: w0 * k, d: w0 * asp * k }; } return best;
  }
  function bake(r, fx, g) {
    const c = rcv, W = base.width, Hh = base.height; c.width = W; c.height = Hh; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(base, 0, 0);
    if (!fx) return; const id = x.getImageData(0, 0, W, Hh), d = id.data, M = r.M, k = rooms.fx.scale, sx = fx.width / r.w, sy = fx.height / r.h, f = fx.data;
    for (let j = 0; j < Hh; j++) { const Z = (r.rug.cz + ((j + 0.5) / Hh - 0.5) * g.d) / 100;
      for (let i = 0; i < W; i++) { const o = (j * W + i) * 4; if (!d[o + 3]) continue; const X = (r.rug.cx + ((i + 0.5) / W - 0.5) * g.w) / 100, q = M[6] * X + M[7] * Z + M[8];
        const u = Math.min(fx.width - 1, Math.max(0, ((M[0] * X + M[1] * Z + M[2]) / q * sx) | 0)), w = Math.min(fx.height - 1, Math.max(0, ((M[3] * X + M[4] * Z + M[5]) / q * sy) | 0)), p = (w * fx.width + u) * 4;
        d[o] = Math.min(255, d[o] * f[p] * k / 255); d[o + 1] = Math.min(255, d[o + 1] * f[p + 1] * k / 255); d[o + 2] = Math.min(255, d[o + 2] * f[p + 2] * k / 255); } }
    x.putImageData(id, 0, 0);
  }
  const drawTabs = () => { tabs.innerHTML = rooms.list.map((r, i) => `<button type="button" class="chip ${i === cur ? 'on' : ''}" data-i="${i}">${esc(r.name[lang] || r.name.en)}</button>`).join('') + ['day', 'dusk', 'night'].map((k) => `<button type="button" class="chip ${tod === k ? 'on' : ''}" data-t="${k}">${esc(t('rm.' + k))}</button>`).join(''); $$('button', tabs).forEach((b) => b.addEventListener('click', () => { if (b.dataset.i != null) cur = +b.dataset.i; else tod = b.dataset.t; drawTabs(); show(); })); };
  async function show() {
    const r = rooms.list[cur], key = `assets/rooms/${r.id}_${tod}`, my = ++tok; v.classList.add('busy');
    const [img, fx] = await Promise.all([loadImg(key + '.webp'), loadFx(key + '_fx.webp')]); if (my !== tok) return; v.classList.remove('busy'); if (!img) return;
    const g = fit(r); bake(r, fx, g); img.className = 'bg'; img.alt = ''; v.replaceChildren(img, holder);
    cap.textContent = t('rm.shown', { s: `${Math.round(g.w / 10) * 10} × ${Math.round(g.d / 10) * 10}` });
    place = () => { const s = v.clientWidth / r.w, pt = (x, z) => { const X = x / 100, Z = z / 100, q = r.M[6] * X + r.M[7] * Z + r.M[8]; return [(r.M[0] * X + r.M[1] * Z + r.M[2]) / q * s, (r.M[3] * X + r.M[4] * Z + r.M[5]) / q * s]; }, cx = r.rug.cx, cz = r.rug.cz; holder.style.width = rcv.width + 'px'; holder.style.height = rcv.height + 'px'; holder.style.transform = homography(rcv.width, rcv.height, [pt(cx - g.w / 2, cz - g.d / 2), pt(cx + g.w / 2, cz - g.d / 2), pt(cx + g.w / 2, cz + g.d / 2), pt(cx - g.w / 2, cz + g.d / 2)]); }; place();
  }
  new ResizeObserver(() => place && place()).observe(v); addEventListener('langchange', () => { drawTabs(); show(); });
  drawTabs(); show();
})();
function homography(w, h, q) { // map the unit rug rectangle (0,0)-(w,h) onto the quad q (tl,tr,br,bl) with a CSS matrix3d
  const src = [[0, 0], [w, 0], [w, h], [0, h]], A = [], B = [];
  for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = q[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v); }
  const n = 8; for (let i = 0; i < n; i++) { let m = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;[A[i], A[m]] = [A[m], A[i]];[B[i], B[m]] = [B[m], B[i]]; for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]; B[r] -= f * B[i]; } }
  const x = Array(n); for (let i = n - 1; i >= 0; i--) { let s = B[i]; for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c]; x[i] = s / A[i][i]; }
  const [a, b, c, d, e, f, g, hh] = x; return `matrix3d(${a},${d},0,${g},${b},${e},0,${hh},0,0,1,0,${c},${f},0,1)`;
}
