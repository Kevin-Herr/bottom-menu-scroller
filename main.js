/*
 * Glass Dock
 * Springs come from Motion (motion.dev): every animated value is a motionValue,
 * so any motion can be grabbed mid-flight and retargeted from its live value
 * and velocity. Gestures use Pointer Events directly.
 */
(() => {
  'use strict';

  const { animate, motionValue, frame, clamp, mix, wrap } = window.Motion;

  // ---------------------------------------------------------------------------
  // Menus (icons are Font Awesome Free classes)
  // ---------------------------------------------------------------------------
  const MENUS = [
    {
      name: 'Everyday',
      glyph: { icon: 'fa-solid fa-sun', hue: 38 },
      items: [
        { label: 'Messages', icon: 'fa-solid fa-message', hue: 135 },
        { label: 'Phone', icon: 'fa-solid fa-phone', hue: 145 },
        { label: 'Mail', icon: 'fa-solid fa-envelope', hue: 212 },
        { label: 'Calendar', icon: 'fa-solid fa-calendar-days', hue: 2 },
        { label: 'Photos', icon: 'fa-solid fa-image', hue: 32 },
        { label: 'Camera', icon: 'fa-solid fa-camera', hue: 220, sat: 14 },
        { label: 'Maps', icon: 'fa-solid fa-map', hue: 168 },
        { label: 'Weather', icon: 'fa-solid fa-cloud-sun', hue: 200 },
        { label: 'Clock', icon: 'fa-solid fa-clock', hue: 250 },
        { label: 'Notes', icon: 'fa-solid fa-note-sticky', hue: 44 },
        { label: 'Music', icon: 'fa-solid fa-music', hue: 345 },
      ],
    },
    {
      name: 'Create',
      glyph: { icon: 'fa-solid fa-wand-magic-sparkles', hue: 275 },
      items: [
        { label: 'Draw', icon: 'fa-solid fa-pen-nib', hue: 28 },
        { label: 'Palette', icon: 'fa-solid fa-palette', hue: 290 },
        { label: 'Layers', icon: 'fa-solid fa-layer-group', hue: 255 },
        { label: 'Crop', icon: 'fa-solid fa-crop-simple', hue: 190 },
        { label: 'Magic', icon: 'fa-solid fa-wand-magic-sparkles', hue: 275 },
        { label: 'Text', icon: 'fa-solid fa-font', hue: 220 },
        { label: 'Shapes', icon: 'fa-solid fa-shapes', hue: 16 },
        { label: 'Record', icon: 'fa-solid fa-microphone', hue: 355 },
        { label: 'Video', icon: 'fa-solid fa-video', hue: 155 },
      ],
    },
    {
      name: 'Listen & Watch',
      glyph: { icon: 'fa-solid fa-headphones', hue: 340 },
      items: [
        { label: 'Play', icon: 'fa-solid fa-play', hue: 350 },
        { label: 'Headphones', icon: 'fa-solid fa-headphones', hue: 265 },
        { label: 'Podcasts', icon: 'fa-solid fa-podcast', hue: 285 },
        { label: 'Films', icon: 'fa-solid fa-film', hue: 12 },
        { label: 'TV', icon: 'fa-solid fa-tv', hue: 205 },
        { label: 'Books', icon: 'fa-solid fa-book', hue: 30 },
        { label: 'Favorites', icon: 'fa-solid fa-star', hue: 46 },
        { label: 'Loved', icon: 'fa-solid fa-heart', hue: 340 },
      ],
    },
    {
      name: 'Controls',
      glyph: { icon: 'fa-solid fa-sliders', hue: 212 },
      items: [
        { label: 'Wi‑Fi', icon: 'fa-solid fa-wifi', hue: 212 },
        { label: 'Bluetooth', icon: 'fa-brands fa-bluetooth-b', hue: 225 },
        { label: 'Battery', icon: 'fa-solid fa-battery-three-quarters', hue: 125 },
        { label: 'Light', icon: 'fa-solid fa-lightbulb', hue: 48 },
        { label: 'Timer', icon: 'fa-solid fa-stopwatch', hue: 26 },
        { label: 'Lock', icon: 'fa-solid fa-lock', hue: 240, sat: 20 },
        { label: 'Search', icon: 'fa-solid fa-magnifying-glass', hue: 198 },
        { label: 'Alerts', icon: 'fa-solid fa-bell', hue: 6 },
        { label: 'Share', icon: 'fa-solid fa-share-from-square', hue: 210 },
        { label: 'Files', icon: 'fa-solid fa-folder', hue: 204 },
      ],
    },
  ];

  // ---------------------------------------------------------------------------
  // Geometry (keep in sync with styles.css)
  // ---------------------------------------------------------------------------
  const FAB = 60;
  const FAB_EDGE = 14;
  const ITEM_W = 64;
  const ITEM_GAP = 8;
  const PITCH = ITEM_W + ITEM_GAP;
  const TRACK_PAD = 14;
  const HEAD_H = 38;
  const ROW_H = 96;
  const BAR_H = 6 + HEAD_H + ROW_H;
  const BAR_MAX_W = 480;
  const BAR_EDGE = 12;
  const BAR_R_SQUARE = 30;
  const BAR_R_CIRCLE = 44;
  const HEAD_PAD_R = 10;
  const TITLE_TRAVEL = 30;
  const TITLE_PAD = 20;
  const POP_GAP = 8;
  const N = MENUS.length;

  const root = document.documentElement;
  root.style.setProperty('--head-h', HEAD_H + 'px');
  root.style.setProperty('--row-h', ROW_H + 'px');
  root.style.setProperty('--bar-h', BAR_H + 'px');

  const $ = (sel) => document.querySelector(sel);
  const dock = $('#dock');
  const face = $('#dockFace');
  const panel = $('#dockPanel');
  const panelInner = $('.panel-inner');
  const pagesEl = $('.pages');
  const titlesEl = $('.titles');
  const pop = $('#menuPop');
  const dotsEl = $('.dots');
  const closeBtn = $('.panel-close');
  const panelHead = $('.panel-head');
  const tintDark = $('.tint-dark');
  const toggle = $('.shape-toggle');
  const widthToggle = $('.width-toggle');
  const toastEl = $('#toast');
  const live = $('#live');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // ---------------------------------------------------------------------------
  // Small utilities
  // ---------------------------------------------------------------------------
  const store = {
    get(key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
    },
  };

  const smoothstep = (a, b, v) => {
    const t = clamp(0, 1, (v - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  // Apple's momentum projection (Designing Fluid Interfaces, WWDC 2018).
  const project = (velocity, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate);

  // Progressive resistance past a boundary.
  const rubberband = (overshoot, dimension, c = 0.55) =>
    (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));

  const rubberClamp = (v, min, max, dimension) => {
    if (v < min) return min - rubberband(min - v, dimension);
    if (v > max) return max + rubberband(v - max, dimension);
    return v;
  };

  const capVelocity = (v, max = 5000) => {
    const speed = Math.hypot(v.x, v.y);
    return speed > max ? { x: (v.x * max) / speed, y: (v.y * max) / speed } : v;
  };

  // Keeps the last ~100ms of pointer samples so release velocity is accurate.
  function velocityTracker() {
    const samples = [];
    return {
      add(x, y, t) {
        samples.push({ x, y, t });
        while (samples.length > 2 && t - samples[0].t > 100) samples.shift();
      },
      velocity(now) {
        if (samples.length < 2) return { x: 0, y: 0 };
        const a = samples[0];
        const b = samples[samples.length - 1];
        if (now - b.t > 80) return { x: 0, y: 0 }; // finger paused before lifting
        const dt = (b.t - a.t) / 1000;
        if (dt <= 0) return { x: 0, y: 0 };
        return capVelocity({ x: (b.x - a.x) / dt, y: (b.y - a.y) / dt });
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Animated values (Motion) + render batching
  // ---------------------------------------------------------------------------
  let renderQueued = false;
  function invalidate() {
    if (renderQueued) return;
    renderQueued = true;
    frame.render(() => {
      renderQueued = false;
      render();
    });
  }

  function value(initial, precision = 0.5) {
    const mv = motionValue(initial);
    mv.goal = initial;
    mv.precision = precision;
    mv.on('change', invalidate);
    return mv;
  }

  // Spring in Apple's terms: damping ratio (1 = no overshoot) and response (seconds).
  function springTo(mv, to, { damping = 1, response = 0.4, velocity } = {}) {
    if (reduceMotion.matches) {
      damping = 1;
      response = Math.min(response, 0.2);
    }
    const omega = (2 * Math.PI) / response;
    mv.goal = to;
    return animate(mv, to, {
      type: 'spring',
      stiffness: omega * omega,
      damping: 2 * damping * omega,
      mass: 1,
      velocity: velocity ?? mv.getVelocity(),
      restDelta: mv.precision,
      restSpeed: mv.precision * 10,
    });
  }

  // Direct manipulation: stop any animation and follow the finger 1:1.
  function place(mv, v) {
    mv.stop();
    mv.goal = v;
    mv.set(v);
  }

  // Grab: freeze at the live on-screen value.
  function halt(mv) {
    mv.stop();
    mv.goal = mv.get();
  }

  const isMoving = (mv) => mv.isAnimating() && Math.abs(mv.getVelocity()) > 40;

  const fabX = value(0);
  const fabY = value(0);
  const press = value(1, 0.001);   // button scale (press / lift)
  const morph = value(0, 0.001);   // 0 = button, 1 = bar
  const shapeT = value(0, 0.001);  // 0 = squared, 1 = circled
  const widthT = value(0, 0.001);  // 0 = fit (capped), 1 = full screen width
  const pageY = value(0);          // vertical position across menus (px, unbounded)

  // ---------------------------------------------------------------------------
  // Build menu pages
  // ---------------------------------------------------------------------------
  function glassIcon(item) {
    const icon = document.createElement('span');
    icon.className = 'glass-icon';
    icon.style.setProperty('--h', item.hue);
    icon.style.setProperty('--s', (item.sat ?? 92) + '%');
    const glyph = document.createElement('i');
    glyph.className = item.icon;
    glyph.setAttribute('aria-hidden', 'true');
    icon.append(glyph);
    return icon;
  }

  const pages = MENUS.map((menu, pi) => {
    const el = document.createElement('div');
    el.className = 'page';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', menu.name);

    const track = document.createElement('div');
    track.className = 'track';
    menu.items.forEach((item, ii) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'item';
      btn.dataset.page = pi;
      btn.dataset.index = ii;
      const label = document.createElement('span');
      label.className = 'item-label';
      label.textContent = item.label;
      btn.append(glassIcon(item), label);
      track.append(btn);
    });
    el.append(track);
    pagesEl.append(el);

    const title = document.createElement('span');
    title.className = 'title';
    title.setAttribute('aria-hidden', 'true');
    const titleText = document.createElement('span');
    titleText.textContent = menu.name;
    const chevron = document.createElement('i');
    chevron.className = 'fa-solid fa-chevron-up';
    title.append(titleText, chevron);
    titlesEl.append(title);

    const dot = document.createElement('span');
    dot.className = 'dot';
    dotsEl.append(dot);

    return { el, track, title, dot, menu, x: value(0), lo: 0, hi: 0, titleW: 0 };
  });

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------
  // Visible width, excluding a desktop scrollbar (innerWidth includes it, but
  // fixed elements are laid out inside it).
  const viewW = () => document.documentElement.clientWidth;

  const safe = { t: 0, r: 0, b: 0, l: 0 };
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(probe);

  function readSafeArea() {
    const cs = getComputedStyle(probe);
    safe.t = parseFloat(cs.paddingTop) || 0;
    safe.r = parseFloat(cs.paddingRight) || 0;
    safe.b = parseFloat(cs.paddingBottom) || 0;
    safe.l = parseFloat(cs.paddingLeft) || 0;
  }

  // Fit: capped at BAR_MAX_W. Full: the screen width minus the same edge margin.
  function barWidth(t) {
    const avail = viewW() - BAR_EDGE * 2 - safe.l - safe.r;
    return mix(Math.min(avail, BAR_MAX_W), avail, t);
  }

  function barRect() {
    const w = barWidth(widthT.get());
    return {
      w,
      h: BAR_H,
      x: (viewW() - w) / 2,
      y: innerHeight - BAR_H - BAR_EDGE - safe.b,
      r: mix(BAR_R_SQUARE, BAR_R_CIRCLE, shapeT.get()),
    };
  }

  function fabBounds() {
    return {
      minX: FAB_EDGE + safe.l,
      maxX: viewW() - FAB - FAB_EDGE - safe.r,
      minY: FAB_EDGE + safe.t,
      maxY: innerHeight - FAB - FAB_EDGE - safe.b,
    };
  }

  // Scroll bounds are for the width the bar is heading to, so a width change
  // can re-settle each menu while the bar is still resizing.
  function measure({ animate = false } = {}) {
    readSafeArea();
    const w = barWidth(widthT.goal);
    for (const pg of pages) {
      const n = pg.menu.items.length;
      const trackW = TRACK_PAD * 2 + n * ITEM_W + (n - 1) * ITEM_GAP;
      if (trackW <= w) {
        pg.lo = pg.hi = (w - trackW) / 2; // fits: center it
      } else {
        pg.lo = w - trackW;
        pg.hi = 0;
      }
      if (animate) {
        const to = snapX(pg, clamp(pg.lo, pg.hi, pg.x.goal));
        if (to !== pg.x.goal) springTo(pg.x, to, { damping: 1, response: 0.42 });
      } else {
        place(pg.x, clamp(pg.lo, pg.hi, pg.x.get()));
      }
      pg.titleW = pg.title.offsetWidth;
    }
  }

  // Header right side: padding, then dots (6) + close (30) + two 12px gaps.
  const HEAD_CONTROLS_W = 6 + 30 + 12 * 2;
  // Circled: pull the dots and close button in to where the corner curve begins.
  const headPadRight = () => mix(HEAD_PAD_R, BAR_R_CIRCLE, shapeT.get());

  // 0 = title left-aligned, 1 = centered. Circled or full width centers it; taking
  // the larger keeps it continuous while either toggle animates.
  const titleCentering = () => Math.max(shapeT.get(), widthT.get());

  // Squared + fit: title sits left. Circled or full width: title is centered in the
  // bar, nudged left only on very narrow bars so it never runs into the dots.
  const titleX = (pg, barW) => {
    const room = barW - headPadRight() - HEAD_CONTROLS_W - pg.titleW - 4;
    const centered = Math.max(TITLE_PAD, Math.min((barW - pg.titleW) / 2, room));
    return mix(TITLE_PAD, centered, titleCentering());
  };

  function snapX(pg, x) {
    if (pg.lo === pg.hi) return pg.lo;
    return clamp(pg.lo, pg.hi, -Math.round(-x / PITCH) * PITCH);
  }

  // ---------------------------------------------------------------------------
  // Render — everything on screen is derived from the motion values
  // ---------------------------------------------------------------------------
  function render() {
    const reduced = reduceMotion.matches;
    const p = morph.get();
    const pc = clamp(0, 1, p);
    // Reduced motion: no travel, the surface cross-fades between its two homes.
    const travel = reduced ? (pc < 0.5 ? 0 : 1) : pc;
    const grow = reduced ? travel : p; // size may overshoot slightly; position never does

    const bar = barRect();
    const fromCX = fabX.get() + FAB / 2;
    const fromCY = fabY.get() + FAB / 2;
    const cx = mix(fromCX, bar.x + bar.w / 2, travel);
    const cy = mix(fromCY, bar.y + bar.h / 2, travel);
    const w = mix(FAB, bar.w, grow);
    const h = mix(FAB, bar.h, grow);
    const fabR = mix(FAB * 0.3, FAB / 2, shapeT.get());
    const r = Math.min(mix(fabR, bar.r, travel), w / 2, h / 2);

    dock.style.width = w + 'px';
    dock.style.height = h + 'px';
    dock.style.borderRadius = r + 'px';
    dock.style.transform = `translate3d(${cx - w / 2}px, ${cy - h / 2}px, 0) scale(${press.get()})`;
    dock.style.opacity = reduced ? Math.abs(pc * 2 - 1) : 1;

    face.style.opacity = 1 - smoothstep(0, 0.28, travel);
    tintDark.style.opacity = travel;
    panel.style.opacity = smoothstep(0.3, 0.85, travel);
    panelInner.style.width = bar.w + 'px';
    panelInner.style.transform = `translate(-50%, -50%) scale(${mix(0.82, 1, travel)})`;
    panelHead.style.paddingRight = headPadRight() + 'px';

    const hidden = p < 0.01 && morph.goal === 0;
    panel.style.visibility = hidden ? 'hidden' : 'visible';
    if (!hidden) renderPages(reduced, bar);
    renderPop(reduced, bar);
  }

  function renderPages(reduced, bar) {
    const span = N * ROW_H;
    const Y = pageY.get();
    for (let i = 0; i < N; i++) {
      const pg = pages[i];
      // Wrap so menus cycle endlessly in both directions.
      const off = wrap(-span / 2, span / 2, i * ROW_H - Y);
      const t = off / ROW_H;
      const dist = Math.min(1, Math.abs(t));
      const visible = Math.abs(t) < 1 || i === state.active; // active page must stay focusable

      pg.dot.style.height = 4 + 6 * (1 - dist) + 'px';
      pg.dot.style.opacity = 0.35 + 0.65 * (1 - dist);

      pg.el.style.visibility = visible ? 'visible' : 'hidden';
      pg.title.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) continue;

      pg.el.style.transform = reduced ? 'none' : `translate3d(0, ${off}px, 0) scale(${1 - 0.06 * dist})`;
      pg.el.style.opacity = 1 - dist;
      const ty = reduced ? 0 : t * TITLE_TRAVEL;
      pg.title.style.transform = `translate3d(${titleX(pg, bar.w)}px, ${ty}px, 0)`;
      pg.title.style.opacity = 1 - Math.min(1, dist * 1.5);

      const x = pg.x.get();
      pg.track.style.transform = `translate3d(${x}px, 0, 0)`;
      pg.el.style.setProperty('--fl', clamp(0, 20, pg.hi - x) + 'px');
      pg.el.style.setProperty('--fr', clamp(0, 20, x - pg.lo) + 'px');
    }
  }

  // ---------------------------------------------------------------------------
  // Menu paging
  // ---------------------------------------------------------------------------
  const state = { open: false, active: -1 };
  const nearestPage = () => Math.round(pageY.get() / ROW_H);
  const pageIndex = (k) => ((k % N) + N) % N;

  function setActive(idx, { announce = true } = {}) {
    if (idx === state.active) return;
    state.active = idx;
    pages.forEach((pg, i) => { pg.el.inert = i !== idx; });
    panel.setAttribute('aria-label', `${MENUS[idx].name} menu`);
    titlesEl.setAttribute('aria-label', `${MENUS[idx].name}. Switch menu`);
    if (announce) {
      live.textContent = `${MENUS[idx].name}, menu ${idx + 1} of ${N}`;
      navigator.vibrate?.(8); // light haptic on commit, where supported
    }
  }

  function goToPage(k, velocity) {
    springTo(pageY, k * ROW_H, { damping: 0.86, response: 0.36, velocity });
    setActive(pageIndex(k));
  }

  function cycle(dir, moveFocus) {
    goToPage(Math.round(pageY.goal / ROW_H) + dir);
    if (moveFocus) focusActivePage();
  }

  // Jump to a menu by index, travelling the short way round the cycle.
  function showMenu(idx, moveFocus) {
    const k = Math.round(pageY.goal / ROW_H);
    goToPage(k + wrap(-N / 2, N / 2, idx - pageIndex(k)));
    if (moveFocus) focusActivePage();
  }

  function focusActivePage() {
    render(); // make the incoming page visible before focusing into it
    const pg = pages[state.active];
    const first = clamp(0, pg.menu.items.length - 1, Math.round((pg.hi - pg.x.goal) / PITCH));
    pg.track.children[first].focus({ preventScroll: true });
  }

  const settleX = (pg) => springTo(pg.x, snapX(pg, pg.x.get()), { damping: 1, response: 0.4 });
  const settleY = () => goToPage(nearestPage());

  // ---------------------------------------------------------------------------
  // Open / close
  // ---------------------------------------------------------------------------
  function open(viaKeyboard) {
    if (state.open) return;
    state.open = true;
    measure();
    dock.classList.add('is-open');
    face.setAttribute('aria-expanded', 'true');
    face.inert = true;
    panel.inert = false;
    springTo(morph, 1, { damping: 0.84, response: 0.42 });
    if (viaKeyboard) {
      render();
      const pg = pages[state.active];
      pg.track.children[0].focus({ preventScroll: true });
    }
  }

  function close(returnFocus) {
    if (!state.open) return;
    const hadFocus = panel.contains(document.activeElement) || pop.contains(document.activeElement);
    closePop(false);
    state.open = false;
    dock.classList.remove('is-open');
    face.setAttribute('aria-expanded', 'false');
    panel.inert = true;
    face.inert = false;
    springTo(morph, 0, { damping: 1, response: 0.34 });
    if (returnFocus || hadFocus) face.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------------------
  // Floating button: drag anywhere, tap to open
  // ---------------------------------------------------------------------------
  let fabGesture = null;

  face.addEventListener('pointerdown', (e) => {
    if (state.open || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    face.setPointerCapture(e.pointerId);
    halt(fabX);
    halt(fabY);
    fabGesture = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      startX: fabX.get(),
      startY: fabY.get(),
      dragging: false,
      tracker: velocityTracker(),
    };
    fabGesture.tracker.add(e.clientX, e.clientY, e.timeStamp);
    springTo(press, 0.9, { damping: 1, response: 0.14 }); // respond on press, not release
  });

  face.addEventListener('pointermove', (e) => {
    const g = fabGesture;
    if (!g || e.pointerId !== g.id) return;
    g.tracker.add(e.clientX, e.clientY, e.timeStamp);
    const dx = e.clientX - g.x0;
    const dy = e.clientY - g.y0;
    if (!g.dragging) {
      if (Math.hypot(dx, dy) < 8) return;
      g.dragging = true;
      dock.classList.add('is-lifted');
      springTo(press, 1.08, { damping: 0.75, response: 0.3 });
    }
    // 1:1 with the finger, respecting where it was grabbed.
    const b = fabBounds();
    place(fabX, rubberClamp(g.startX + dx, b.minX, b.maxX, viewW()));
    place(fabY, rubberClamp(g.startY + dy, b.minY, b.maxY, innerHeight));
  });

  function endFabGesture(e, cancelled) {
    const g = fabGesture;
    if (!g || e.pointerId !== g.id) return;
    fabGesture = null;

    if (!g.dragging) {
      springTo(press, 1, { damping: 0.6, response: 0.3 });
      if (!cancelled) open(false);
      return;
    }

    const v = cancelled ? { x: 0, y: 0 } : g.tracker.velocity(e.timeStamp);
    const b = fabBounds();
    // Throw it: land where the momentum carries it, kept on screen.
    const toX = clamp(b.minX, b.maxX, fabX.get() + project(v.x, 0.995));
    const toY = clamp(b.minY, b.maxY, fabY.get() + project(v.y, 0.995));
    const flicked = Math.hypot(v.x, v.y) > 500;
    const damping = flicked ? 0.8 : 1; // bounce only when momentum earned it
    springTo(fabX, toX, { damping, response: 0.45, velocity: v.x });
    springTo(fabY, toY, { damping, response: 0.45, velocity: v.y });
    springTo(press, 1, { damping: 0.7, response: 0.3 });
    dock.classList.remove('is-lifted');
    store.set('bms.fab', { x: toX / viewW(), y: toY / innerHeight });
  }

  face.addEventListener('pointerup', (e) => endFabGesture(e, false));
  face.addEventListener('pointercancel', (e) => endFabGesture(e, true));
  // Keyboard activation (Enter/Space); pointer taps are handled on pointerup.
  face.addEventListener('click', (e) => { if (e.detail === 0) open(true); });

  // ---------------------------------------------------------------------------
  // Bar: swipe left/right to browse, up/down to change menus
  // ---------------------------------------------------------------------------
  let barGesture = null;
  let swallowClick = false;

  panel.addEventListener('pointerdown', (e) => {
    if (!state.open || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (e.target.closest('.panel-close')) return;
    if (!e.target.closest('.titles')) closePop(false);
    swallowClick = false;

    const pg = pages[pageIndex(nearestPage())];
    // Touching moving content stops it, and that touch is not a tap.
    const wasMoving = isMoving(pg.x) || isMoving(pageY);
    halt(pg.x);
    halt(pageY);
    if (wasMoving) swallowClick = true;

    const item = wasMoving ? null : e.target.closest('.item');
    item?.classList.add('pressed');

    barGesture = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      axis: null,
      page: pg,
      item,
      startX: pg.x.get(),
      startY: pageY.get(),
      startPage: nearestPage(),
      tracker: velocityTracker(),
    };
    barGesture.tracker.add(e.clientX, e.clientY, e.timeStamp);
  });

  addEventListener('pointermove', (e) => {
    const g = barGesture;
    if (!g || e.pointerId !== g.id) return;
    g.tracker.add(e.clientX, e.clientY, e.timeStamp);
    let dx = e.clientX - g.x0;
    let dy = e.clientY - g.y0;

    if (!g.axis) {
      if (Math.hypot(dx, dy) < 10) return; // hysteresis before committing to a direction
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      g.x0 = e.clientX;
      g.y0 = e.clientY;
      dx = dy = 0;
      swallowClick = true;
      g.item?.classList.remove('pressed');
      try { panel.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      if (g.axis === 'x') settleY();
      else settleX(g.page);
    }

    if (g.axis === 'x') {
      place(g.page.x, rubberClamp(g.startX + dx, g.page.lo, g.page.hi, barRect().w));
    } else {
      // Free for one menu's height, then resist.
      const a = Math.abs(dy);
      const eased = a <= ROW_H ? dy : Math.sign(dy) * (ROW_H + rubberband(a - ROW_H, ROW_H));
      place(pageY, g.startY - eased);
    }
  });

  function endBarGesture(e, cancelled) {
    const g = barGesture;
    if (!g || e.pointerId !== g.id) return;
    barGesture = null;
    g.item?.classList.remove('pressed');
    const v = cancelled ? { x: 0, y: 0 } : g.tracker.velocity(e.timeStamp);

    if (g.axis === 'x') {
      const pg = g.page;
      const target = snapX(pg, pg.x.get() + project(v.x));
      springTo(pg.x, target, { damping: 1, response: 0.55, velocity: v.x });
    } else if (g.axis === 'y') {
      const vy = -v.y; // finger up = forward
      const projected = pageY.get() + project(vy, 0.99);
      const k = clamp(g.startPage - 1, g.startPage + 1, Math.round(projected / ROW_H));
      goToPage(k, vy);
    } else {
      settleX(g.page);
      settleY();
    }
  }

  addEventListener('pointerup', (e) => endBarGesture(e, false));
  addEventListener('pointercancel', (e) => endBarGesture(e, true));

  // A drag that ends over an icon must not activate it.
  panel.addEventListener('click', (e) => {
    if (swallowClick && e.detail !== 0) {
      e.preventDefault();
      e.stopPropagation();
      swallowClick = false;
    }
  }, true);

  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('.item');
    if (btn) showToast(MENUS[+btn.dataset.page].items[+btn.dataset.index]);
  });

  closeBtn.addEventListener('click', (e) => close(e.detail === 0));

  // Trackpad / mouse wheel
  let wheelAccum = 0;
  let wheelLocked = false;
  let wheelIdle = 0;
  let wheelSnap = 0;

  panel.addEventListener('wheel', (e) => {
    if (!state.open) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? ROW_H : 1;
    const dx = (e.shiftKey ? e.deltaY : e.deltaX) * unit;
    const dy = (e.shiftKey ? 0 : e.deltaY) * unit;

    if (Math.abs(dx) > Math.abs(dy)) {
      const pg = pages[state.active];
      place(pg.x, clamp(pg.lo, pg.hi, pg.x.get() - dx));
      clearTimeout(wheelSnap);
      wheelSnap = setTimeout(() => settleX(pg), 140);
      return;
    }

    clearTimeout(wheelIdle);
    wheelIdle = setTimeout(() => { wheelLocked = false; wheelAccum = 0; }, 220);
    if (wheelLocked) return;
    wheelAccum += dy;
    if (Math.abs(wheelAccum) > 40) {
      cycle(Math.sign(wheelAccum), false);
      wheelLocked = true;
      wheelAccum = 0;
    }
  }, { passive: false });

  // Keyboard
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      cycle(e.key === 'ArrowDown' ? 1 : -1, true);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const items = [...pages[state.active].track.children];
      const i = items.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      const j = clamp(0, items.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1));
      items[j].focus({ preventScroll: true });
    }
  });

  // Keep the focused icon in view.
  panel.addEventListener('focusin', (e) => {
    const btn = e.target.closest('.item');
    if (!btn) return;
    const pg = pages[+btn.dataset.page];
    const left = TRACK_PAD + +btn.dataset.index * PITCH;
    const right = left + ITEM_W;
    const w = barRect().w;
    const x = pg.x.goal;
    let to = x;
    if (left + x < TRACK_PAD) to = TRACK_PAD - left;
    else if (right + x > w - TRACK_PAD) to = w - TRACK_PAD - right;
    if (to !== x) springTo(pg.x, clamp(pg.lo, pg.hi, to), { damping: 1, response: 0.35 });
  });

  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (popOpen) closePop(true);
    else if (state.open) close(true);
  });

  // Tap outside closes (a tap, not a page scroll).
  // Only the topmost layer is dismissed: the popover first, then the bar.
  document.addEventListener('click', (e) => {
    if (pop.contains(e.target)) return; // a pick inside the popover is handled there
    if (popOpen) {
      if (!pop.contains(e.target) && !titlesEl.contains(e.target)) closePop(false);
      return;
    }
    if (!state.open) return;
    if (dock.contains(e.target) || e.target.closest('.seg')) return;
    close(false);
  });

  // ---------------------------------------------------------------------------
  // Menu switcher popover — tap the title to jump to another menu
  // ---------------------------------------------------------------------------
  const popP = value(0, 0.001);
  let popOpen = false;
  let popSize = { w: 0, h: 0 };

  function buildPop() {
    const rows = [];
    for (let d = 1; d < N; d++) {
      const idx = (state.active + d) % N; // the other menus, in cycle order
      const menu = MENUS[idx];
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'pop-row';
      row.setAttribute('role', 'menuitem');
      row.dataset.index = idx;
      const text = document.createElement('span');
      const name = document.createElement('b');
      name.textContent = menu.name;
      const count = document.createElement('small');
      count.textContent = `${menu.items.length} items`;
      text.append(name, count);
      row.append(glassIcon(menu.glyph), text);
      rows.push(row);
    }
    pop.replaceChildren(...rows);
    popSize = { w: pop.offsetWidth, h: pop.offsetHeight };
  }

  function openPop(viaKeyboard) {
    if (popOpen || !state.open) return;
    popOpen = true;
    buildPop();
    pop.inert = false;
    titlesEl.setAttribute('aria-expanded', 'true');
    dock.classList.add('pop-open');
    springTo(popP, 1, { damping: 1, response: 0.32 }); // a menu that just appears doesn't bounce
    if (viaKeyboard) {
      render();
      pop.firstElementChild.focus({ preventScroll: true });
    }
  }

  function closePop(returnFocus) {
    if (!popOpen) return;
    const hadFocus = pop.contains(document.activeElement);
    popOpen = false;
    pop.inert = true;
    titlesEl.setAttribute('aria-expanded', 'false');
    dock.classList.remove('pop-open');
    springTo(popP, 0, { damping: 1, response: 0.26 });
    if ((returnFocus || hadFocus) && state.open) titlesEl.focus({ preventScroll: true });
  }

  // Sits above the title and scales out of it, so it reads as coming from the title.
  function renderPop(reduced, bar) {
    const q = popP.get();
    if (q < 0.005 && popP.goal === 0) {
      pop.style.visibility = 'hidden';
      return;
    }
    const pg = pages[state.active];
    const tx = titleX(pg, bar.w);
    const anchorX = bar.x + tx + pg.titleW / 2;
    const anchorY = bar.y + 6 + HEAD_H / 2;
    const left = clamp(
      BAR_EDGE,
      viewW() - popSize.w - BAR_EDGE,
      mix(bar.x + tx - 8, anchorX - popSize.w / 2, titleCentering())
    );
    const top = bar.y - POP_GAP - popSize.h;
    pop.style.visibility = 'visible';
    pop.style.opacity = smoothstep(0, 0.6, q);
    pop.style.transformOrigin = `${anchorX - left}px ${anchorY - top}px`;
    pop.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${reduced ? 1 : mix(0.3, 1, q)})`;
  }

  titlesEl.addEventListener('click', (e) => {
    if (popOpen) closePop(e.detail === 0);
    else openPop(e.detail === 0);
  });

  pop.addEventListener('click', (e) => {
    const row = e.target.closest('.pop-row');
    if (!row) return;
    const viaKeyboard = e.detail === 0;
    closePop(false);
    showMenu(+row.dataset.index, viaKeyboard);
  });

  pop.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const rows = [...pop.children];
    const i = rows.indexOf(document.activeElement);
    rows[wrap(0, rows.length, i + (e.key === 'ArrowDown' ? 1 : -1))].focus({ preventScroll: true });
  });

  pop.addEventListener('focusout', (e) => {
    const to = e.relatedTarget;
    if (to && !pop.contains(to) && to !== titlesEl) closePop(false);
  });

  // ---------------------------------------------------------------------------
  // Toast — completion feedback for an icon tap
  // ---------------------------------------------------------------------------
  let toastTimer = 0;
  function showToast(item) {
    const text = document.createElement('span');
    text.textContent = item.label;
    toastEl.replaceChildren(glassIcon(item), text);
    toastEl.classList.remove('show');
    void toastEl.offsetWidth; // restart the transition
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
  }

  // ---------------------------------------------------------------------------
  // Segmented toggles (radio groups): icon shape and menu width
  // ---------------------------------------------------------------------------
  function segmented(el, key, apply) {
    const buttons = [...el.querySelectorAll('button')];
    const select = (val, opts) => {
      for (const b of buttons) {
        const on = b.dataset[key] === val;
        b.setAttribute('aria-checked', on);
        b.tabIndex = on ? 0 : -1;
      }
      apply(val, opts);
    };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) select(b.dataset[key]);
    });
    el.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const i = buttons.findIndex((b) => b.getAttribute('aria-checked') === 'true');
      const next = buttons[(i + 1) % buttons.length];
      select(next.dataset[key]);
      next.focus();
    });
    return select;
  }

  const setShape = segmented(toggle, 'shape', (shape, { animated = true, persist = true } = {}) => {
    root.dataset.shape = shape;
    const t = shape === 'circle' ? 1 : 0;
    if (animated) springTo(shapeT, t, { damping: 1, response: 0.4 });
    else place(shapeT, t);
    if (persist) store.set('bms.shape', shape);
  });

  const setWidth = segmented(widthToggle, 'width', (mode, { animated = true, persist = true } = {}) => {
    root.dataset.width = mode;
    const t = mode === 'full' ? 1 : 0;
    if (animated) springTo(widthT, t, { damping: 1, response: 0.42 });
    else place(widthT, t);
    measure({ animate: animated });
    if (persist) store.set('bms.width', mode);
  });

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  function placeFabInitially() {
    const b = fabBounds();
    const saved = store.get('bms.fab');
    // First visit: bottom center, where the bar itself will open.
    const x = saved ? saved.x * viewW() : (viewW() - FAB) / 2;
    const y = saved ? saved.y * innerHeight : b.maxY;
    place(fabX, clamp(b.minX, b.maxX, x));
    place(fabY, clamp(b.minY, b.maxY, y));
  }

  function onViewportChange() {
    measure();
    const b = fabBounds();
    place(fabX, clamp(b.minX, b.maxX, fabX.goal));
    place(fabY, clamp(b.minY, b.maxY, fabY.goal));
    invalidate();
  }

  addEventListener('resize', onViewportChange);
  // A scrollbar appearing or disappearing changes the visible width without a resize event.
  new ResizeObserver(onViewportChange).observe(document.documentElement);

  reduceMotion.addEventListener?.('change', invalidate);
  document.fonts?.ready.then(() => { measure(); invalidate(); });

  setShape(root.dataset.shape === 'circle' ? 'circle' : 'square', { animated: false, persist: false });
  setWidth(root.dataset.width === 'full' ? 'full' : 'fit', { animated: false, persist: false });
  placeFabInitially();
  setActive(0, { announce: false });
  render();
  dock.classList.add('is-ready');
})();
