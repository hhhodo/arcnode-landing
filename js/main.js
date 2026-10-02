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
    units = Array.prototype.slice.call(title.querySelectorAll('.char, .pill, .img-slot--statement'));
  })();

  function clamp(v) { return Math.min(1, Math.max(0, v)); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* 단계별 구간 (전체 스크롤 진행도 0~1) */
  var P = { img: [0, 0.10], grow: [0.10, 0.45], lift: [0.45, 0.65], text: [0.58, 0.92] };
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
    centerText.style.opacity = (1 - clamp(tGrow * 3)).toFixed(3);
    marquee.style.opacity = (1 - clamp(tGrow * 2.2)).toFixed(3);
    marquee.style.transform = 'translate3d(0,' + (-e * 90).toFixed(1) + 'px,0)';

    var tLift = easeInOut(seg(p, P.lift));
    reveal.style.transform = 'translate3d(0,' + (-tLift * 100).toFixed(2) + '%,0)';
    reveal.style.visibility = tLift >= 1 ? 'hidden' : 'visible';

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
  function onResize() { measure(); render(); }

  /* 폰트가 로드된 뒤 글자 크기가 바뀔 수 있으므로 다시 측정 */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  onResize();

  /* "기술소개" 앵커 — 핀 고정 장면의 끝(문장이 모두 모인 지점)으로 이동 */
  document.querySelectorAll('[data-scene-end]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      var y = scene.getBoundingClientRect().top + window.pageYOffset + g.dist * 0.95;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();
