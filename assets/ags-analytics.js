/*!
 * AGS Analytics — medidor propio de las webs de AGS.
 * Responde el pedido de Joseph: "saber donde lee mas la gente y donde se queda".
 *
 * Que mide:  hasta donde baja (scroll), cuanto tiempo VISIBLE pasa en cada
 *            seccion, en que seccion se va, y que botones toca.
 * Que NO guarda: nada personal. Sin cookies, sin nombres, sin telefonos,
 *            sin IP completa (el servidor solo guarda un hash del dia).
 * A donde va: https://central.ags-ed.com/w/e  (base aparte de la operativa).
 * Codigo del chat (19-nov-2026): si el enlace trae ?r= (lo pone la bienvenida de WhatsApp), la visita
 *            queda unida a esa conversacion, para saber que partes del sitio sirven antes de contratar.
 *            No es el numero ni el nombre.
 * Cookies (28-nov-2026): carga el aviso de cookies (/assets/ags-consent.js). SOLO si la persona acepta
 *            «Medicion», la visita lleva el id propio de su navegador y el codigo del chat de una visita
 *            anterior, para unir sus visitas de distintos dias. Sin aceptar, todo sigue como antes.
 * Cookies v2 (28-nov-2026): con «Medicion» aceptada manda ademas datos del equipo y de como llego (navegador,
 *            sistema, modelo, idioma, zona horaria, pantalla, conexion, pagina de entrada, campana y codigos de
 *            clic de Google, Meta, TikTok o Microsoft). Sin aceptar, nada de esto sale del navegador.
 *
 * Dev Central — 2026-08-02.
 */
(function () {
  'use strict';

  var EP = 'https://central.ags-ed.com/w/e';

  // ── Sitio: lo dice el tag; si no, se deduce del dominio ──────────────
  var me = document.currentScript;
  var SITIOS = {
    'tareapp.ags-ed.com': 'tareapp',
    'educaproject.ags-ed.com': 'educaproject',
    'trabajoshelper.ags-ed.com': 'trabajoshelper'
  };
  var host = location.hostname;
  var sitio = (me && me.getAttribute('data-sitio')) || SITIOS[host] || '';
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) ? 1 : 0;
  if (!sitio) return;                       // dominio desconocido: no medimos

  // Aviso de cookies (28-nov-2026): lo carga el medidor, asi llega a todas las paginas que ya lo tienen.
  // En los puentes a WhatsApp no aparece: ahi la persona solo va a escribirnos.
  try {
    if (!/^\/(tiktok|instagram|facebook|whatsapp)(\/|$)/.test(location.pathname) &&
        !document.getElementById('ags-consent-js')) {
      var cjs = document.createElement('script');
      cjs.id = 'ags-consent-js'; cjs.defer = true; cjs.src = '/assets/ags-consent.js?v=20261128b';
      (document.head || document.documentElement).appendChild(cjs);
    }
  } catch (e) { /* nada */ }
  if (navigator.webdriver && !local) return; // bots de automatizacion

  // ── Identificadores efimeros (no son la persona, son la visita) ──────
  function rid() {
    try {
      var a = new Uint8Array(8);
      crypto.getRandomValues(a);
      return Array.prototype.map.call(a, function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    } catch (e) {
      return String(Math.random()).slice(2, 18);
    }
  }
  var pvid = rid();
  var sid;
  try {
    sid = sessionStorage.getItem('ags_sid');
    if (!sid) { sid = rid(); sessionStorage.setItem('ags_sid', sid); }
  } catch (e) { sid = rid(); }

  // ── Contexto de la pagina ────────────────────────────────────────────
  var W = window.innerWidth || 0;
  var disp = W < 768 ? 'movil' : (W < 1100 ? 'tablet' : 'escritorio');
  var ref = '';
  try {
    if (document.referrer) {
      var rh = new URL(document.referrer).hostname;
      ref = (rh === host) ? 'interno' : rh;
    } else { ref = 'directo'; }
  } catch (e) { ref = 'directo'; }
  // De donde vino la campana (utm), sin datos personales
  var utm = '';
  try {
    var q = new URLSearchParams(location.search);
    utm = [q.get('utm_source'), q.get('utm_campaign')].filter(Boolean).join('/').slice(0, 60);
  } catch (e) { utm = ''; }
  // Codigo del chat (19-nov-2026): el enlace que mandamos por WhatsApp trae ?r=<codigo de la conversacion>.
  // Queda en esta pestana para que las paginas que siga mirando tambien lo lleven.
  try {
    var rq = new URLSearchParams(location.search).get('r');
    if (rq && /^[0-9a-z]{2,9}$/i.test(rq)) sessionStorage.setItem('ags_r', rq.toLowerCase());
    var rr = sessionStorage.getItem('ags_r');
    if (rr && !utm) utm = ('wa/' + rr).slice(0, 60);
  } catch (e) { /* nada */ }
  // Cookies v2 (28-nov-2026): la pagina de entrada de esta pestana y desde donde llego. Queda en la pestana y se
  // manda SOLO con «Medicion» aceptada (ckDx).
  try {
    if (!sessionStorage.getItem('ags_lp')) {
      sessionStorage.setItem('ags_lp', String(location.pathname + location.search).slice(0, 400));
      sessionStorage.setItem('ags_lr', String(document.referrer || '').slice(0, 300));
    }
  } catch (e) { /* nada */ }

  // Cookies (28-nov-2026): SOLO con «Medicion» aceptada en el aviso. ags_id = el mismo navegador cuando vuelve;
  // ags_rp = el codigo del chat que trajo un enlace de WhatsApp en una visita anterior.
  function ckLeer(n) {
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    } catch (e) { return ''; }
  }
  function ckMedicion() { return /^1\.1\.[01]\.\d{8}$/.test(ckLeer('ags_ck')); }
  function ckId() { var v = ckMedicion() ? ckLeer('ags_id') : ''; return /^[0-9a-f]{16}$/.test(v) ? v : ''; }
  function ckRp() {
    if (!ckMedicion()) return '';
    try { var v = localStorage.getItem('ags_rp') || ''; return /^[0-9a-z]{2,9}$/.test(v) ? v : ''; }
    catch (e) { return ''; }
  }
  // Cookies v2 (28-nov-2026, Joseph: «obtener todo lo que podamos toda la informacion posible»): SOLO con «Medicion»
  // aceptada, datos del equipo y de como llego. El modelo del equipo lo da Chrome aparte (dxHints).
  var dxModelo = '', dxPlat = '', dxNav = '';
  function dxHints() {
    try {
      var uad = navigator.userAgentData;
      if (dxModelo || dxPlat || !uad || !uad.getHighEntropyValues) return;
      uad.getHighEntropyValues(['model', 'platformVersion', 'fullVersionList']).then(function (h) {
        dxModelo = String((h && h.model) || '').slice(0, 60);
        dxPlat = (String((h && h.platform) || '') + ' ' + String((h && h.platformVersion) || '')).replace(/^\s+|\s+$/g, '').slice(0, 40);
        var l = (h && h.fullVersionList) || [], nv = [];
        for (var i = 0; i < l.length; i++) {
          if (!/not.?a.?brand|chromium/i.test(String(l[i].brand || ''))) nv.push(String(l[i].brand) + ' ' + String(l[i].version || '').split('.')[0]);
        }
        dxNav = nv.join(', ').slice(0, 80);
      })['catch'](function () { /* nada */ });
    } catch (e) { /* nada */ }
  }
  function ckDx() {
    if (!ckMedicion()) return null;
    var n = navigator || {}, s = window.screen || {}, cn = n.connection || {}, q = null, tz = '', lp = '', lr = '';
    try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
    function g(k) { try { return String((q && q.get(k)) || '').slice(0, 300); } catch (e) { return ''; } }
    try { tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || '').slice(0, 60); } catch (e) { tz = ''; }
    try { lp = sessionStorage.getItem('ags_lp') || ''; lr = sessionStorage.getItem('ags_lr') || ''; } catch (e) { /* nada */ }
    return {
      ua: String(n.userAgent || '').slice(0, 400), mo: dxModelo, pf: dxPlat, nv: dxNav,
      lg: String((n.languages && n.languages.join(',')) || n.language || '').slice(0, 80),
      tz: tz, to: new Date().getTimezoneOffset(),
      sw: s.width || 0, sh: s.height || 0, dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
      vh: window.innerHeight || 0, mem: n.deviceMemory || 0, cpu: n.hardwareConcurrency || 0,
      net: String(cn.effectiveType || '').slice(0, 10), sd: cn.saveData ? 1 : 0, tp: n.maxTouchPoints || 0,
      us: g('utm_source'), um: g('utm_medium'), uc: g('utm_campaign'), ux: g('utm_content'), ut: g('utm_term'),
      fb: g('fbclid'), gc: g('gclid') || g('gbraid') || g('wbraid'), tt: g('ttclid'), ms: g('msclkid'),
      rf: String(document.referrer || '').slice(0, 300), lp: String(lp).slice(0, 400), lr: String(lr).slice(0, 300)
    };
  }
  if (ckMedicion()) dxHints();

  var path = location.pathname.replace(/\/index\.html$/, '/') || '/';

  // ── Tiempo VISIBLE (no cuenta la pestana en segundo plano) ───────────
  var visible = (document.visibilityState !== 'hidden');
  var tIni = Date.now();
  var durTotal = 0;

  // ── Secciones ────────────────────────────────────────────────────────
  // No todas nuestras paginas usan <section>: varias estan hechas con div
  // (/precios/ no tiene ni uno). Por eso no medimos por elemento, medimos por
  // FRANJA: cada ancla (seccion o titulo) manda desde su altura hasta la
  // siguiente, y cada medio segundo sumamos tiempo a la franja que la persona
  // tiene al centro de la pantalla. Asi funciona con cualquier maquetado.
  function texto(el) {
    var t = (el && el.textContent) || '';
    return t.replace(/\s+/g, ' ').trim().slice(0, 60);
  }

  function nombreDe(el) {
    var d = el.getAttribute('data-sec');
    if (d) return d.slice(0, 60);
    if (/^H[1-4]$/.test(el.tagName)) return texto(el);
    if (el.tagName === 'DETAILS') {
      var s = el.querySelector('summary');
      if (s && texto(s)) return texto(s);
    }
    var h = el.querySelector('h1,h2,h3');
    if (h && texto(h)) return texto(h);
    return (el.id || '').slice(0, 60);
  }

  var anclas = [];
  try {
    // 1o las secciones declaradas; si la pagina no las tiene (varias estan
    // hechas con div), caemos a los TITULOS visibles y a las preguntas del FAQ
    var cand = document.querySelectorAll('[data-sec], section[id]');
    if (cand.length < 2) {
      cand = document.querySelectorAll('h1, h2, h3, details');
    }
    Array.prototype.forEach.call(cand, function (el) {
      if (!el.offsetParent && el.offsetHeight === 0) return;   // oculto
      var n = nombreDe(el);
      if (!n) return;
      if (anclas.some(function (a) { return a.n === n; })) return;  // sin repetidos
      anclas.push({ el: el, n: n, ms: 0 });
    });
  } catch (e) { anclas = []; }

  var secs = anclas;
  var ultima = '';

  function franjaActual() {
    if (!anclas.length) return null;
    var centro = (window.scrollY || window.pageYOffset || 0) + (window.innerHeight / 2);
    var elegida = null, mejor = -Infinity;
    for (var i = 0; i < anclas.length; i++) {
      var top;
      try { top = anclas[i].el.getBoundingClientRect().top + (window.scrollY || 0); }
      catch (e) { continue; }
      if (top <= centro && top > mejor) { mejor = top; elegida = anclas[i]; }
    }
    return elegida || anclas[0];
  }

  var PASO = 500;
  setInterval(function () {
    if (!visible) return;
    var f = franjaActual();
    if (!f) return;
    f.ms += PASO;
    ultima = f.n;
  }, PASO);

  // ── Profundidad de scroll ────────────────────────────────────────────
  var smax = 0;
  function medirScroll() {
    try {
      var alto = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight
      );
      if (alto <= 0) return;
      var visto = (window.scrollY || window.pageYOffset || 0) + window.innerHeight;
      var pct = Math.round(Math.min(100, (visto / alto) * 100));
      if (pct > smax) smax = pct;
    } catch (e) { /* nada */ }
  }
  medirScroll();
  var tick = null;
  window.addEventListener('scroll', function () {
    if (tick) return;
    tick = setTimeout(function () { tick = null; medirScroll(); }, 250);
  }, { passive: true });

  // ── Clicks que importan (CTA) ────────────────────────────────────────
  var evs = [];
  var nEv = 0;
  function limpiar(t) {
    return (t || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  }
  document.addEventListener('click', function (e) {
    try {
      if (evs.length >= 25) return;
      var a = e.target && e.target.closest ? e.target.closest('a,button,[data-ags]') : null;
      if (!a) return;
      var marca = a.getAttribute('data-ags');
      var href = a.getAttribute('href') || a.getAttribute('data-href') || '';
      var tipo = '', etiqueta = '';
      if (marca) { tipo = 'cta'; etiqueta = limpiar(marca); }
      else if (/wa\.me|api\.whatsapp|whatsapp\.com/i.test(href)) { tipo = 'whatsapp'; etiqueta = limpiar(a.textContent) || 'whatsapp'; }
      else if (/^(https?:)?\/\//i.test(href) && href.indexOf(host) === -1) { tipo = 'externo'; etiqueta = limpiar(href).slice(0, 50); }
      else if (href.charAt(0) === '/') { tipo = 'interno'; etiqueta = limpiar(href); }
      else return;
      var sec = '';
      var cont = a.closest ? a.closest('section[id],[data-sec]') : null;
      if (cont) sec = (cont.getAttribute('data-sec') || cont.id || '').slice(0, 60);
      evs.push({ i: nEv++, t: tipo, l: etiqueta, s: sec });
    } catch (err) { /* nada */ }
  }, true);

  // ── Envio ────────────────────────────────────────────────────────────
  function paquete(tipo) {
    var ahora = Date.now();
    if (visible) durTotal += (ahora - tIni);
    tIni = ahora;
    var lista = secs.filter(function (r) { return r.ms > 400; })
      .map(function (r) { return { n: r.n, ms: Math.round(r.ms) }; })
      .slice(0, 40);
    return {
      t: tipo, v: pvid, sid: sid, s: sitio, p: path, r: ref, u: utm,
      d: disp, w: W, sm: smax, dur: Math.round(durTotal),
      last: ultima, fin: smax >= 90 ? 1 : 0, loc: local,
      sec: lista, ev: evs.slice(0, 25), c: ckId(), rp: ckRp(), dx: ckDx()
    };
  }

  function enviar(tipo) {
    try {
      var cuerpo = JSON.stringify(paquete(tipo));
      if (cuerpo.length > 20000) return;
      var blob = new Blob([cuerpo], { type: 'text/plain;charset=UTF-8' });
      if (navigator.sendBeacon) { navigator.sendBeacon(EP, blob); return; }
      fetch(EP, { method: 'POST', body: cuerpo, keepalive: true, mode: 'cors' }).catch(function () {});
    } catch (e) { /* nada */ }
  }

  // 1) la visita se cuenta apenas entra (aunque despues se corte el cierre)
  setTimeout(function () { enviar('pv'); }, 900);

  // 1b) refresco cada 15 s mientras la pestana este a la vista.
  //     Sin esto, si el navegador mata el beacon de cierre (pasa, sobre todo en
  //     movil), se perderia TODO lo bueno: secciones, scroll y tiempo. Asi lo
  //     que ya se leyo queda guardado aunque el cierre nunca llegue.
  var ultimo = 0;
  setInterval(function () {
    if (!visible) return;
    var t = Date.now();
    if (t - ultimo < 14000) return;
    ultimo = t;
    enviar('upd');
  }, 5000);

  // 2) el cierre actualiza la MISMA visita (el servidor la reconoce por 'v')
  document.addEventListener('visibilitychange', function () {
    var ahora = Date.now();
    if (document.visibilityState === 'hidden') {
      if (visible) durTotal += (ahora - tIni);
      visible = false; tIni = ahora;
      enviar('end');
    } else {
      visible = true; tIni = ahora;
    }
  });
  window.addEventListener('pagehide', function () { enviar('end'); });

  // Cookies (28-nov-2026): al aceptar «Medicion», la visita de ahora queda con su id sin esperar el refresco.
  window.addEventListener('ags:consent', function (e) {
    try { if (e && e.detail && e.detail.medicion) { dxHints(); setTimeout(function () { enviar('upd'); }, 400); } }
    catch (err) { /* nada */ }
  });
})();
