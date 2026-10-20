/* Servis počítačov BA — prístupné interakcie bez závislostí. */
(function () {
  'use strict';

  function start() {
    var config = window.SITE_CONFIG || {};
    var business = config.business || {};
    var formConfig = config.form || {};
    var prices = config.prices || {};
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var $ = function (selector) { return document.querySelector(selector); };
    var $$ = function (selector) { return Array.from(document.querySelectorAll(selector)); };
    var clean = function (value) { return typeof value === 'string' ? value.trim() : ''; };
    var emailIsValid = function (value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value); };
    var optionalWrappers = new Set();
    var contactSelectors = '[data-phone],[data-email],[data-address],[data-hours],[data-company-name],[data-company-id],[data-company-address]';

    function setText(selector, text) {
      $$(selector).forEach(function (element) { element.textContent = text; });
    }

    // Neznáme kontakty sa nevymýšľajú a ich prázdne kontajnery sa skryjú.
    function fillContact(selector, value, hrefPrefix) {
      $$(selector).forEach(function (element) {
        var wrapper = element.closest('[data-optional]');
        if (wrapper && wrapper !== element) optionalWrappers.add(wrapper);
        element.hidden = !value;
        if (!value) {
          element.removeAttribute('href');
          return;
        }
        element.textContent = value;
        if (hrefPrefix && element.tagName === 'A') {
          element.setAttribute('href', hrefPrefix + (hrefPrefix === 'tel:' ? value.replace(/[^+\d]/g, '') : value));
        }
      });
    }

    var contactEmail = clean(business.email);
    var contactPhone = clean(business.phone);
    fillContact('[data-phone]', /\d{3}/.test(contactPhone.replace(/\s/g, '')) ? contactPhone : '', 'tel:');
    fillContact('[data-email]', emailIsValid(contactEmail) ? contactEmail : '', 'mailto:');
    fillContact('[data-address]', clean(business.address));
    fillContact('[data-hours]', clean(business.hours));
    fillContact('[data-company-name]', clean(business.companyName));
    fillContact('[data-company-id]', clean(business.companyId));
    fillContact('[data-company-address]', clean(business.companyAddress));
    // Jeden kontajner môže obsahovať viac voliteľných polí, napríklad údaje firmy.
    optionalWrappers.forEach(function (wrapper) {
      wrapper.hidden = !Array.from(wrapper.querySelectorAll(contactSelectors)).some(function (field) {
        return !field.hidden && field.textContent.trim();
      });
    });
    if (clean(business.name)) setText('[data-business-name]', clean(business.name));
    setText('[data-year]', String(new Date().getFullYear()));
    $$('[data-price]').forEach(function (element) {
      var price = prices[element.getAttribute('data-price')];
      element.textContent = typeof price === 'string' && price.trim() ? price.trim() : 'Cena po diagnostike';
    });

    // Mobilné menu ostáva použiteľné myšou, dotykom aj klávesnicou.
    var menuToggle = $('#menu-toggle');
    var mainNav = $('#main-nav');
    function closeMenu(restoreFocus) {
      if (!menuToggle || !mainNav) return;
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Otvoriť menu');
      menuToggle.classList.remove('is-open');
      mainNav.classList.remove('is-open');
      document.body.classList.remove('nav-open');
      if (restoreFocus) menuToggle.focus();
    }
    if (menuToggle && mainNav) {
      menuToggle.addEventListener('click', function () {
        var open = menuToggle.getAttribute('aria-expanded') !== 'true';
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Zavrieť menu' : 'Otvoriť menu');
        menuToggle.classList.toggle('is-open', open);
        mainNav.classList.toggle('is-open', open);
        document.body.classList.toggle('nav-open', open);
      });
      mainNav.addEventListener('click', function (event) {
        if (event.target.closest('a')) closeMenu(false);
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
      });
      document.addEventListener('click', function (event) {
        if (!mainNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu(false);
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > 720) closeMenu(false);
      }, { passive: true });
    }

    var header = $('.site-header');
    var navigationLinks = $$('[data-nav]');
    var navigationSections = navigationLinks.map(function (link) {
      var href = link.getAttribute('href');
      return href && /^#[A-Za-z][\w-]*$/.test(href) ? $(href) : null;
    });
    var scrolling = false;
    function updateScrollState() {
      scrolling = false;
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
      var currentId = '';
      navigationSections.forEach(function (section) {
        if (section && section.getBoundingClientRect().top <= 180) currentId = section.id;
      });
      navigationLinks.forEach(function (link) {
        var active = link.getAttribute('href') === '#' + currentId;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    window.addEventListener('scroll', function () {
      if (!scrolling) {
        scrolling = true;
        window.requestAnimationFrame(updateScrollState);
      }
    }, { passive: true });
    updateScrollState();

    // .reveal musí byť čitateľné aj bez JavaScriptu; pohyb je len vylepšenie.
    var revealElements = $$('.reveal');
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      revealElements.forEach(function (element) { revealObserver.observe(element); });
    } else {
      revealElements.forEach(function (element) { element.classList.add('is-visible'); });
    }

    var form = $('#repair-form');
    var serviceField = form && form.elements.namedItem('service');
    var problemField = form && form.elements.namedItem('problem');
    var allowedServices = ['oprava', 'upgrade', 'cistenie', 'data', 'ine'];
    var allowedDevices = ['notebook', 'pc', 'mac', 'ine'];
    var problemOptions = {
      nezapne: {
        title: 'Keď sa nič nedeje.',
        copy: 'Nereaguje na tlačidlo, nenabíja sa alebo zostáva obrazovka čierna? Príčinu môže mať napájanie aj samotný hardvér. Začneme diagnostikou.',
        services: 'Diagnostika · Napájanie · Oprava hardvéru',
        service: 'oprava',
        part: 'board',
        text: 'Počítač sa nezapína alebo nenabíja. '
      },
      pomaly: {
        title: 'Menej čakania. Viac výkonu.',
        copy: 'Pomalý štart, zasekávanie či dlhé otváranie programov? Pozrieme sa na stav disku, pamäte a systému a navrhneme vhodné zrýchlenie.',
        services: 'SSD a RAM · Optimalizácia systému · Upgrade',
        service: 'upgrade',
        part: 'board',
        text: 'Počítač je pomalý a chcem preveriť možnosti zrýchlenia. '
      },
      teplo: {
        title: 'Doprajte technike vydýchnuť.',
        copy: 'Hlučný ventilátor, horúci notebook alebo samovoľné vypínanie môžu súvisieť s chladením. Skontrolujeme ventilátory, zanesenie a prenos tepla.',
        services: 'Čistenie · Chladenie · Kontrola teplôt',
        service: 'cistenie',
        part: 'board',
        text: 'Počítač sa prehrieva alebo je nezvyčajne hlučný. '
      },
      data: {
        title: 'Vaše súbory sú dôležité.',
        copy: 'Potrebujete preniesť súbory, zálohovať disk alebo preveriť možnosti obnovy? Najskôr posúdime stav média a dohodneme bezpečný ďalší postup.',
        services: 'Zálohovanie · Prenos súborov · Posúdenie obnovy dát',
        service: 'data',
        part: 'base',
        text: 'Potrebujem pomoc so zálohou, prenosom alebo obnovou dát. '
      }
    };
    var selectedProblem = 'nezapne';
    var problemButtons = $$('[data-problem]');
    var problemCta = $('#problem-cta');

    function selectProblem(key) {
      if (!Object.prototype.hasOwnProperty.call(problemOptions, key)) return;
      selectedProblem = key;
      var option = problemOptions[key];
      problemButtons.forEach(function (button) {
        var selected = button.getAttribute('data-problem') === key;
        button.setAttribute('aria-pressed', String(selected));
        button.classList.toggle('is-active', selected);
        button.classList.toggle('is-selected', selected);
      });
      setText('#problem-title', option.title);
      setText('#problem-copy', option.copy);
      setText('#problem-services', option.services);
      $$('[data-active-problem]').forEach(function (element) { element.setAttribute('data-active-problem', key); });
      $$('[data-part]').forEach(function (element) {
        var highlighted = element.getAttribute('data-part') === option.part;
        element.setAttribute('data-highlight', String(highlighted));
      });
      if (problemCta) problemCta.setAttribute('data-selected-service', option.service);
    }
    problemButtons.forEach(function (button) {
      button.addEventListener('click', function () { selectProblem(button.getAttribute('data-problem')); });
    });
    if (problemButtons.length) {
      var initialProblem = problemButtons.find(function (button) { return button.getAttribute('aria-pressed') === 'true'; });
      selectProblem(initialProblem ? initialProblem.getAttribute('data-problem') : selectedProblem);
    }

    function chooseService(service, suggestedProblem) {
      if (serviceField && allowedServices.indexOf(service) !== -1) {
        serviceField.value = service;
        serviceField.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (problemField && suggestedProblem && !problemField.value.trim()) {
        problemField.value = suggestedProblem;
        problemField.setCustomValidity('');
        problemField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      var contact = $('#kontakt');
      closeMenu(false);
      if (contact) contact.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      if (problemField) problemField.focus({ preventScroll: true });
    }
    if (problemCta) problemCta.addEventListener('click', function (event) {
      event.preventDefault();
      var option = problemOptions[selectedProblem];
      chooseService(option.service, option.text);
    });
    $$('[data-service]').forEach(function (element) {
      element.addEventListener('click', function (event) {
        event.preventDefault();
        chooseService(element.getAttribute('data-service'));
      });
    });

    if (!form) return;

    var status = $('#form-status');
    var submit = $('#form-submit') || form.querySelector('[type="submit"]');
    var submitLabel = submit && (submit.querySelector('[data-submit-label]') || submit);
    var result = $('#request-result');
    var resultTitle = $('#request-result-title');
    var preview = $('#request-preview');
    var copyButton = $('#copy-request');
    var downloadButton = $('#download-request');
    var latestRequest = '';
    var submitting = false;
    var selectedMode = ['draft', 'mailto', 'server', 'web3forms'].indexOf(formConfig.mode) !== -1 ? formConfig.mode : 'draft';
    if (selectedMode === 'mailto' && !emailIsValid(contactEmail)) selectedMode = 'draft';
    // Web3Forms potrebuje prístupový kľúč (UUID); bez neho formulár nič nesľubuje a len pripraví text.
    var web3formsKey = clean(formConfig.accessKey);
    if (selectedMode === 'web3forms' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(web3formsKey)) selectedMode = 'draft';
    var sendsOnline = selectedMode === 'server' || selectedMode === 'web3forms';
    var submitText = sendsOnline ? 'Odoslať požiadavku' : selectedMode === 'mailto' ? 'Pokračovať do e-mailu' : 'Pripraviť požiadavku';
    if (submitLabel) submitLabel.textContent = submitText;
    setText('#form-mode-note', sendsOnline ? 'Požiadavku odošleme servisu. Kópiu si môžete uložiť.' : selectedMode === 'mailto' ? 'Po kontrole otvoríte požiadavku vo svojom e-mailovom programe.' : 'Formulár pripraví text vašej požiadavky. Zatiaľ ho neodosiela.');

    function showStatus(message, state) {
      if (!status) return;
      status.textContent = message;
      status.setAttribute('data-state', state || 'info');
      status.classList.toggle('is-error', state === 'error');
      status.classList.toggle('is-success', state === 'success');
      status.hidden = false;
    }

    function fieldValue(name) {
      var field = form.elements.namedItem(name);
      return field && typeof field.value === 'string' ? field.value.trim() : '';
    }

    function readRequest() {
      var acknowledged = form.elements.namedItem('privacyAcknowledged');
      return {
        name: fieldValue('name'),
        email: fieldValue('email'),
        phone: fieldValue('phone'),
        device: fieldValue('device'),
        service: fieldValue('service'),
        problem: fieldValue('problem'),
        privacyAcknowledged: Boolean(acknowledged && acknowledged.checked),
        website: fieldValue('website')
      };
    }

    var deviceNames = { notebook: 'Notebook', pc: 'Stolový počítač', mac: 'Mac / MacBook', ine: 'Iné zariadenie' };
    var serviceNames = { oprava: 'Diagnostika a oprava', upgrade: 'Zrýchlenie a upgrade', cistenie: 'Čistenie a chladenie', data: 'Dáta a systém', ine: 'Potrebujem poradiť' };
    function makeRequestText(request) {
      return [
        'POŽIADAVKA NA SERVIS',
        clean(business.name) || 'Servis počítačov BA',
        '',
        'Dátum: ' + new Intl.DateTimeFormat('sk-SK', { dateStyle: 'medium', timeZone: 'Europe/Bratislava' }).format(new Date()),
        'Meno: ' + request.name,
        'E-mail: ' + request.email,
        'Telefón: ' + (request.phone || 'Neuvedený'),
        'Zariadenie: ' + (deviceNames[request.device] || request.device),
        'Služba: ' + (serviceNames[request.service] || request.service),
        '',
        'POPIS PROBLÉMU',
        request.problem,
        '',
        'Táto požiadavka sama osebe nepotvrdzuje termín ani cenu opravy.'
      ].join('\n');
    }

    function showRequest(request, focusTitle) {
      latestRequest = makeRequestText(request);
      if (preview) preview.textContent = latestRequest;
      if (result) result.hidden = false;
      if (resultTitle) {
        resultTitle.setAttribute('tabindex', '-1');
        if (focusTitle) resultTitle.focus({ preventScroll: false });
      }
    }

    function validateRequest(request) {
      var nameInput = form.elements.namedItem('name');
      var phoneInput = form.elements.namedItem('phone');
      if (nameInput) nameInput.setCustomValidity(request.name.length < 2 || request.name.length > 120 || /[\u0000-\u001f\u007f]/.test(request.name) ? 'Uveďte meno v rozsahu 2 až 120 znakov.' : '');
      if (phoneInput) phoneInput.setCustomValidity(request.phone && (request.phone.length < 6 || request.phone.length > 40 || !/^[+0-9 ().-]+$/.test(request.phone)) ? 'Skontrolujte telefónne číslo alebo nechajte pole prázdne.' : '');
      if (problemField) {
        problemField.setCustomValidity(request.problem.length < 15 ? 'Opíšte problém aspoň 15 znakmi.' : request.problem.length > 3000 ? 'Popis môže mať najviac 3 000 znakov.' : '');
      }
      if (!form.checkValidity()) {
        showStatus('Skontrolujte označené polia a doplňte potrebné údaje.', 'error');
        form.reportValidity();
        return false;
      }
      if (request.name.length < 2 || request.name.length > 120 || !emailIsValid(request.email) || request.email.length > 254 || request.phone.length > 40 || allowedDevices.indexOf(request.device) === -1 || allowedServices.indexOf(request.service) === -1 || !request.privacyAcknowledged || request.website) {
        showStatus('Skontrolujte kontaktné údaje, typ zariadenia, službu a potvrdenie o ochrane súkromia.', 'error');
        return false;
      }
      return true;
    }
    ['name', 'phone', 'problem'].forEach(function (name) {
      var field = form.elements.namedItem(name);
      if (field) field.addEventListener('input', function () { field.setCustomValidity(''); });
    });

    function setSubmitting(active) {
      submitting = active;
      form.setAttribute('aria-busy', String(active));
      if (submit) submit.disabled = active;
      if (submitLabel) submitLabel.textContent = active ? 'Odosielam…' : submitText;
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (submitting) return;
      var request = readRequest();
      if (!validateRequest(request)) return;
      showRequest(request, !sendsOnline);

      if (selectedMode === 'draft') {
        showStatus('Požiadavka je pripravená. Zatiaľ nebola odoslaná.', 'info');
        return;
      }

      if (selectedMode === 'mailto') {
        var mailto = 'mailto:' + encodeURIComponent(contactEmail) + '?subject=' + encodeURIComponent('Požiadavka na servis — ' + (deviceNames[request.device] || 'počítač')) + '&body=' + encodeURIComponent(latestRequest);
        showStatus('Požiadavka je pripravená pre váš e-mailový program. Odoslanie v ňom potvrďte; z tejto stránky zatiaľ nebola odoslaná.', 'info');
        window.location.href = mailto;
        return;
      }

      var controller;
      var timeout;
      try {
        var useWeb3forms = selectedMode === 'web3forms';
        var endpoint = new URL(useWeb3forms ? 'https://api.web3forms.com/submit' : clean(formConfig.endpoint) || 'api/contact.php', window.location.href);
        if (!useWeb3forms && (!/^https?:$/.test(endpoint.protocol) || endpoint.origin !== window.location.origin)) {
          throw new Error('unavailable');
        }
        // Prijímacia schránka je uložená len vo Web3Forms pod kľúčom, nie na tomto webe.
        var payload = useWeb3forms ? {
          access_key: web3formsKey,
          subject: 'Požiadavka na servis — ' + (deviceNames[request.device] || 'počítač'),
          from_name: clean(business.name) || 'Servis počítačov BA',
          name: request.name,
          email: request.email,
          phone: request.phone || 'Neuvedený',
          message: latestRequest
        } : request;
        setSubmitting(true);
        showStatus('Odosielame vašu požiadavku…', 'info');
        controller = new AbortController();
        timeout = window.setTimeout(function () { controller.abort(); }, 20000);
        var response = await window.fetch(endpoint.href, {
          method: 'POST',
          credentials: useWeb3forms ? 'omit' : 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        var responseData;
        try { responseData = await response.json(); } catch (parseError) { responseData = null; }
        var accepted = responseData && (useWeb3forms ? responseData.success === true : responseData.ok === true);
        if (!response.ok || !accepted) {
          var rateLimited = response.status === 429 || (responseData && responseData.code === 'rate_limited');
          showStatus(rateLimited ? 'V krátkom čase bolo odoslaných viac požiadaviek. Skúste to neskôr. Text si zatiaľ môžete stiahnuť.' : 'Odoslanie sa nepodarilo potvrdiť. Vaše údaje zostali vo formulári; požiadavku si môžete skopírovať alebo stiahnuť.', 'error');
          if (resultTitle) resultTitle.focus({ preventScroll: false });
          return;
        }
        showStatus('Požiadavka bola prijatá na odoslanie. O termíne a ďalšom postupe sa dohodneme osobitne.', 'success');
        if (resultTitle) resultTitle.focus({ preventScroll: false });
      } catch (error) {
        showStatus(error && error.name === 'AbortError' ? 'Odosielanie trvá príliš dlho a nebolo potvrdené. Požiadavka zostala pripravená na skopírovanie alebo stiahnutie.' : 'Odoslanie sa nepodarilo potvrdiť. Požiadavka zostala pripravená na skopírovanie alebo stiahnutie.', 'error');
        if (resultTitle) resultTitle.focus({ preventScroll: false });
      } finally {
        if (timeout) window.clearTimeout(timeout);
        setSubmitting(false);
      }
    });

    if (copyButton) copyButton.addEventListener('click', async function () {
      if (!latestRequest) return;
      var copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(latestRequest);
          copied = true;
        }
      } catch (error) { /* Nie každý lokálny náhľad má prístup k schránke. */ }
      if (!copied) {
        var textarea = document.createElement('textarea');
        textarea.value = latestRequest;
        textarea.setAttribute('readonly', '');
        textarea.setAttribute('aria-hidden', 'true');
        textarea.setAttribute('tabindex', '-1');
        textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(textarea);
        textarea.select();
        try { copied = Boolean(document.execCommand && document.execCommand('copy')); } catch (error) { copied = false; }
        textarea.remove();
        copyButton.focus({ preventScroll: true });
      }
      showStatus(copied ? 'Text požiadavky bol skopírovaný.' : 'Automatické kopírovanie nie je dostupné. Označte text požiadavky alebo si ju stiahnite.', copied ? 'info' : 'error');
    });

    if (downloadButton) downloadButton.addEventListener('click', function (event) {
      event.preventDefault();
      if (!latestRequest) return;
      var blob = new Blob(['\uFEFF', latestRequest], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'poziadavka-na-servis.txt';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      showStatus('Sťahovanie požiadavky bolo pripravené. Jej stiahnutie ju neodošle servisu.', 'info');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}());
