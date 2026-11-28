/*!
 * AGS — aviso de cookies de las webs (Dev Central, 28-nov-2026).
 * Joseph, 28-nov-2026 (consola de AGS Remoto), con la web de Adidas Perú a la vista: «es muy facil de aceptar y no te hace
 * leer mucho me gustaria algo asi para nuestra pagina y recabar la mayor cantidad de informacion posible de clientes».
 *
 * v2 (28-nov-2026, Joseph: «solo seria .. aceptar cockies nada mas no? ... y btener todo lo que podamos toda la informacion
 * psoible»): UNA línea y UN botón, «Aceptar cookies». Cambiar la elección: «Cookies» al pie y la página de privacidad.
 * Nada se pone ANTES de su clic.
 *   ags_ck   (la elección, 1 año; 6 meses si no aceptó nada)  «1.<medición>.<publicidad>.<AAAAMMDD>»
 *   ags_id   (solo con Medición: el mismo navegador cuando vuelve; 395 días, se renueva en cada visita)
 *   ags_rp   (localStorage, solo con Medición: el código del chat que trajo el enlace de WhatsApp, para sus próximas visitas)
 * Lo de terceros (Google Analytics, Clarity, píxel de Meta, píxel de TikTok) SOLO se carga si su id está puesto abajo
 * (vacío = no existe) Y la persona aceptó esa parte. Hoy (28-nov) no hay ninguno puesto: ESPERAN la orden de Joseph.
 * Lo carga /assets/ags-analytics.js en todas las páginas que lo tienen, salvo los puentes a WhatsApp.
 */
(function () {
  'use strict';
  if (window.__agsConsent) return;
  window.__agsConsent = 1;

  // ── Qué hay en cada web (vacío = no se usa) ─────────────────────────────────
  var TERCEROS = {
    // 'tareapp.ags-ed.com': { ga4: '', clarity: '', meta: '', tiktok: '' }
  };
  var VOS = { 'tareapp.argentina.ags-ed.com': 1, 'trabajoshelper.ags-ed.com': 1 };
  // Botón «Rechazar» a la vista en la primera capa (si una ley lo pide en un país); hoy en ninguna.
  var RECHAZO_VISIBLE = {};
  var PUENTES = /^\/(tiktok|instagram|facebook|whatsapp)(\/|$)/;

  var host = location.hostname;
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host);
  var T = TERCEROS[host] || {};
  var vos = !!VOS[host] || (local && /[?&]vos=1/.test(location.search));
  if (PUENTES.test(location.pathname)) return;

  var VERSION = '1';
  var DIA = 86400;

  // ── Cookies y almacenamiento ───────────────────────────────────────────────
  function leer(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function poner(n, v, seg) {
    var seguro = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = n + '=' + encodeURIComponent(v) + '; Max-Age=' + seg + '; Path=/; SameSite=Lax' + seguro;
  }
  function borrar(n) { poner(n, '', 0); }
  function rid() {
    try {
      var a = new Uint8Array(8);
      crypto.getRandomValues(a);
      return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    } catch (e) {
      return (String(Math.random()).slice(2, 10) + String(Math.random()).slice(2, 10)).slice(0, 16);
    }
  }
  function hoy() {
    var d = new Date();
    return '' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
  }

  function estado() {
    var c = leer('ags_ck');
    var m = /^(\d+)\.([01])\.([01])\.(\d{8})$/.exec(c);
    if (!m || m[1] !== VERSION) return null;
    return { medicion: m[2] === '1', publicidad: m[3] === '1', fecha: m[4] };
  }

  // ── Lo que se prende con cada parte ───────────────────────────────────────
  var cargado = {};
  function script(src, id) {
    if (cargado[id]) return;
    cargado[id] = 1;
    var s = document.createElement('script');
    s.async = true; s.src = src;
    (document.head || document.documentElement).appendChild(s);
  }

  function prenderMedicion() {
    // 1) el mismo navegador cuando vuelve (propio, en este dominio, nunca sale de aquí)
    var id = leer('ags_id');
    if (!/^[0-9a-f]{16}$/.test(id)) id = rid();
    poner('ags_id', id, 395 * DIA);
    // 2) el código del chat que trajo el enlace de WhatsApp queda para sus próximas visitas
    try {
      var r = sessionStorage.getItem('ags_r');
      if (r && /^[0-9a-z]{2,9}$/.test(r)) localStorage.setItem('ags_rp', r);
    } catch (e) { /* nada */ }
    // 3) Google Analytics 4 (edad, sexo e intereses EN GRUPO, ciudades, equipos) si está puesto
    if (T.ga4 && /^G-[A-Z0-9]{4,14}$/.test(T.ga4) && !cargado.ga4) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {
        analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
      });
      window.gtag('js', new Date());
      window.gtag('config', T.ga4);
      script('https://www.googletagmanager.com/gtag/js?id=' + T.ga4, 'ga4');
    }
    // 4) Microsoft Clarity (grabaciones y mapas de calor) si está puesto
    if (T.clarity && /^[a-z0-9]{6,14}$/.test(T.clarity) && !cargado.clarity) {
      window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
      window.clarity('consent');
      script('https://www.clarity.ms/tag/' + T.clarity, 'clarity');
    }
  }

  function apagarMedicion() {
    borrar('ags_id');
    try { localStorage.removeItem('ags_rp'); } catch (e) { /* nada */ }
  }

  function prenderPublicidad() {
    if (window.gtag && cargado.ga4) {
      window.gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' });
    }
    // Píxel de Meta (Facebook e Instagram) si está puesto
    if (T.meta && /^\d{10,20}$/.test(T.meta) && !cargado.meta) {
      /* eslint-disable */
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      })(window, document);
      /* eslint-enable */
      window.fbq('init', T.meta);
      window.fbq('track', 'PageView');
      script('https://connect.facebook.net/en_US/fbevents.js', 'meta');
    }
    // Píxel de TikTok si está puesto
    if (T.tiktok && /^[A-Z0-9]{8,30}$/.test(T.tiktok) && !cargado.tiktok) {
      var ttq = window.ttq = window.ttq || [];
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
      ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.load = function (id) { script('https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + id + '&lib=ttq', 'tiktok'); };
      ttq.load(T.tiktok);
      ttq.page();
    }
  }

  // Un clic a WhatsApp también le llega a Meta y TikTok como «Contact» (solo con Publicidad aceptada y su píxel puesto)
  document.addEventListener('click', function (e) {
    try {
      var st = estado();
      if (!st || !st.publicidad) return;
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      if (!a || !/wa\.me|api\.whatsapp|whatsapp\.com|^whatsapp:/i.test(a.getAttribute('href') || '')) return;
      if (window.fbq && cargado.meta) window.fbq('track', 'Contact');
      if (window.ttq && cargado.tiktok) window.ttq.track('Contact');
    } catch (err) { /* nada */ }
  }, true);

  function aplicar(st, nuevo) {
    if (st.medicion) prenderMedicion(); else if (nuevo) apagarMedicion();
    if (st.publicidad) prenderPublicidad();
    try {
      var ev;
      if (typeof window.CustomEvent === 'function') ev = new CustomEvent('ags:consent', { detail: st });
      else { ev = document.createEvent('CustomEvent'); ev.initCustomEvent('ags:consent', false, false, st); }
      window.dispatchEvent(ev);
    } catch (e) { /* nada */ }
  }

  function guardar(med, pub) {
    var antes = estado();
    var st = { medicion: !!med, publicidad: !!pub, fecha: hoy() };
    poner('ags_ck', [VERSION, st.medicion ? 1 : 0, st.publicidad ? 1 : 0, st.fecha].join('.'),
      (st.medicion || st.publicidad ? 365 : 180) * DIA);
    // Quien saca algo que ya había aceptado: lo de terceros que ya cargó se va al recargar la página
    var quito = antes && ((antes.medicion && !st.medicion) || (antes.publicidad && !st.publicidad));
    aplicar(st, true);
    cerrar();
    if (quito) setTimeout(function () { location.reload(); }, 350);
  }

  // ── Textos ────────────────────────────────────────────────────────────────
  var TX = {
    titulo: 'Cookies',
    texto: 'Usamos cookies para atenderte mejor' + ((T.meta || T.tiktok) ? ', aquí y en tus redes.' : '.'),
    vermas: 'Ver más',
    aceptar: 'Aceptar cookies',
    rechazar: 'Rechazar',
    nec: 'Necesarias', necT: 'Hacen que el sitio funcione y guardan esta elección.', siempre: 'Siempre activas',
    med: 'Medición', medT: vos ? 'Reconocer tu visita cuando volvés y saber desde qué equipo y enlace llegás.'
      : 'Reconocer tu visita cuando vuelves y saber desde qué equipo y enlace llegas.',
    pub: 'Publicidad', pubT: 'Mostrarte nuestros avisos en tus redes.',
    todo: 'Aceptar todo', guardarT: 'Guardar mi elección',
    pie: 'Cookies'
  };

  // ── Estilo: el de cada web (Tareapp v2 con tinta y amarillo; EducaProject y Trabajos Helper con su azul) ────────
  function css() {
    var raiz = getComputedStyle(document.documentElement);
    var v2 = !!raiz.getPropertyValue('--tinta').trim();
    var brand = raiz.getPropertyValue('--brand').trim() || '#2B3CFF';
    var s = [
      '#ags-ck{position:fixed;left:calc(12px + var(--ags-ck-vvl,0px));right:auto;width:calc(var(--ags-ck-vw,100vw) - 24px);',
      'bottom:calc(12px + var(--ags-ck-base,0px) + var(--ags-ck-vvb,0px));',
      'bottom:calc(12px + var(--ags-ck-base,0px) + var(--ags-ck-vvb,0px) + env(safe-area-inset-bottom));z-index:90;display:flex;flex-direction:column;',
      'max-height:calc(100% - 24px - var(--ags-ck-base,0px));',
      'max-width:540px;margin:0;box-sizing:border-box;-webkit-text-size-adjust:100%;',
      'transform:translateY(calc(100% + 40px));opacity:0;transition:transform .55s cubic-bezier(.23,1,.32,1),opacity .3s ease}',
      '#ags-ck.ags-ck-ve{transform:none;opacity:1}',
      '#ags-ck *{box-sizing:border-box}',
      '#ags-ck .ck-caja{position:relative;padding:14px;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch}',
      // una fila: galleta + la línea + el botón; en el celular el botón baja y ocupa todo el ancho
      '#ags-ck .ck-fila{display:flex;flex-wrap:wrap;gap:12px;align-items:center}',
      '#ags-ck .ck-galleta{flex:0 0 auto;width:38px;height:38px}',
      '#ags-ck .ck-txt{flex:1 1 180px;min-width:0;margin:0;font-size:15px;line-height:1.35}',
      '#ags-ck .ck-txt a{color:inherit;text-decoration:underline;text-underline-offset:2px;white-space:nowrap}',
      '#ags-ck .ck-bots1{flex:1 1 100%;display:flex;gap:10px;align-items:center}',
      '#ags-ck button{font:inherit;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent}',
      '#ags-ck .ck-si{flex:1 1 auto;min-height:48px;padding:0 20px;font-size:16px;font-weight:800;letter-spacing:.02em}',
      '#ags-ck .ck-no{flex:0 0 auto;min-height:48px;padding:0 12px;font-size:14px;font-weight:600;background:transparent}',
      '#ags-ck .ck-panel{display:none;margin-top:12px}',
      '#ags-ck.ags-ck-config .ck-panel{display:block}',
      '#ags-ck.ags-ck-config .ck-bots1{display:none}',
      '#ags-ck .ck-op{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid rgba(0,0,0,.12)}',
      '#ags-ck .ck-op b{display:block;font-size:14px}',
      '#ags-ck .ck-op span{display:block;font-size:12.5px;line-height:1.35;opacity:.85}',
      '#ags-ck .ck-fijo{font-size:12px;font-weight:700;white-space:nowrap;opacity:.75}',
      '#ags-ck .ck-sw{position:relative;flex:0 0 auto;width:48px;height:28px;border-radius:99px;padding:0;background:#d9d4c7}',
      '#ags-ck .ck-sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;',
      'transition:transform .25s cubic-bezier(.23,1,.32,1)}',
      '#ags-ck .ck-sw[aria-checked="true"]::after{transform:translateX(20px)}',
      '#ags-ck .ck-bots2{display:flex;gap:10px;margin-top:10px}',
      '#ags-ck .ck-bots2 button{flex:1 1 50%;min-height:44px;font-size:14.5px;font-weight:800;padding:0 10px}',
      '#ags-ck button:focus-visible{outline:3px solid #2B3CFF;outline-offset:2px}',
      '@media (min-width:760px){#ags-ck{left:calc(24px + var(--ags-ck-vvl,0px));right:auto;bottom:calc(24px + var(--ags-ck-vvb,0px));width:540px}',
      '#ags-ck .ck-bots1{flex:0 0 auto}#ags-ck .ck-si,#ags-ck .ck-no{min-height:44px}#ags-ck .ck-bots2 button{min-height:40px}}',
      '@media (prefers-reduced-motion:reduce){#ags-ck{transition:opacity .2s ease;transform:none}}',
      // la burbuja de WhatsApp sube mientras el aviso está abierto: nunca queda tapada
      '@media (max-width:759px){html.ags-ck-abierto .wa-flotante{bottom:calc(var(--ags-ck-alto,0px) + 14px) !important;',
      'transition:transform .45s cubic-bezier(.23,1,.32,1),opacity .25s ease,bottom .45s cubic-bezier(.23,1,.32,1) !important}',
      'html.ags-ck-abierto .to-top{opacity:0 !important;pointer-events:none !important}}'
    ];
    if (v2) {
      s.push(
        '#ags-ck .ck-caja{background:var(--papel,#FFFAF0);color:var(--tinta,#16120E);border:var(--borde,2.5px solid #16120E);',
        'border-radius:var(--radio,22px);box-shadow:var(--sombra,5px 5px 0 #16120E);font-family:var(--f-disp,system-ui,sans-serif)}',
        '#ags-ck .ck-txt{font-weight:600}',
        '#ags-ck .ck-si,#ags-ck .ck-bots2 .ck-todo{background:var(--amarillo,#F7C948);color:var(--tinta,#16120E);',
        'border:var(--borde,2.5px solid #16120E);border-radius:14px;box-shadow:3px 3px 0 var(--tinta,#16120E);text-transform:uppercase;',
        'transition:transform .15s ease,box-shadow .15s ease}',
        '#ags-ck .ck-si:active,#ags-ck .ck-bots2 .ck-todo:active{transform:translate(3px,3px);box-shadow:0 0 0 var(--tinta,#16120E)}',
        '#ags-ck .ck-no,#ags-ck .ck-bots2 .ck-guardar{color:var(--tinta,#16120E);border:2px solid var(--tinta,#16120E);border-radius:14px}',
        '#ags-ck .ck-bots2 .ck-guardar{background:var(--crema,#FFF3D6)}',
        '#ags-ck .ck-op{border-top:2px dashed rgba(22,18,14,.25)}',
        '#ags-ck .ck-sw{border:2px solid var(--tinta,#16120E);background:var(--crema,#FFF3D6)}',
        '#ags-ck .ck-sw::after{top:2px;left:2px;background:var(--tinta,#16120E)}',
        '#ags-ck .ck-sw[aria-checked="true"]{background:var(--lima,#C8F03C)}'
      );
    } else {
      s.push(
        '#ags-ck .ck-caja{background:#fff;color:var(--text,#1F1F1F);border:1px solid var(--line,rgba(0,0,0,.14));',
        'border-radius:var(--radius,18px);box-shadow:0 18px 50px rgba(0,0,0,.18);font-family:var(--font,system-ui,sans-serif)}',
        '#ags-ck .ck-si,#ags-ck .ck-bots2 .ck-todo{background:' + brand + ';color:#fff;border:0;border-radius:var(--radius-sm,14px);',
        'box-shadow:0 8px 20px rgba(0,0,0,.14)}',
        '#ags-ck .ck-no,#ags-ck .ck-bots2 .ck-guardar{color:var(--brand-ink,#1F3A78);border:1px solid var(--line,rgba(0,0,0,.18));',
        'border-radius:var(--radius-sm,14px)}',
        '#ags-ck .ck-bots2 .ck-guardar{background:var(--brand3,#E7EDFB)}',
        '#ags-ck .ck-sw{border:1px solid rgba(0,0,0,.22)}',
        '#ags-ck .ck-sw[aria-checked="true"]{background:' + brand + ';border-color:' + brand + '}'
      );
    }
    var el = document.createElement('style');
    el.id = 'ags-ck-css';
    el.textContent = s.join('');
    (document.head || document.documentElement).appendChild(el);
  }

  var GALLETA = '<svg class="ck-galleta" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path d="M24 4.5a19.5 19.5 0 1 0 19.4 21.3 5.6 5.6 0 0 1-6.6-5.2 5.6 5.6 0 0 1-6.3-6.6A5.6 5.6 0 0 1 25.6 4.6 19 19 0 0 0 24 4.5z" ' +
    'fill="#E9A955" stroke="#16120E" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<circle cx="16" cy="19" r="2.6" fill="#5A3416"/><circle cx="25" cy="29" r="2.8" fill="#5A3416"/>' +
    '<circle cx="15.5" cy="31" r="2.2" fill="#5A3416"/><circle cx="33" cy="35" r="2.2" fill="#5A3416"/>' +
    '<circle cx="22" cy="13" r="1.6" fill="#5A3416"/><circle cx="38.5" cy="12" r="1.8" fill="#E9A955" stroke="#16120E" stroke-width="2"/>' +
    '<circle cx="43" cy="19.5" r="1.2" fill="#16120E"/></svg>';

  var caja = null;
  var abierto = false;

  function medir() {
    if (!caja) return;
    var alto = caja.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--ags-ck-alto', Math.round(alto + 12 + baseAbajo()) + 'px');
  }

  // EducaProject y Trabajos Helper tienen una barra fija abajo en el celular (WhatsApp, Formulario): el aviso va encima
  function baseAbajo() {
    try {
      var bb = document.getElementById('bottomBar');
      if (!bb) return 0;
      var st = getComputedStyle(bb);
      if (st.display === 'none' || st.position !== 'fixed') return 0;
      var r = bb.getBoundingClientRect();
      var abajo = fondoVisible();
      if (r.top >= abajo || r.height < 10) return 0;
      return Math.max(0, Math.round(abajo - r.top));
    } catch (e) { return 0; }
  }

  function interruptor(nombre, valor) {
    return '<button type="button" class="ck-sw" role="switch" data-ck="' + nombre + '" aria-checked="' + (valor ? 'true' : 'false') +
      '" aria-label="' + nombre + '"></button>';
  }

  function construir(config) {
    var st = estado();
    var priv = '/privacy/#cookies';
    caja = document.createElement('div');
    caja.id = 'ags-ck';
    caja.setAttribute('role', 'region');
    caja.setAttribute('aria-label', TX.titulo);
    caja.innerHTML =
      '<div class="ck-caja">' +
        '<div class="ck-fila">' + GALLETA +
          '<p class="ck-txt">' + TX.texto + ' <a href="' + priv + '">' + TX.vermas + '</a></p>' +
          '<div class="ck-bots ck-bots1">' +
            '<button type="button" class="ck-si" data-ck-accion="si">' + TX.aceptar + '</button>' +
            (RECHAZO_VISIBLE[host] ? '<button type="button" class="ck-no" data-ck-accion="no">' + TX.rechazar + '</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="ck-panel">' +
          '<div class="ck-op"><div><b>' + TX.nec + '</b><span>' + TX.necT + '</span></div><em class="ck-fijo">' + TX.siempre + '</em></div>' +
          '<div class="ck-op"><div><b>' + TX.med + '</b><span>' + TX.medT + '</span></div>' + interruptor('medicion', st && st.medicion) + '</div>' +
          '<div class="ck-op"><div><b>' + TX.pub + '</b><span>' + TX.pubT + '</span></div>' + interruptor('publicidad', st && st.publicidad) + '</div>' +
          '<div class="ck-bots2">' +
            '<button type="button" class="ck-guardar" data-ck-accion="guardar">' + TX.guardarT + '</button>' +
            '<button type="button" class="ck-todo" data-ck-accion="si">' + TX.todo + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    if (config) caja.className = 'ags-ck-config';
    caja.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      var sw = b.getAttribute('data-ck');
      if (sw) {
        b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
        return;
      }
      var acc = b.getAttribute('data-ck-accion');
      if (acc === 'si') guardar(true, true);
      else if (acc === 'no') guardar(false, false);
      else if (acc === 'config') { caja.classList.add('ags-ck-config'); setTimeout(medir, 30); }
      else if (acc === 'guardar') {
        var v = function (n) { var x = caja.querySelector('[data-ck="' + n + '"]'); return x && x.getAttribute('aria-checked') === 'true'; };
        guardar(v('medicion'), v('publicidad'));
      }
    });
    document.body.appendChild(caja);
  }

  function abrir(config) {
    if (abierto) { if (config && caja) { caja.classList.add('ags-ck-config'); setTimeout(medir, 30); } return; }
    if (!document.getElementById('ags-ck-css')) css();
    if (caja && caja.parentNode) caja.parentNode.removeChild(caja);
    construir(config);
    abierto = true;
    anchoVisible();
    document.documentElement.style.setProperty('--ags-ck-base', baseAbajo() + 'px');
    medir();
    document.documentElement.classList.add('ags-ck-abierto');
    // dos cuadros para que el navegador pinte la posición inicial antes de animar
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (caja) caja.classList.add('ags-ck-ve'); }); });
    window.addEventListener('resize', alCambiar);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', alCambiarVV);
      window.visualViewport.addEventListener('scroll', alCambiarVV);
    }
  }

  // Lo que la persona VE (visual viewport). En una página que se sale de lado, el viewport de diseño crece y lo fijo
  // abajo queda fuera de la pantalla: el aviso se corre lo que haga falta para quedar a la vista.
  function fondoVisible() {
    var vv = window.visualViewport;
    return vv ? (vv.offsetTop + vv.height) : window.innerHeight;
  }
  function anchoVisible() {
    var vv = window.visualViewport;
    var w = (vv && vv.width) || window.innerWidth || 0;
    var raiz = document.documentElement.style;
    if (w > 0) raiz.setProperty('--ags-ck-vw', Math.round(w) + 'px');
    var extra = vv ? Math.max(0, Math.round(window.innerHeight - (vv.offsetTop + vv.height))) : 0;
    raiz.setProperty('--ags-ck-vvb', extra + 'px');
    raiz.setProperty('--ags-ck-vvl', (vv ? Math.max(0, Math.round(vv.offsetLeft)) : 0) + 'px');
  }

  function alCambiar() {
    anchoVisible();
    document.documentElement.style.setProperty('--ags-ck-base', baseAbajo() + 'px');
    medir();
  }

  var cuadroVV = 0;
  function alCambiarVV() {
    if (cuadroVV) return;
    cuadroVV = requestAnimationFrame(function () { cuadroVV = 0; alCambiar(); });
  }

  function cerrar() {
    if (!caja) return;
    abierto = false;
    var c = caja;
    c.classList.remove('ags-ck-ve');
    document.documentElement.classList.remove('ags-ck-abierto');
    window.removeEventListener('resize', alCambiar);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', alCambiarVV);
      window.visualViewport.removeEventListener('scroll', alCambiarVV);
    }
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 600);
    caja = null;
  }

  // «Cookies» en el pie de página: vuelve a abrir el aviso para cambiar la elección
  function enlacePie() {
    try {
      var pie = document.querySelector('footer');
      if (!pie || pie.querySelector('[data-ags-cookies]')) return;
      var priv = pie.querySelector('a[href*="privacy"], a[href*="privacidad"]');
      var navs = pie.querySelectorAll('nav');
      var donde = priv ? priv.parentNode : (navs.length ? navs[navs.length - 1] : pie);
      var a = document.createElement('a');
      a.href = '#cookies';
      a.setAttribute('data-ags-cookies', '1');
      a.textContent = TX.pie;
      var hermano = donde.querySelector('a');
      if (hermano && hermano.className) a.className = hermano.className;
      donde.appendChild(a);
    } catch (e) { /* nada */ }
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('[data-ags-cookies],a[href="#cookies-config"]') : null;
    if (!a) return;
    e.preventDefault();
    abrir(true);
  });

  window.AGS_COOKIES = { abrir: function () { abrir(true); }, estado: estado };

  function inicio() {
    enlacePie();
    var st = estado();
    if (st) { aplicar(st, false); return; }
    // primera visita (o elección vencida): el aviso entra después de que la página ya se ve
    setTimeout(function () { abrir(false); }, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicio);
  else inicio();
})();
