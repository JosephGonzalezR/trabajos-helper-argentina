# Pendientes de revision (CEO) — Replica estandar Chile v6 en Argentina
Fecha: 2026-07-02 · Trabajo EN LOCAL, commit sin push (NO desplegado).

## Montos y precios (confirmar con el CEO)
- `/precios/` conserva la grilla orientativa ACTUAL del repo AR (reciclada, no inventada):
  TP simple $5.000–$15.000 · Informe/Monografia $8.000–$25.000 · Excel/VBA $10.000–$30.000 ·
  Power BI $15.000–$40.000 · SQL $12.000–$35.000 · Programacion $10.000–$50.000 ·
  PPT $5.000–$15.000 · Parcial/Final "Consultar". **OJO: montos en ARS posiblemente desactualizados
  por inflacion; confirmar vigencia.** Se agrego el aviso "Precios referenciales; se confirman con un asesor".
- `/precios-trabajos/` (nueva, diseño molde Chile): "Trabajos cortos desde **$5.000 ARS**" —
  el monto sale del minimo de la grilla actual del repo (TP simple). CONFIRMAR el "desde".
- Duplicidad /precios/ y /precios-trabajos/: el bot enlaza `/precios/`; el molde Chile usa
  `/precios-trabajos/` para trabajos. Se mantienen AMBAS con contenido de trabajos (sin tesis).
  Decidir si a futuro una redirige a la otra.

## CONTRASTE (ajustes hechos en la pasada visual con capturas reales)
Se reviso CADA pagina servida en local con captura de pantalla (Edge headless) y se corrigio:
1. `.btn--primary` (tema v6): en Chile es texto charcoal sobre amarillo; con la paleta azul quedaba
   **#2D2D2D sobre #2B7CB5 (ilegible)** → ahora **blanco sobre azul** (tambien card__tag, step__num,
   team-avatar, nav__cta, to-top).
2. Seccion **Opiniones** del home (banda oscura con imagen 8): el molde deja el titulo con gradiente
   oscuro sobre fondo oscuro → **no se leia** (mismo bug existe en Chile). Se agrego regla scoped:
   titulo blanco + subtitulo blanco 78%. **Recomendado backportear al molde Chile.**
3. Hero de `/procedimiento/`: gradiente crema/amarillo heredado (#FFFBF0/#FFF8E1) → tonos celestes
   (#F0F7FC/#E8F4FD).
4. `.urgente-band__cta` y `.final-cta__inner .btn--primary`: texto celeste claro #8FC4E8 sobre #2D2D2D.
5. Banda "final CTA" (¿Listo para...?): titulo #2D2D2D sobre celeste #74ACDF ≈ 4:1 (pasa AA texto
   grande). Si el CEO la quiere mas fuerte, subir a blanco con fondo mas oscuro.
6. Neutros: se conservaron los de Chile (--text #1F1F1F, --muted #3D3D3D solidos), que tienen MEJOR
   contraste que los del AR viejo (muted al 60%).
7. `--brand-ink`: Chile usa #8A5A00 (tinta sobre amarillo); para AR se definio **#14527E** (azul
   oscuro) sobre --brand3 #E8F4FD. Elegido por contraste; confirmar si gusta el tono.

## Red de seguridad del reveal (causa raiz de "no se ve")
- Se replico el parche del molde en `setupReveal` (failsafe 1.5s) **y ademas se agrego el mismo
  failsafe a la ruta GSAP/ScrollTrigger** (2s, incluye .cards--3 .card/.step/.deliverable/.team-card/
  .inst-card): sin el, las capturas/iframes mostraban paginas enteras translucidas (asi se veia
  /precios/ en el comparador). **Recomendado backportear al molde Chile.**

## Contenido supuesto / localizado (validar)
- `/nosotros/` RECREADA desde Chile (AR la habia borrado): carreras localizadas a AR (Abogacia,
  Contador Publico, UTN-style, Higiene y Seguridad, etc.) y "notas altas (8 a 10)" en vez de
  "6,0 y 7,0". Validar lista de carreras y la promesa de notas.
- Voseo aplicado en paginas derivadas de Chile (nosotros, precios-trabajos): mandanos/contanos/tenes.
- Badges de blog "Power BI" quedaron amarillos (#F7C948): es el color del producto Power BI, no de la
  marca Tareapp. Cambiar si molesta.
- El post `/blog/informe-apa/` menciona la palabra "tesis" una vez en contenido editorial (factual,
  no es link ni oferta). Nav/footer quedaron 100% sin tesis.
- `/tesis/` y `tesis.html` ahora redirigen al home (AR sin tesis por orden del CEO 2026-07-02).

## Estructura / SEO
- URLs limpias: todas las paginas son carpetas con index.html. Los .html planos viejos quedaron como
  stubs de redireccion (meta refresh + canonical) — los links viejos del bot siguen funcionando.
- Canonical + og:url + og:image absolutos con dominio trabajoshelper.ags-ed.com en todas las paginas.
- Nav del home: se mantuvo "Referencias" (el molde Chile no lo lleva en el home, pero AR ya lo tenia
  y la pagina existe). Quitar si se quiere identidad 100% con Chile.
- styles.css = el del molde Chile (superset: nosotros, logos, precios-trabajos, promo-toast) con SOLO
  la paleta cambiada + 4 extras AR (nowrap del numero largo, .page-head, .article-step__body, fixes
  de contraste de arriba).
- app.js = v6 con CONFIG AR (numero verificado +54 9 342 413 4914, redes reales del repo AR).

## Verificaciones corridas (todas OK)
- curl 200 en las 16 rutas del set (sin tesis, sin cotizador) + stubs redirigiendo bien.
- grep "tareapp" en *.html = 0 · "al tiro" = 0 · "+56 9" = 0 · "7147" = 0 · "413-4914" (guion) = 0.
- Cero links/menciones de tesis en nav/footer.
- Capturas visuales de todas las paginas en C:\Users\rgonz\Downloads\ar_shots\ (borrables).
