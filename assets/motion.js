(function () {
  'use strict';
  var root = document.documentElement;
  var hero = document.querySelector('.hero');
  var heroArt = document.getElementById('hero-art');
  var rig = document.getElementById('hero-rig');
  var progress = document.getElementById('reading-progress');
  var mobileAction = document.querySelector('.mobile-action');
  var contact = document.getElementById('kontakt');
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pinQuery = window.matchMedia('(min-width: 961px)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduced = motionQuery.matches;
  var frame = 0;
  var pointerX = 0;
  var pointerY = 0;
  var powered = false;
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // 0 = rozložený notebook, 1 = zložený. Na desktope je úvod pripnutý (sticky) a skladá sa
  // počas jeho prídavnej výšky; na mobile sa skladá, keď notebook prechádza stredom obrazovky.
  function assemblyProgress(top) {
    if (reduced || !hero || !rig) return 0;
    var pinned = pinQuery.matches && hero.classList.contains('is-pinned');
    if (pinned) {
      var stage = hero.querySelector('.hero-inner').offsetHeight;
      var track = hero.offsetHeight - stage;
      return track > 0 ? clamp((top - track * .08) / (track * .8), 0, 1) : 0;
    }
    var rect = rig.getBoundingClientRect();
    return clamp((window.innerHeight * .55 - rect.top) / (rect.height * .9), 0, 1);
  }

  function paint() {
    frame = 0;
    var top = window.scrollY || root.scrollTop;
    var scrollable = root.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (scrollable > 0 ? clamp(top / scrollable, 0, 1) * 100 : 0) + '%';
    if (hero && rig) {
      var assembly = ease(assemblyProgress(top));
      rig.style.setProperty('--assembly', assembly.toFixed(4));
      rig.style.setProperty('--px', (pointerX / 6).toFixed(3));
      rig.style.setProperty('--py', (pointerY / 4).toFixed(3));
      // Zložený notebook zaberá hornú časť obrázka, preto sa pri skladaní posúva k stredu.
      rig.style.transform = reduced ? 'none' : 'perspective(1200px) rotateX(' + pointerY.toFixed(2) + 'deg) rotateY(' + pointerX.toFixed(2) + 'deg) translateY(' + (assembly * 14).toFixed(2) + '%)';
      hero.classList.toggle('is-scrolled', top > 30);
      // Zapnutie: displej sa rozsvieti až po úplnom zložení, pri rozložení znova zhasne.
      var nowPowered = reduced || assembly > .97;
      if (nowPowered !== powered) {
        powered = nowPowered;
        rig.classList.toggle('is-powered', powered);
        if (heroArt) heroArt.classList.toggle('is-powered', powered);
      }
    }
    if (mobileAction && hero && contact) {
      var contactTop = contact.getBoundingClientRect().top;
      var visible = top > hero.offsetHeight * .7 && contactTop > window.innerHeight * .6;
      mobileAction.classList.toggle('is-visible', visible);
      mobileAction.inert = !visible;
      mobileAction.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }
  }
  function schedule() { if (!frame) frame = window.requestAnimationFrame(paint); }

  if (rig) {
    var asset = rig.querySelector('.laptop-composite');
    function ready() {
      if (!asset || asset.naturalWidth === 0) return;
      if (!reduced) {
        root.classList.add('motion-live');
        // Úvodný nálet dielov len pri načítaní hore na stránke; potom sa animácia odstráni,
        // aby nebránila skladaniu pri posúvaní.
        if ((window.scrollY || root.scrollTop) < 40) {
          rig.classList.add('motion-intro');
          window.setTimeout(function () { rig.classList.remove('motion-intro'); }, 1700);
        }
      }
      rig.classList.add('motion-ready');
      schedule();
    }
    if (asset && asset.complete) ready();
    else if (asset) asset.addEventListener('load', ready, { once: true });
  }
  if (hero) {
    hero.addEventListener('pointermove', function (event) {
      if (reduced || !finePointer.matches) return;
      var bounds = (heroArt || hero).getBoundingClientRect();
      pointerX = clamp((event.clientX - bounds.left) / bounds.width - .5, -.6, .6) * 12;
      pointerY = -clamp((event.clientY - bounds.top) / bounds.height - .5, -.6, .6) * 8;
      schedule();
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { pointerX = 0; pointerY = 0; schedule(); }, { passive: true });
  }
  function updatePreference(event) {
    reduced = event.matches;
    root.classList.toggle('motion-live', !reduced && Boolean(rig && rig.classList.contains('motion-ready')));
    pointerX = 0; pointerY = 0; schedule();
  }
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', updatePreference);
  else if (motionQuery.addListener) motionQuery.addListener(updatePreference);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
}());
