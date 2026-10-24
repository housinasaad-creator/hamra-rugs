/* HAMRA — the hero: a live three.js scene of a loom weaving a rug, knot by knot, at constant speed (no stops).
   Deterministic: renderAt(p, t) draws the exact frame for progress p (0..1) and time t, so the same scene can be recorded offline for the final looping video.
   quality: 'high' (default), 'ultra' (offline capture), 'lite' (phones). */
import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { makeSpec, paintRug, rngOf, PALETTES } from './rugkit.js';

export const HERO_SEED = 16, DURATION = 16;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c, srgb = true, rep) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };

function woodCanvas(w, h, base, seed, planks) {
  const c = cvs(w, h), x = c.getContext('2d'), r = rngOf(seed); x.fillStyle = base; x.fillRect(0, 0, w, h);
  if (planks) { const n = 10, ph = h / n; for (let i = 0; i < n; i++) { const y = i * ph, tone = (r() - 0.5) * 34; x.fillStyle = `rgba(${tone > 0 ? '255,214,160' : '0,0,0'},${Math.abs(tone) / 255})`; x.fillRect(0, y, w, ph); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, y, w, 2.5); const cut = r() * w; x.fillRect(cut, y, 2.5, ph); } }
  for (let i = 0; i < (planks ? 900 : 380); i++) { const a = 0.04 + r() * 0.14; x.strokeStyle = r() < 0.55 ? `rgba(24,12,4,${a})` : `rgba(210,160,100,${a * 0.6})`; x.lineWidth = 0.5 + r() * 1.8; x.beginPath(); if (planks) { const y0 = r() * h; let yy = y0; x.moveTo(0, yy); for (let xx = 0; xx <= w; xx += 40) { yy += (r() - 0.5) * 1.6; x.lineTo(xx, yy); } } else { const x0 = r() * w; let xx = x0; x.moveTo(xx, 0); for (let yy = 0; yy <= h; yy += 36) { xx += (r() - 0.5) * 3; x.lineTo(xx, yy); } } x.stroke(); }
  return c;
}
function plasterCanvas() { const c = cvs(1024, 1024), x = c.getContext('2d'), r = rngOf(3); const g = x.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, '#2a1f17'); g.addColorStop(1, '#1b140f'); x.fillStyle = g; x.fillRect(0, 0, 1024, 1024); x.filter = 'blur(14px)'; for (let i = 0; i < 260; i++) { x.fillStyle = r() < 0.5 ? `rgba(255,226,180,${0.01 + r() * 0.03})` : `rgba(0,0,0,${0.03 + r() * 0.06})`; const s = 30 + r() * 160; x.fillRect(r() * 1024, r() * 1024, s, s * (0.5 + r())); } return c; }
function knotBump() { const c = cvs(64, 64), x = c.getContext('2d'), r = rngOf(9); x.fillStyle = '#808080'; x.fillRect(0, 0, 64, 64); const g = x.createRadialGradient(32, 30, 4, 32, 32, 36); g.addColorStop(0, '#f2f2f2'); g.addColorStop(0.7, '#9a9a9a'); g.addColorStop(1, '#2a2a2a'); x.fillStyle = g; x.beginPath(); x.roundRect(3, 3, 58, 58, 14); x.fill(); for (let i = 0; i < 140; i++) { x.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.25)'; x.lineWidth = 1; const px = 6 + r() * 52, py = 6 + r() * 52; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 6, py + 7 + r() * 8); x.stroke(); } return c; }
function windowGobo() { const c = cvs(512, 512), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512); x.filter = 'blur(5px)'; x.fillStyle = '#fff'; const cols = 3, rows = 4, mx = 70, my = 40, gap = 14, w = (512 - mx * 2 - gap * (cols - 1)) / cols, h = (512 - my * 2 - gap * (rows - 1)) / rows; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { x.beginPath(); x.roundRect(mx + i * (w + gap), my + j * (h + gap), w, h, 4); x.fill(); } return c; }
function glowSprite() { const c = cvs(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,236,200,1)'); g.addColorStop(0.35, 'rgba(255,214,150,.35)'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c; }
function envCanvas() { const c = cvs(512, 256), x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#3a2c20'); g.addColorStop(0.55, '#1a120c'); g.addColorStop(1, '#0b0705'); x.fillStyle = g; x.fillRect(0, 0, 512, 256); x.filter = 'blur(10px)'; x.fillStyle = '#ffd9a0'; x.fillRect(60, 70, 90, 100); x.fillStyle = '#ffe9c8'; x.fillRect(300, 40, 60, 40); x.fillStyle = '#8fb0e0'; x.fillRect(430, 90, 40, 80); return c; }

export function createLoomScene(host, o = {}) {
  const Q = o.quality || 'high', lite = Q === 'lite', ultra = Q === 'ultra';
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!o.preserve });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, ultra ? 3 : lite ? 1.25 : 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.96; renderer.outputColorSpace = THREE.SRGBColorSpace; host.append(renderer.domElement);
  const cv = renderer.domElement; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0b0806'); scene.fog = new THREE.FogExp2(0x0b0806, 0.034);
  const pm = new THREE.PMREMGenerator(renderer), envT = new THREE.CanvasTexture(envCanvas()); envT.mapping = THREE.EquirectangularReflectionMapping; envT.colorSpace = THREE.SRGBColorSpace; scene.environment = pm.fromEquirectangular(envT).texture; if ('environmentIntensity' in scene) scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 80);

  /* ---- the rug (texture comes from the same knot grid as the catalog) */
  const spec = o.spec || makeSpec(7, { family: 'medallion', palette: 0 }), RW = 3.0, RH = RW * spec.H / spec.W, FLOOR = -RH / 2 - 1.0, HALF = RH / 2;
  const rugC = cvs(8, 8); paintRug(rugC, spec, lite ? 11 : ultra ? 26 : 20, { noFringe: true });
  const rugT = tex(rugC); const bump = tex(knotBump(), false, [spec.W, spec.H]);
  const uRow = { value: 0 }, uSweep = { value: -1 };
  const rugM = new THREE.MeshStandardMaterial({ map: rugT, bumpMap: bump, bumpScale: 2.2, roughness: 0.92, metalness: 0 });
  rugM.onBeforeCompile = (sh) => {
    sh.uniforms.uRow = uRow; sh.uniforms.uSweep = uSweep;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vRug;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRug = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vRug; uniform float uRow; uniform float uSweep;').replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vRug.y > uRow) discard;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nfloat dd = uRow - vRug.y; totalEmissiveRadiance += vec3(1.0,0.7,0.32) * smoothstep(0.014, 0.0, dd) * 0.85; totalEmissiveRadiance += vec3(1.0,0.84,0.52) * smoothstep(0.09, 0.0, abs(vRug.y - uSweep)) * 0.2;');
  };
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), rugM); rug.position.z = 0.012; rug.castShadow = true; rug.receiveShadow = true; scene.add(rug);

  /* ---- the loom */
  const woodT = tex(woodCanvas(512, 1024, '#6a4528', 5)), woodB = tex(woodCanvas(512, 1024, '#808080', 5), false);
  const wood = new THREE.MeshStandardMaterial({ map: woodT, roughness: 0.62, metalness: 0.02, bumpMap: woodB, bumpScale: 1.4 });
  const woodD = new THREE.MeshStandardMaterial({ map: woodT, roughness: 0.55, color: 0xb8957a });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a050, roughness: 0.28, metalness: 0.95 });
  const addMesh = (g, m, x, y, z, cast = true) => { const me = new THREE.Mesh(g, m); me.position.set(x, y, z); me.castShadow = cast; me.receiveShadow = true; scene.add(me); return me; };
  const px = RW / 2 + 0.55, topY = HALF + 0.22, botY = -HALF - 0.22, postH = topY - FLOOR + 0.5;
  for (const s of [-1, 1]) { addMesh(new RoundedBoxGeometry(0.36, postH, 0.4, 4, 0.05), wood, s * px, FLOOR + postH / 2 - 0.05, -0.05); addMesh(new RoundedBoxGeometry(0.34, 0.5, 0.9, 3, 0.04), woodD, s * px, FLOOR + 0.2, -0.05); }
  const warpBeam = addMesh(new THREE.CylinderGeometry(0.17, 0.17, 2 * px + 0.5, 40), wood, 0, topY, 0); warpBeam.rotation.z = Math.PI / 2;
  const clothBeam = addMesh(new THREE.CylinderGeometry(0.2, 0.2, 2 * px + 0.5, 40), wood, 0, botY, 0.02); clothBeam.rotation.z = Math.PI / 2;
  addMesh(new RoundedBoxGeometry(2 * px + 0.5, 0.2, 0.3, 3, 0.04), wood, 0, topY + 0.55, -0.2); addMesh(new RoundedBoxGeometry(2 * px + 0.5, 0.22, 0.3, 3, 0.04), wood, 0, FLOOR + 1.2, -0.25);
  for (const s of [-1, 1]) { const peg = addMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16), brass, s * (px + 0.1), topY, 0); peg.rotation.z = Math.PI / 2; }
  /* warp threads */
  const N = spec.W, warpG = new THREE.CylinderGeometry(0.0085, 0.0085, topY - botY, 6), warpM = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.85 }), warp = new THREE.InstancedMesh(warpG, warpM, N), m4 = new THREE.Matrix4();
  for (let i = 0; i < N; i++) { m4.makeTranslation(-RW / 2 + (i + 0.5) * RW / N, (topY + botY) / 2, 0.0); warp.setMatrixAt(i, m4); } warp.castShadow = true; scene.add(warp);
  /* comb + shuttle + weft */
  const comb = new THREE.Group(); const bar = new THREE.Mesh(new RoundedBoxGeometry(RW + 0.14, 0.1, 0.12, 2, 0.02), brass); bar.castShadow = true; comb.add(bar);
  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.01, 0.2, 0.05), brass, N + 1); for (let i = 0; i <= N; i++) { m4.makeTranslation(-RW / 2 + i * RW / N, -0.14, 0); teeth.setMatrixAt(i, m4); } comb.add(teeth); scene.add(comb);
  const lathe = []; for (let i = 0; i <= 14; i++) { const u = i / 14; lathe.push(new THREE.Vector2(Math.sin(u * Math.PI) ** 0.75 * 0.075 + 0.004, (u - 0.5) * 0.62)); }
  const shuttleM = new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.35, metalness: 0.05 }), shuttle = new THREE.Mesh(new THREE.LatheGeometry(lathe, 22), shuttleM); shuttle.rotation.z = Math.PI / 2; shuttle.castShadow = true; scene.add(shuttle);
  const weftM = new THREE.MeshStandardMaterial({ color: 0xb13b2e, roughness: 0.7 }), weft = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1, 6), weftM); weft.castShadow = true; scene.add(weft);
  const bobbin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.26, 20), weftM); bobbin.position.set(px + 0.05, botY + 0.9, 0.25); scene.add(bobbin); const rimM = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 20), wood); rimM.position.set(px + 0.05, botY + 0.9 + 0.14, 0.25); scene.add(rimM);

  /* ---- atelier: floor, wall, hanging skeins, lamps */
  const floorT = tex(woodCanvas(1024, 1024, '#4a3322', 11, true), true, [5, 5]); const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.72, metalness: 0.02 })); floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR; floor.receiveShadow = true; scene.add(floor);
  const wallT = tex(plasterCanvas(), true, [4, 2]); const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 18), new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.95 })); wall.position.set(0, FLOOR + 8, -4.2); wall.receiveShadow = true; scene.add(wall);
  const skeins = new THREE.Group(); const pal = PALETTES[spec.pal].c, skCols = [pal[0], pal[1], pal[2], pal[3], pal[5], '#c4452b', '#2f5f8a', '#4c8a5c']; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 8.4, 12), wood); pole.rotation.z = Math.PI / 2; pole.position.set(-5.2, FLOOR + 5.0, -3.4); scene.add(pole);
  skCols.forEach((c, i) => { for (let k = 0; k < 2; k++) { const sk = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.11, 14, 36), new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 })); sk.scale.set(0.8, 1.7, 0.8); sk.position.set(-8.6 + i * 1.0, FLOOR + 4.0 - k * 0.55, -3.4 + k * 0.25); sk.castShadow = true; sk.userData.ph = i * 0.9 + k; skeins.add(sk); } }); scene.add(skeins);
  const cones = new THREE.Group(); for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 22), new THREE.MeshStandardMaterial({ color: skCols[i % skCols.length], roughness: 0.9 })); c.position.set(5.2 + (i % 3) * 0.52, FLOOR + 0.28 + Math.floor(i / 3) * 0.02, -2.6 - Math.floor(i / 3) * 0.55); c.castShadow = true; cones.add(c); } scene.add(cones);
  /* light: window light through a mullioned gobo, cool rim, warm bounce */
  const key = new THREE.SpotLight(0xffd7a0, o.keyI || 620, 60, 0.46, 0.6, 1.6); key.position.set(-6.5, 6.4, 7.5); key.target.position.set(0, -0.5, 0); key.castShadow = true; key.shadow.mapSize.set(ultra ? 4096 : lite ? 1024 : 2048, ultra ? 4096 : lite ? 1024 : 2048); key.shadow.bias = -0.00025; key.shadow.radius = 5; key.map = tex(windowGobo()); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x7a98d0, 0.5); rim.position.set(7, 3.5, 4); scene.add(rim);
  const warm = new THREE.PointLight(0xff9a50, 14, 14, 1.8); warm.position.set(1.5, -1.6, 2.6); scene.add(warm);
  const back = new THREE.PointLight(0xffc680, 30, 16, 1.7); back.position.set(0, 1.2, -2.6); scene.add(back);
  scene.add(new THREE.HemisphereLight(0x7a6050, 0x1a120c, 0.4));
  const front = new THREE.PointLight(0xffe2bc, 36, 22, 1.6); front.position.set(0.8, 0.8, 8.0); scene.add(front);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(15, 11), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowSprite()), transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.position.set(0.2, 0.4, -3.9); scene.add(halo);
  /* dust and fibres in the light */
  const DUST = lite ? 260 : 700, dg = new THREE.BufferGeometry(), dp = new Float32Array(DUST * 3), dr = rngOf(21); for (let i = 0; i < DUST; i++) { dp[i * 3] = (dr() - 0.5) * 16; dp[i * 3 + 1] = FLOOR + dr() * 9; dp[i * 3 + 2] = -3 + dr() * 12; } dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dustU = { uT: { value: 0 }, uPx: { value: renderer.getPixelRatio() } }, dust = new THREE.Points(dg, new THREE.ShaderMaterial({ uniforms: { ...dustU, uMap: { value: new THREE.CanvasTexture(glowSprite()) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: 'uniform float uT; uniform float uPx; varying float vA; void main(){ vec3 p = position; float k = float(gl_VertexID); p.x += sin(uT*0.21 + p.y*0.7 + k)*0.35; p.y += mod(uT*0.06 + k*0.013, 9.0) - 4.5 ; p.y = mod(p.y + 3.6, 9.0) - 3.3; p.z += cos(uT*0.17 + k)*0.3; vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; float s = 26.0 + mod(k*7.0, 40.0); gl_PointSize = s*uPx/(-mv.z); vA = 0.25 + 0.5*fract(k*0.37); }', fragmentShader: 'uniform sampler2D uMap; varying float vA; void main(){ vec4 c = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(c.rgb, c.a*vA*0.55); }' }));
  dust.frustumCulled = false; scene.add(dust);

  /* ---- camera path */
  const keys = [[0.0, [0.0, 0.4, 10.2], [-1.4, 0.1, 0]], [0.08, [0.9, -1.0, 5.2], [0.0, -1.5, 0]], [0.16, [0.8, -1.25, 2.9], [0.1, -1.5, 0]], [0.35, [2.9, -0.4, 6.3], [-0.5, -0.3, 0]], [0.58, [-2.5, 0.9, 8.6], [-1.0, 0.5, 0]], [0.82, [1.3, 0.8, 9.8], [-1.2, 0.3, 0]], [0.94, [0.0, 0.4, 10.2], [-1.4, 0.1, 0]], [1.0, [0.0, 0.4, 10.2], [-1.4, 0.1, 0]]];
  const cpos = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k[1])), false, 'centripetal'), ctar = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k[2])), false, 'centripetal'), kt = keys.map((k) => k[0]);
  const at = (curve, p) => { let i = 0; while (i < kt.length - 2 && p > kt[i + 1]) i++; const u = clamp((p - kt[i]) / (kt[i + 1] - kt[i]), 0, 1), s = u * u * (3 - 2 * u); return curve.getPoint((i + s) / (kt.length - 1)); };
  let mx = 0, my = 0, smx = 0, smy = 0, portrait = false, raf = 0, running = false, t0 = performance.now(), ready = false;
  const hostSize = () => { const w = host.clientWidth || 1280, h = host.clientHeight || 720; renderer.setSize(w, h, false); camera.aspect = w / h; portrait = h > w * 1.1; camera.fov = portrait ? 52 : 32; camera.updateProjectionMatrix(); };

  /* ---- one frame */
  function renderAt(p, t = p * DURATION) {
    const rowP = clamp(p / 0.9, 0, 1), rowN = Math.floor(rowP * spec.H) / spec.H; uRow.value = rowP > 0 ? Math.min(1, rowN + 1 / spec.H * (rowP * spec.H % 1) ** 0.6) : 0; uSweep.value = p > 0.9 ? (p - 0.9) / 0.1 * 1.3 - 0.15 : -1;
    const wy = -HALF + rowP * RH, ph = t * 4.4, sx = Math.sin(ph * 0.5) * (RW / 2 + 0.2), strike = Math.max(0, Math.sin(ph)) ** 3;
    comb.position.set(0, wy + 0.2 - strike * 0.1, 0.1); shuttle.position.set(sx, wy + 0.1, 0.12); shuttle.visible = rowP > 0 && rowP < 1; weft.visible = shuttle.visible; comb.visible = shuttle.visible;
    const bx = px + 0.05, by = botY + 0.9, bz = 0.25, dx = bx - sx, dy = by - (wy + 0.1), dz = bz - 0.12, L = Math.hypot(dx, dy, dz); weft.position.set(sx + dx / 2, wy + 0.1 + dy / 2, 0.12 + dz / 2); weft.scale.set(1, L, 1); weft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
    skeins.children.forEach((s) => { s.rotation.z = Math.sin(t * 0.7 + s.userData.ph) * 0.05; s.rotation.y = Math.sin(t * 0.45 + s.userData.ph) * 0.12; });
    dust.material.uniforms.uT.value = t; key.intensity = (o.keyI || 620) * (1 + Math.sin(t * 1.3) * 0.012);
    const cp = at(cpos, p), ct = at(ctar, p); smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06;
    if (portrait) { camera.position.set(cp.x * 0.5 + smx * 0.4, cp.y + smy * 0.2, cp.z * 1.12 + 1.2); camera.lookAt(ct.x * 0.1, ct.y, ct.z); }
    else { camera.position.set(cp.x + smx * 0.6, cp.y + smy * 0.35, cp.z); camera.lookAt(ct.x, ct.y, ct.z); }
    renderer.render(scene, camera); if (!ready) { ready = true; o.onReady && o.onReady(); }
  }
  let auto = true, speed = 1, prog = 0;
  function loop(now) { raf = requestAnimationFrame(loop); if (!running) return; const tt = ((now - t0) / 1000 * speed) % DURATION; prog = tt / DURATION; renderAt(prog, now / 1000 * 0.5 + tt); o.onProgress && o.onProgress(prog); }
  hostSize(); if ('ResizeObserver' in window) new ResizeObserver(hostSize).observe(host); else addEventListener('resize', hostSize);
  host.addEventListener('pointermove', (e) => { const r = host.getBoundingClientRect(); mx = ((e.clientX - r.left) / r.width - 0.5) * 2; my = -((e.clientY - r.top) / r.height - 0.5) * 2; }, { passive: true });
  host.addEventListener('pointerdown', () => { speed = 3; }); addEventListener('pointerup', () => { speed = 1; });
  const api = { renderAt, renderer, scene, camera, spec, start() { if (!running) { running = true; t0 = performance.now() - prog * DURATION * 1000 / speed; } if (!raf) raf = requestAnimationFrame(loop); }, stop() { running = false; }, dispose() { running = false; cancelAnimationFrame(raf); raf = 0; scene.traverse((ob) => { ob.geometry && ob.geometry.dispose(); const m = ob.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { for (const k in x) if (x[k] && x[k].isTexture) x[k].dispose(); x.dispose(); }); }); pm.dispose(); renderer.dispose(); renderer.forceContextLoss(); cv.remove(); }, get progress() { return prog; } };
  renderAt(0.02, 0.3); return api;
}
