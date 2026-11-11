(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement, body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---- ローダー ---- */
  const start = () => {
    if (body.classList.contains('ready')) return;
    body.classList.add('ready');
    $$('.hero .rv, .hero .pop, #heroTitle .mask').forEach(el => el.classList.add('in'));
  };
  if (reduce || !$('#loader')) start();
  else {
    const bar = $('#loaderBar'), n = $('#loaderN'), t0 = performance.now(), dur = 1500;
    let loaded = document.readyState === 'complete';
    addEventListener('load', () => loaded = true);
    (function tick(t) {
      let p = clamp((t - t0) / dur, 0, 1);
      if (!loaded && t - t0 < 4000) p = Math.min(p, .86);
      else if (!loaded) loaded = true;
      const e = 1 - Math.pow(1 - p, 3);
      bar.style.transform = `scaleX(${e})`;
      n.textContent = String(Math.round(e * 100)).padStart(3, '0');
      if (p < 1) requestAnimationFrame(tick); else setTimeout(start, 160);
    })(t0);
    setTimeout(start, 6000);
  }

  /* ---- スクロールで出現 ---- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  $$('.rv, .pop, .steps').forEach(el => { if (!el.closest('.hero')) io.observe(el); });

  /* ---- 数字のカウントアップ ---- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.to; cio.unobserve(el);
    if (reduce) return;
    const t0 = performance.now();
    (function tick(t) {
      const p = clamp((t - t0) / 1600, 0, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }), { threshold: .6 });
  $$('.count').forEach(el => cio.observe(el));

  /* ---- メニュー ---- */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    body.style.overflow = open ? 'hidden' : '';
    $$('main, footer').forEach(el => el.inert = open);
  };
  burger.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 1121px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ---- 選ばれる理由:縦スクロールに連動して横へ流す ---- */
  const gal = $('#reasons'), track = $('#galTrack'), scroller = $('#galScroller'), galBar = $('#galBar');
  let travel = 0, pinned = false;
  const layoutGal = () => {
    if (!gal) return;
    const want = !reduce && fine && innerWidth > 1000 && innerHeight > 620;
    gal.classList.toggle('pinned', want);
    pinned = want;
    if (!want) { gal.style.height = ''; track.style.transform = ''; galBar.style.transform = ''; return; }
    travel = Math.max(0, track.scrollWidth - innerWidth);
    gal.style.height = `${innerHeight + travel}px`;
  };
  if (scroller) scroller.addEventListener('scroll', () => {
    if (pinned) return;
    const m = scroller.scrollWidth - scroller.clientWidth;
    galBar.style.transform = `scaleX(${.2 + .8 * (m ? scroller.scrollLeft / m : 0)})`;
  }, { passive: true });

  /* ---- スクロール連動(1フレームに1回) ---- */
  const hd = $('#hd'), prog = $('#prog');
  const pars = $$('[data-par]').map(el => ({ el, k: +el.dataset.par }));
  let lastY = scrollY, ticking = false;
  const onFrame = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    const max = root.scrollHeight - vh;
    prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    hd.classList.toggle('solid', y > 40);
    if (!body.classList.contains('menu-open')) hd.classList.toggle('hide', y > lastY && y > 400);
    lastY = y;
    if (pinned) {
      const p = clamp(-gal.getBoundingClientRect().top / (travel || 1), 0, 1);
      track.style.transform = `translate3d(${-p * travel}px,0,0)`;
      galBar.style.transform = `scaleX(${.2 + .8 * p})`;
    }
    if (reduce) return;
    for (const { el, k } of pars) {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const d = (r.top + r.height / 2) - vh / 2;
      el.style.translate = `0 ${(d * k).toFixed(1)}px`;
    }
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { layoutGal(); req(); });
  addEventListener('load', () => { layoutGal(); req(); });
  layoutGal(); req();

  /* ---- カーソルと磁石ボタン ---- */
  if (fine && !reduce) {
    const cur = $('#cur'); let cx = 0, cy = 0, tx = 0, ty = 0, run = false;
    const loop = () => {
      cx += (tx - cx) * .2; cy += (ty - cy) * .2;
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > .2) requestAnimationFrame(loop); else run = false;
    };
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      if (!cur.classList.contains('on')) { cx = tx; cy = ty; cur.classList.add('on'); }
      cur.classList.toggle('big', !!e.target.closest('a,button,.tile,.svc'));
      if (!run) { run = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => cur.classList.remove('on'));
    addEventListener('pointerdown', () => cur.classList.add('down'));
    addEventListener('pointerup', () => cur.classList.remove('down'));
    $$('[data-mag]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${((e.clientX - r.left) / r.width - .5) * 14}px ${((e.clientY - r.top) / r.height - .5) * 10}px`;
      });
      el.addEventListener('pointerleave', () => el.style.translate = '');
    });
  }

  /* ---- メールアドレスのコピー ---- */
  const copyBtn = $('#copyBtn'), mailText = $('#mailText');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const done = () => { copyBtn.textContent = 'コピーしました'; setTimeout(() => copyBtn.textContent = 'コピー', 2200); };
    const select = () => { const r = document.createRange(); r.selectNodeContents(mailText); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(mailText.textContent).then(done, select); } catch (_) { select(); }
  });

  /* ---- ヒーロー背景:等高線のように流れるデータの線 ---- */
  const cv = $('#field');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d'); let w = 0, h = 0, dpr = 1, vis = true, t = 0, raf = 0;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const yAt = (x, i, n) => {
      const base = h * (.16 + .8 * i / n);
      return base
        + Math.sin(x * .0021 + t * .35 + i * .42) * 34
        + Math.sin(x * .0058 - t * .22 + i * 1.3) * 12
        + Math.cos(x * .0009 + t * .12 + i * .2) * 46;
    };
    const draw = () => {
      raf = 0; if (!vis) return;
      t += .008; ctx.clearRect(0, 0, w, h);
      const n = w < 700 ? 9 : 15;
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += 16) { const y = yAt(x, i, n); x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.strokeStyle = `rgba(157,181,168,${.16 + .22 * Math.abs(Math.sin(i * .9))})`;
        ctx.lineWidth = 1; ctx.stroke();
        const px = ((t * 46 * (1 + (i % 4) * .35) + i * 331) % (w + 80)) - 40;
        ctx.beginPath(); ctx.rect(px - 2.5, yAt(px, i, n) - 2.5, 5, 5);
        ctx.fillStyle = 'rgba(111,143,128,.8)'; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) raf = requestAnimationFrame(draw); }).observe(cv);
    addEventListener('resize', size); size(); raf = requestAnimationFrame(draw);
  }
})();
