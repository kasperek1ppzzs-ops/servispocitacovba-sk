(function () {
  'use strict';
  var hero = document.querySelector('.hero');
  var rig = document.getElementById('hero-rig');
  var progress = document.getElementById('reading-progress');
  var mobileAction = document.querySelector('.mobile-action');
  var contact = document.getElementById('kontakt');
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = motionQuery.matches;
  var frame = 0;
  var pointerX = 0;
  var pointerY = 0;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function paint() {
    frame = 0;
    var top = window.scrollY || document.documentElement.scrollTop;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (scrollable > 0 ? clamp(top / scrollable, 0, 1) * 100 : 0) + '%';
    if (hero && rig) {
      var assembly = reduced ? 0 : clamp(top / (hero.offsetHeight * .72), 0, 1);
      rig.style.setProperty('--assembly', assembly.toFixed(4));
      rig.style.transform = reduced ? 'none' : 'perspective(1200px) rotateX(' + pointerY.toFixed(2) + 'deg) rotateY(' + pointerX.toFixed(2) + 'deg) translateY(' + (assembly * -30).toFixed(1) + 'px)';
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
    function ready() { if (asset && asset.naturalWidth > 0) { rig.classList.add('motion-ready'); schedule(); } }
    if (asset && asset.complete) ready();
    else if (asset) asset.addEventListener('load', ready, { once: true });
  }
  if (hero) {
    hero.addEventListener('pointermove', function (event) {
      if (reduced || !finePointer.matches) return;
      var bounds = hero.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / bounds.width - .5) * 4;
      pointerY = -((event.clientY - bounds.top) / bounds.height - .5) * 3;
      schedule();
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { pointerX = 0; pointerY = 0; schedule(); }, { passive: true });
  }
  function updatePreference(event) { reduced = event.matches; pointerX = 0; pointerY = 0; schedule(); }
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', updatePreference);
  else if (motionQuery.addListener) motionQuery.addListener(updatePreference);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
}());
