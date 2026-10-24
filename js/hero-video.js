/* HAMRA — hero video: one light loop (about 15 s) rendered from the 3D loom scene at constant speed, repeating without a cut and independent of scrolling.
   It plays only while the hero is on screen, pauses the moment it leaves, and its source is released when the visitor is far away (load/unload are called by the page).
   Reduced motion or data-saver keeps the still poster; if autoplay is blocked the poster stays until the first touch. */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

export function initHeroVideo({ hero, stick, video, hdr = () => 0, reduced, saveData, stops, clips = 'assets/hero/', mobileQuery = '(max-width: 760px)', onReady, onFail, onPos, virtual = false }) {
  const LAST = Math.max(1, (Array.isArray(stops) ? stops.length : stops || 5) - 1);
  const stub = { load() { }, unload() { }, jump() { }, snap() { }, pause() { }, get stage() { return 0; }, get ready() { return false; }, get animating() { return false; }, get top() { return true; }, stats: () => ({ stub: true }) };
  if (reduced || saveData || !video) return stub;
  let wanted = false, ready = false, vis = true, tm = 0;
  video.muted = video.defaultMuted = true; video.loop = true; video.playsInline = true; video.preload = 'none'; video.disablePictureInPicture = true; video.disableRemotePlayback = true;
  video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.removeAttribute('autoplay');

  const span = () => Math.max(1, hero.offsetHeight - stick.offsetHeight);
  const base = () => hero.getBoundingClientRect().top + scrollY - hdr();
  const stageY = (k) => base() + span() * (k / LAST);
  const posNow = () => (hero.offsetHeight - stick.offsetHeight < 4 ? 0 : clamp((scrollY - base()) / span(), 0, 1) * LAST);

  
  function sync() {
    if (!wanted) return;
    if (vis && !document.hidden) { const p = video.play(); p && p.catch && p.catch(() => { }); } else video.pause();
  }
  
  let wdT = -1, wdN = 0, wd = 0;
  function watchdog() {
    if (!wanted || !ready || !vis || document.hidden || video.paused || video.ended) { wdN = 0; wdT = -1; return; }
    const t = video.currentTime; if (Math.abs(t - wdT) > 0.02) { wdT = t; wdN = 0; return; }
    wdN++;
    if (wdN === 2) { video.pause(); const p = video.play(); p && p.catch && p.catch(() => { }); }
    else if (wdN >= 4) { wdN = 0; const src = video.getAttribute('src'); if (src) { video.src = src; video.load(); video.currentTime = Math.max(0, t - 0.05); const p = video.play(); p && p.catch && p.catch(() => { }); } }
  }
  const done = () => { if (!wanted || ready) return; ready = true; clearTimeout(tm); onReady && onReady(); };
  const onPlaying = () => { if (!wanted) return; stick.classList.add('on3d'); done(); };
  const onErr = () => { if (!wanted) return; ready = false; stick.classList.remove('on3d'); onFail && onFail(); };

  function load() {
    if (wanted) return; wanted = true; ready = false;
    const kind = matchMedia(mobileQuery).matches ? 'phone' : 'desktop';
    video.addEventListener('playing', onPlaying); video.addEventListener('loadeddata', done); video.addEventListener('error', onErr);
    tm = setTimeout(done, 2500);
    video.preload = 'auto'; video.src = `${clips}loop-${kind}.mp4`; video.load(); sync(); clearInterval(wd); wd = setInterval(watchdog, 1000);
  }
  function unload() {
    if (!wanted) return; wanted = false; ready = false; clearTimeout(tm);
    video.removeEventListener('playing', onPlaying); video.removeEventListener('loadeddata', done); video.removeEventListener('error', onErr);
    clearInterval(wd); video.pause(); video.removeAttribute('src'); video.load(); stick.classList.remove('on3d');
  }

  
  if (virtual) { const chk = () => { const v = scrollY < innerHeight * 0.9; if (v !== vis) { vis = v; sync(); } }; addEventListener('scroll', chk, { passive: true }); chk(); }
  else if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { vis = e.isIntersecting; sync(); }, { rootMargin: '0px' }).observe(stick);
  document.addEventListener('visibilitychange', sync);
  for (const ev of ['touchend', 'pointerup', 'keydown']) addEventListener(ev, () => { if (wanted && video.paused) sync(); }, { passive: true, once: true });

  
  if (onPos && !virtual) {
    let r = 0; const f = () => { r = 0; onPos(posNow()); };
    addEventListener('scroll', () => { r = r || requestAnimationFrame(f); }, { passive: true }); addEventListener('resize', () => { r = r || requestAnimationFrame(f); }, { passive: true }); onPos(posNow());
  }

  const api = {
    load, unload, pause() { }, snap() { },
    jump(k) { if (!virtual) scrollTo({ top: stageY(clamp(k, 0, LAST)), behavior: 'smooth' }); },
    get stage() { return virtual ? 0 : Math.round(posNow()); }, get ready() { return ready; }, get animating() { return false; }, get top() { return virtual ? scrollY <= 2 : true; },
    stats: () => ({ loaded: wanted, ready, playing: !video.paused && !video.ended, t: +video.currentTime.toFixed(2), vis, src: video.getAttribute('src') || '', on3d: stick.classList.contains('on3d') })
  };
  window.__hv = api;
  return api;
}
