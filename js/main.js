/* ARCNODE — scroll scene
   1) 육각형 3개: 스크롤하면 이미지가 보인다
   2) 가운데 육각형이 커지며 뒤 배경이 드러난다
   3) 배경이 엘리베이터처럼 위로 올라가며 아래의 검정 그라데이션이 드러난다
   4) 검은 배경에서 두 번째 섹션 글자가 하나씩 날아온다
   prefers-reduced-motion 이면 html.js 가 제거되어 정적 레이아웃으로 표시된다. */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('js')) return;

  var scene = document.getElementById('scene');
  var stage = scene.querySelector('.stage');
  var reveal = scene.querySelector('.reveal');
  var center = scene.querySelector('.hex--center');
  var centerText = center.querySelector('.hex__text');
  var sides = scene.querySelectorAll('.hex--side');
  var marquee = scene.querySelector('.marquee');
  var title = scene.querySelector('.statement__title');
  var hexSlot = scene.querySelector('.img-slot--statement');
  var fadePx = parseFloat(getComputedStyle(root).getPropertyValue('--fg-reveal-fade')) || 300;
  var vid = scene.querySelector('.statement__video');

  /* 영상은 스크롤과 무관하게 무한 반복 재생 (화면 밖에서는 일시정지) */
  var heroVid = reveal.querySelector('.reveal__video');
  var videos = [vid, heroVid].filter(Boolean);
  var inView = true;
  function play(v) { var r = v.play(); if (r && r.catch) r.catch(function () {}); }
  videos.forEach(function (v) { v.muted = true; play(v); });

  /* 양옆 육각형(code, cloud) — 히어로 영상이 창문처럼 비쳐 보이도록 같은 영상 프레임을 캔버스에 그림.
     육각형 위치에 해당하는 영역만 잘라 그리므로 가운데 육각형·전체 배경과 정확히 이어진다 */
  var canvases = Array.prototype.slice.call(scene.querySelectorAll('.hex__canvas'));
  var sidesOn = true, looping = false;
  function sizeCanvases() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvases.forEach(function (c) {
      var w = c.offsetWidth, h = c.offsetHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    });
  }
  function drawHexes() {
    if (!heroVid || heroVid.readyState < 2 || !heroVid.videoWidth) return;
    var s = stage.getBoundingClientRect();
    var sc = Math.max(s.width / heroVid.videoWidth, s.height / heroVid.videoHeight);
    var ox = (s.width - heroVid.videoWidth * sc) / 2;
    var oy = (s.height - heroVid.videoHeight * sc) / 2;
    canvases.forEach(function (c) {
      var r = c.getBoundingClientRect();
      var ctx = c.getContext('2d');
      ctx.drawImage(heroVid,
        (r.left - s.left - ox) / sc, (r.top - s.top - oy) / sc, r.width / sc, r.height / sc,
        0, 0, c.width, c.height);
    });
  }
  function loop() {
    if (!inView) { looping = false; return; }
    if (sidesOn) drawHexes();
    requestAnimationFrame(loop);
  }
  function startLoop() { if (!looping) { looping = true; requestAnimationFrame(loop); } }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        inView = e.isIntersecting;
        videos.forEach(function (v) { if (inView) play(v); else v.pause(); });
        if (inView) startLoop();
      });
    }).observe(scene);
  }

  /* 글자 분리 — 스크린리더는 h2 의 aria-label 을 읽는다 */
  var units = [];
  (function split() {
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split('').forEach(function (ch) {
            if (!ch.trim()) { frag.appendChild(document.createTextNode(ch)); return; }
            var span = document.createElement('span');
            span.className = 'char';
            span.setAttribute('aria-hidden', 'true');
            span.textContent = ch;
            frag.appendChild(span);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    }
    title.querySelectorAll('.statement__text').forEach(walk);
    units = Array.prototype.slice.call(title.querySelectorAll('.char, .pill'));
  })();

  function clamp(v) { return Math.min(1, Math.max(0, v)); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* 단계별 구간 (전체 스크롤 진행도 0~1) */
  var P = { img: [0, 0.09], grow: [0.09, 0.40], lift: [0.40, 0.56], hex: [0.57, 0.70], text: [0.68, 0.96] };
  function seg(p, r) { return clamp((p - r[0]) / (r[1] - r[0])); }

  var g = {};
  function measure() {
    var s = stage.getBoundingClientRect();
    var c = center.getBoundingClientRect();
    g.vw = s.width;
    g.vh = s.height;
    g.cx = c.left - s.left + c.width / 2;
    g.cy = c.top - s.top + c.height / 2;
    g.w = c.width;
    g.h = c.height;
    /* 가운데 육각형(꼭짓점이 위/아래인 정육각형)이 화면 전체를 덮는 배율 */
    var dx = Math.max(g.cx, g.vw - g.cx);
    var dy = Math.max(g.cy, g.vh - g.cy);
    g.max = Math.max(2 * dy / g.h + dx / g.w, 2 * dx / g.w) * 1.06;
    g.dist = scene.offsetHeight - window.innerHeight;
  }

  function hexPath(s) {
    var hw = g.w * s / 2, hh = g.h * s / 2, q = g.h * s / 4;
    var x = g.cx, y = g.cy;
    return 'polygon(' + [
      [x, y - hh], [x + hw, y - q], [x + hw, y + q],
      [x, y + hh], [x - hw, y + q], [x - hw, y - q]
    ].map(function (pt) { return pt[0].toFixed(1) + 'px ' + pt[1].toFixed(1) + 'px'; }).join(',') + ')';
  }

  function render() {
    var top = scene.getBoundingClientRect().top;
    var p = clamp(-top / g.dist);

    var tImg = seg(p, P.img);
    stage.style.setProperty('--img', tImg.toFixed(3));

    var tGrow = seg(p, P.grow);
    var e = easeInOut(tGrow);
    var s = Math.exp(Math.log(g.max) * e);
    reveal.style.clipPath = hexPath(s);

    sides.forEach(function (el, i) {
      var dir = i === 0 ? -1 : 1;
      el.style.transform = 'translate3d(' + (dir * e * g.vw * 0.45).toFixed(1) + 'px,0,0)';
      el.style.opacity = (1 - clamp(e * 1.8)).toFixed(3);
    });
    sidesOn = e < 0.55;
    centerText.style.opacity = (1 - clamp(tGrow * 3)).toFixed(3);
    marquee.style.opacity = (1 - clamp(tGrow * 2.2)).toFixed(3);
    marquee.style.transform = 'translate3d(0,' + (-e * 90).toFixed(1) + 'px,0)';

    var tLift = easeInOut(seg(p, P.lift));
    reveal.style.transform = 'translate3d(0,' + (-tLift * 100).toFixed(2) + '%,0)';
    /* 올라가는 배경의 아랫단을 그라데이션으로 흐려 뚝 끊기지 않게 함 */
    reveal.style.setProperty('--reveal-fade', (Math.min(1, tLift * 6) * fadePx).toFixed(1) + 'px');
    reveal.style.visibility = tLift >= 1 ? 'hidden' : 'visible';
    /* 배경이 화면 밖으로 올라가면 히어로 영상은 멈춰서 디코딩을 아낌 */
    if (heroVid && inView) {
      if (tLift >= 1) { if (!heroVid.paused) heroVid.pause(); }
      else if (heroVid.paused) play(heroVid);
    }

    var tHex = easeOut(seg(p, P.hex));
    hexSlot.style.transform = 'scale(' + tHex.toFixed(4) + ')';
    hexSlot.style.visibility = tHex <= 0 ? 'hidden' : 'visible';
    var tText = seg(p, P.text);
    var n = units.length;
    var dur = 0.3;
    var step = n > 1 ? (1 - dur) / (n - 1) : 0;
    for (var i = 0; i < n; i++) {
      var t = easeOut(clamp((tText - i * step) / dur));
      var u = units[i];
      if (t >= 1) { u.style.transform = ''; u.style.opacity = ''; continue; }
      var side = i % 2 ? 1 : -1;
      var dx = side * (140 + (i * 37) % 180) * (1 - t);
      var dy = (180 + (i * 53) % 140) * (1 - t);
      var rot = (((i * 29) % 50) - 25) * (1 - t);
      u.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) rotate(' + rot.toFixed(1) + 'deg) scale(' + (0.6 + 0.4 * t).toFixed(3) + ')';
      u.style.opacity = t.toFixed(3);
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; render(); });
  }
  function onResize() { measure(); sizeCanvases(); render(); }

  /* 폰트가 로드된 뒤 글자 크기가 바뀔 수 있으므로 다시 측정 */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  onResize();
  startLoop();

  /* "기술소개" 앵커 — 핀 고정 장면의 끝(문장이 모두 모인 지점)으로 이동 */
  document.querySelectorAll('[data-scene-end]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      var y = scene.getBoundingClientRect().top + window.pageYOffset + g.dist * 0.95;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();

/* ARCNODE — principles 카드 스쳐지나가기 + stats 제자리 교체 */
(function () {
  if (!document.documentElement.classList.contains('js')) return;

  var cards = Array.prototype.slice.call(document.querySelectorAll('.principles .card'));
  var stats = document.querySelector('.stats');
  var layers = stats ? Array.prototype.slice.call(stats.querySelectorAll('.stat')) : [];
  var SWEEP = 140; /* 카드가 중앙 이미지 쪽으로 스치는 최대 이동량(px) */

  function clamp(v) { return Math.min(1, Math.max(0, v)); }

  function renderCards() {
    var vh = window.innerHeight;
    var on = window.innerWidth > 1024;
    cards.forEach(function (card) {
      if (!on) { card.style.transform = ''; return; }
      var r = card.getBoundingClientRect();
      /* 0: 화면 아래에서 등장, 1: 화면 위로 퇴장 */
      var t = clamp((vh - r.top) / (vh + r.height));
      var shift = 1 - Math.abs(t - 0.5) * 2;           /* 중간 지점에서 최대 */
      var dir = card.classList.contains('card--a') ? 1 : -1; /* 왼쪽 카드는 →, 오른쪽 카드는 ← */
      var eased = shift * shift * (3 - 2 * shift);
      card.style.transform = 'translate3d(' + (dir * eased * SWEEP).toFixed(1) + 'px,0,0)';
    });
  }

  function renderStats() {
    if (!stats) return;
    var dist = stats.offsetHeight - window.innerHeight;
    var p = clamp(-stats.getBoundingClientRect().top / dist);
    var n = layers.length;
    layers.forEach(function (el, i) {
      var d = p * n - (i + 0.5);
      var a = Math.abs(d);
      var op = a <= 0.3 ? 1 : a >= 0.7 ? 0 : 1 - (a - 0.3) / 0.4;
      if (i === 0 && d < 0) op = 1;
      if (i === n - 1 && d > 0) op = 1;
      var ty = ((i === 0 && d < 0) || (i === n - 1 && d > 0)) ? 0 : -d * 70;
      el.style.opacity = op.toFixed(3);
      el.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0)';
      el.style.visibility = op <= 0 ? 'hidden' : 'visible';
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; renderCards(); renderStats(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  renderCards();
  renderStats();
})();

/* ARCNODE — Principles 중앙 SVG: 스크롤하면 바깥에서 안으로 라인이 한 줄씩 그려지고 면이 채워짐 */
(function () {
  if (!document.documentElement.classList.contains('js')) return;
  var slot = document.querySelector('[data-spiral]');
  var section = document.querySelector('.principles');
  if (!slot || !section || !window.fetch) return;

  var s1 = null, s2 = null, lines = [], us = [], lastP = -1;
  var FEATHER = 0.14; /* 면이 번지는 폭(반지름 비율) */
  var SPREAD = 0.25;  /* 한 줄이 그려지는 데 쓰는 진행 구간 */
  var LAST = 0.75;    /* 가장 안쪽 줄이 시작되는 지점 */

  function clamp(v) { return Math.min(1, Math.max(0, v)); }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function render() {
    if (!s1) return;
    var r = section.getBoundingClientRect();
    var vh = window.innerHeight;
    /* 섹션이 화면에 들어오기 시작할 때 0 → 섹션의 70% 지점을 지날 때 1 */
    var p = ease(clamp((vh * 0.6 - r.top) / (r.height * 0.7)));
    if (p === lastP) return;
    lastP = p;

    /* 면(그라데이션): 바깥에서 안으로 */
    var pf = clamp(p / (LAST + SPREAD));
    var hole = (1 - pf) * (1 + FEATHER);
    s1.setAttribute('offset', Math.max(0, hole - FEATHER).toFixed(4));
    s2.setAttribute('offset', Math.min(1, hole).toFixed(4));

    /* 라인: 바깥쪽 줄부터 끝에서 안쪽으로 한 줄씩 그려짐 */
    for (var i = 0; i < lines.length; i++) {
      var prog = clamp((p - us[i] * LAST) / SPREAD);
      lines[i].setAttribute('stroke-dashoffset', (1 - prog).toFixed(3));
    }
  }

  fetch('assets/spiral.svg').then(function (res) { return res.text(); }).then(function (txt) {
    slot.innerHTML = txt;
    var svg = slot.querySelector('svg');
    s1 = svg.querySelector('.spiral__s1');
    s2 = svg.querySelector('.spiral__s2');
    lines = Array.prototype.slice.call(svg.querySelectorAll('.spiral__ln'));
    us = lines.map(function (l) { return parseFloat(l.getAttribute('data-u')); });
    render();
  }).catch(function () { /* 실패 시 <img> 정적 SVG 유지 */ });

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; render(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();
