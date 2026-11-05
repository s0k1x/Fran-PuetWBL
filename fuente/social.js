  /* ---------- Compartir, medición, visitas en directo, panel, galería e instalación ---------- */
  const PARAMS = new URLSearchParams(location.search), EMBEBIDO = PARAMS.get("embed") === "1";
  const base = () => location.origin + location.pathname;
  /* Enlace que abre lo que se está viendo: proyecto publicado, modelo de la web o la portada */
  function enlaceCompartir() {
    if (H.proyecto && H.proyecto.slug) return enlaceDe(H.proyecto.slug);
    if (H.ruta) return base() + "?m=" + encodeURIComponent(H.ruta);
    const prueba = (CONFIG.modeloPrueba || "").split("/").pop().replace(/\.[^.]+$/, "");
    if (T.modo !== "portada" && CONFIG.modeloPrueba && (T.nombre === prueba || /villa/i.test(T.nombre))) return base() + "?m=" + encodeURIComponent(CONFIG.modeloPrueba);
    return base();
  }
  const conParam = (u, k, v) => u + (u.includes("?") ? "&" : "?") + k + "=" + encodeURIComponent(v);
  function qrImagen(url, celda = 8) {
    const q = qrcode(0, "M"); q.addData(url); q.make(); const n = q.getModuleCount(), m = 4, c = document.createElement("canvas"); c.width = c.height = (n + m * 2) * celda;
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = "#0a0a0a";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) g.fillRect((x + m) * celda, (y + m) * celda, celda, celda);
    return c.toDataURL("image/png");
  }
  async function compartirPro() {
    const url = enlaceCompartir(), f = $("ficha"); f.hidden = false; hoja(null);
    const ifr = `<iframe src="${conParam(url, "embed", "1")}" width="100%" height="560" style="border:0;border-radius:16px" allow="fullscreen; xr-spatial-tracking; microphone" loading="lazy" title="Recorrido 3D · INNRA3D"></iframe>`;
    f.innerHTML = `<h3>Compartir</h3><div class="compartir"><div class="qr">${PUNTOS}</div><div class="cmp-d"><label class="ajuste"><span>Enlace</span><input type="text" readonly id="shUrl"></label><div class="fila"><button class="tool" type="button" id="shCopia">Copiar enlace</button><button class="tool" type="button" id="shQR">Descargar QR</button>${navigator.share ? '<button class="tool" type="button" id="shNat">Enviar…</button>' : ""}</div></div></div>
      <label class="ajuste"><span>Insertar en tu web</span><textarea id="shIfr" rows="3" readonly></textarea></label><div class="fila"><button class="tool" type="button" id="shCopiaI">Copiar código</button><button class="tool" type="button" id="shX">Cerrar</button></div>
      ${url === base() && T.modo !== "portada" ? '<p class="nota2">Este modelo no está publicado: publícalo desde tu cuenta para que otras personas puedan abrirlo.</p>' : ""}`;
    $("shUrl").value = url; $("shIfr").value = ifr;
    $("shCopia").onclick = () => copia(url, "Enlace copiado."); $("shCopiaI").onclick = () => copia(ifr, "Código copiado."); $("shX").onclick = () => f.hidden = true;
    if ($("shNat")) $("shNat").onclick = () => navigator.share({ title: (T.nombre || "Casa") + " · INNRA3D", text: "Recórrela en 3D", url }).catch(() => {});
    try { await cargaScript(QR_URL); const img = qrImagen(url); f.querySelector(".qr").innerHTML = `<img alt="Código QR del enlace" src="${img}">`; $("shQR").onclick = async () => guardar(await (await fetch(img)).blob(), "qr-innra3d.png"); } catch (e) { f.querySelector(".qr").textContent = "QR no disponible"; }
  }
  /* Modo insertado en otras webs: sin portada ni avisos, con un botón para abrir INNRA3D */
  if (EMBEBIDO) {
    document.documentElement.classList.add("embebido");
    $("esq").addEventListener("click", e => { e.stopImmediatePropagation(); const u = new URL(location.href); u.searchParams.delete("embed"); open(u.href, "_blank", "noopener"); }, true);
  }

  /* ---------- Medición avanzada: superficies, alturas, guardadas y exportables ---------- */
  const lineaM = (pts, cerrar) => { const g = new THREE.BufferGeometry().setFromPoints(cerrar ? [...pts, pts[0]] : pts), l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xd8c49c, depthTest: false, transparent: true, toneMapped: false })); l.renderOrder = 9; capaMedidas.add(l); return l; };
  const etiquetaM = (p, txt) => { const e = texto("span", "cota"); e.textContent = txt; $("marcas").append(e); H.medidas.push({ p: p.clone(), e, dist: 0 }); };
  function areaDe(pts) { const n = new THREE.Vector3(); for (let i = 0; i < pts.length; i++) n.add(new THREE.Vector3().crossVectors(pts[i], pts[(i + 1) % pts.length])); let per = 0; for (let i = 0; i < pts.length; i++) per += pts[i].distanceTo(pts[(i + 1) % pts.length]); return { area: n.length() / 2, per }; }
  function pintaMedida(m) {
    const pts = m.pts.map(a => new THREE.Vector3(...a));
    if (m.t === "d") { lineaM(pts); const dy = Math.abs(pts[0].y - pts[1].y); etiquetaM(pts[0].clone().lerp(pts[1], .5), fmt(m.v) + " m" + (dy > .05 ? ` · alto ${fmt(dy)}` : "")); }
    else if (m.t === "a") { lineaM(pts, true); const c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length); etiquetaM(c, `${fmt(m.v, 2)} m² · ${fmt(m.per || 0, 1)} m`); }
    else if (m.t === "h") { lineaM(pts); etiquetaM(pts[0].clone().lerp(pts[1], .5), "Altura " + fmt(m.v) + " m"); }
  }
  function pintaMedidas() { borraBase(); (D.medidas || []).forEach(pintaMedida); }
  const borraBase = borraMedidas;
  /* Solo la herramienta borra las medidas guardadas; al cambiar de modelo únicamente se limpian de la vista */
  const borraMedidasTodo = () => { borraBase(); D.medidas = []; guardaD(); };
  const medirBase = medirPunto;
  medirPunto = function (p) { const a = H.a; medirBase(p); if (a) { (D.medidas = D.medidas || []).push({ t: "d", pts: [a.toArray(), p.toArray()], v: a.distanceTo(p) }); guardaD(); } };
  const MED = { pts: [], lin: null };
  const clicBase = clicHerr;
  clicHerr = function (e) {
    if (H.modo !== "area" && H.modo !== "altura") return clicBase(e);
    const p = puntoEn(e.clientX, e.clientY); if (!p) { aviso("Pulsa sobre una superficie del modelo."); return true; }
    if (H.modo === "altura") {
      const d = rayo(p.x, p.y + .03, p.z, 0, 1, 0, 30); if (!isFinite(d)) { aviso("No hay techo encima de ese punto."); return true; }
      const m = { t: "h", pts: [p.toArray(), [p.x, p.y + .03 + d, p.z]], v: d + .03 }; (D.medidas = D.medidas || []).push(m); guardaD(); pintaMedida(m); return true;
    }
    if (MED.pts.length >= 3) { const a = MED.pts[0].clone().project(camera), q = vista.getBoundingClientRect(), sx = (a.x + 1) / 2 * q.width + q.left, sy = (1 - a.y) / 2 * q.height + q.top; if (Math.hypot(sx - e.clientX, sy - e.clientY) < 24) { cierraArea(); return true; } }
    marca3D(p); MED.pts.push(p); if (MED.lin) capaMedidas.remove(MED.lin); if (MED.pts.length > 1) MED.lin = lineaM(MED.pts);
    $("modoTxt").textContent = MED.pts.length < 3 ? `Punto ${MED.pts.length}. Sigue marcando el contorno` : "Pulsa el primer punto o Intro para cerrar";
    return true;
  };
  function cierraArea() {
    if (MED.pts.length < 3) return; if (MED.lin) capaMedidas.remove(MED.lin);
    const { area, per } = areaDe(MED.pts), m = { t: "a", pts: MED.pts.map(p => p.toArray()), v: area, per }; (D.medidas = D.medidas || []).push(m); guardaD(); pintaMedida(m);
    MED.pts = []; MED.lin = null; modoH(null); aviso(`Superficie: ${fmt(area, 2)} m² · perímetro ${fmt(per, 1)} m.`);
  }
  addEventListener("keydown", e => { if (H.modo === "area" && e.key === "Enter") cierraArea(); });
  const medirArea = () => { MED.pts = []; MED.lin = null; modoH("area", "Marca los vértices del contorno"); };
  function medidasCSV() {
    const fil = (D.medidas || []).map((m, i) => [i + 1, { d: "Distancia", a: "Superficie", h: "Altura" }[m.t], m.v.toFixed(3).replace(".", ","), m.t === "a" ? "m²" : "m", m.t === "a" ? (m.per || 0).toFixed(2).replace(".", ",") : ""].join(";"));
    guardar(new Blob(["﻿N;Tipo;Valor;Unidad;Perímetro (m)\n" + fil.join("\n")], { type: "text/csv" }), `medidas-${T.nombre || "modelo"}.csv`);
  }
  const prepMed = prepararHerramientas;
  prepararHerramientas = function (extra) { prepMed(extra); pintaMedidas(); };

  /* ---------- Visita en directo: el agente guía y los invitados lo siguen (Supabase Realtime) ---------- */
  const VIVO = { canal: null, guia: false, seguir: true, otros: new Map(), id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()), ult: 0, pose: null };
  const capaVivo = new THREE.Group(); scene.add(capaVivo);
  const nombreYo = () => (usuario && ((usuario.user_metadata && (usuario.user_metadata.full_name || usuario.user_metadata.name)) || usuario.email.split("@")[0])) || "Invitado";
  function entraVivo(codigo, guia) {
    if (!nube || VIVO.canal) return; VIVO.guia = guia; VIVO.codigo = codigo;
    const ch = nube.channel("innra-vivo-" + codigo, { config: { broadcast: { self: false }, presence: { key: VIVO.id } } }); VIVO.canal = ch;
    ch.on("broadcast", { event: "pos" }, ({ payload: p }) => {
      let o = VIVO.otros.get(p.id); if (!o) { const m = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 14), new THREE.MeshBasicMaterial({ color: p.guia ? 0xd8c49c : 0xf2f1ec, toneMapped: false })), e = texto("span", "cota persona"); e.textContent = p.nombre + (p.guia ? " · guía" : ""); $("marcas").append(e); capaVivo.add(m); o = { m, e, p }; VIVO.otros.set(p.id, o); }
      o.p = p; o.t = performance.now(); o.m.position.set(p.x, p.y + 1.55, p.z); if (p.guia) VIVO.pose = p;
    });
    ch.on("presence", { event: "sync" }, () => { const n = Object.keys(ch.presenceState()).length, g = $("nGente"); g.hidden = false; g.textContent = `En directo · ${n} ${n === 1 ? "persona" : "personas"}`; });
    ch.on("presence", { event: "leave" }, ({ key }) => { const o = VIVO.otros.get(key); if (o) { capaVivo.remove(o.m); o.e.remove(); VIVO.otros.delete(key); } });
    ch.subscribe(async s => { if (s === "SUBSCRIBED") { await ch.track({ nombre: nombreYo(), guia }); aviso(guia ? "Visita en directo abierta. Comparte el enlace." : "Te has unido a la visita en directo."); } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") aviso("No se ha podido conectar con la visita en directo."); });
  }
  function saleVivo() { if (!VIVO.canal) return; nube.removeChannel(VIVO.canal); VIVO.canal = null; VIVO.otros.forEach(o => { capaVivo.remove(o.m); o.e.remove(); }); VIVO.otros.clear(); $("nGente").hidden = true; aviso("Has salido de la visita en directo."); }
  R.antes.push((dt, ahora) => {
    if (!VIVO.canal) return;
    if (T.modo === "andar" && ahora - VIVO.ult > 120) { VIVO.ult = ahora; VIVO.canal.send({ type: "broadcast", event: "pos", payload: { id: VIVO.id, nombre: nombreYo(), guia: VIVO.guia, x: +T.x.toFixed(2), y: +T.py.toFixed(2), z: +T.z.toFixed(2), yaw: +T.yaw.toFixed(3), pitch: +T.pitch.toFixed(3), nivel: T.nivel } }); }
    if (!VIVO.guia && VIVO.seguir && VIVO.pose && T.modo === "andar") { const p = VIVO.pose, k = 1 - Math.exp(-dt * 4); if (p.nivel !== T.nivel && planos[p.nivel]) usaPlano(p.nivel); T.x += (p.x - T.x) * k; T.z += (p.z - T.z) * k; T.py += (p.y - T.py) * k; T.yaw += (p.yaw - T.yaw) * k; T.pitch += (p.pitch - T.pitch) * k; }
    const q = vista.getBoundingClientRect(); VIVO.otros.forEach((o, id) => { if (ahora - o.t > 15000) { capaVivo.remove(o.m); o.e.remove(); VIVO.otros.delete(id); return; } const v = o.m.position.clone().add(new THREE.Vector3(0, .3, 0)).project(camera), dentro = v.z < 1 && T.modo !== "portada"; o.e.hidden = !dentro; if (dentro) o.e.style.transform = `translate(-50%,-50%) translate(${(v.x + 1) / 2 * q.width}px,${(1 - v.y) / 2 * q.height}px)`; });
  });
  async function visitaDirecto() {
    if (!nube) { aviso("Las visitas en directo no están disponibles en esta copia de la web."); return; }
    if (VIVO.canal) { const f = $("ficha"); f.hidden = false; f.innerHTML = `<h3>Visita en directo</h3><p>Código <b>${esc(VIVO.codigo)}</b>. ${VIVO.guia ? "Las personas invitadas siguen tus pasos." : "Estás siguiendo al guía."}</p>`; if (!VIVO.guia) interruptor(f, "Seguir al guía", VIVO.seguir, v => VIVO.seguir = v); f.append(fila(["Compartir enlace", () => copia(conParam(enlaceCompartir(), "vivo", VIVO.codigo), "Enlace de la visita copiado.")], ["Salir de la visita", () => { saleVivo(); f.hidden = true; }], ["Cerrar", () => f.hidden = true])); return; }
    const codigo = Array.from(crypto.getRandomValues(new Uint8Array(6))).map(v => "abcdefghjkmnpqrstuvwxyz23456789"[v % 31]).join("");
    entraVivo(codigo, true); const url = conParam(enlaceCompartir(), "vivo", codigo);
    if (url.startsWith(base() + "?vivo")) aviso("Para que otras personas entren en esta casa, publícala o ábrela desde un enlace.");
    copia(url, "Enlace de la visita copiado. Envíalo a tus invitados.");
  }
  /* Invitado: entra solo cuando el modelo del enlace está abierto */
  if (PARAMS.get("vivo") && /^[a-z0-9]{6}$/.test(PARAMS.get("vivo"))) { const vigila = setInterval(() => { if (T.modo === "andar") { clearInterval(vigila); entraVivo(PARAMS.get("vivo"), false); } }, 600); }

  /* ---------- Panel del propietario: visitas, tiempo por estancia y solicitudes ---------- */
  function barras(datos, { vertical = false, alto = 220, fmtV = v => v } = {}) {
    if (!datos.length) return '<p class="nota2">Aún no hay datos.</p>';
    const max = Math.max(1, ...datos.map(d => d.v));
    if (vertical) { const n = datos.length, w = 100 / n; return `<div class="graf v" style="--alto:${alto}px">${datos.map(d => `<div class="col" style="width:${w}%" data-t="${esc(d.k)} · ${esc(fmtV(d.v))}"><i style="height:${Math.max(d.v ? 2 : 0, d.v / max * 100)}%"></i></div>`).join("")}<div class="ejeX"><span>${esc(datos[0].k)}</span><span>${esc(datos[n - 1].k)}</span></div></div>`; }
    return `<div class="graf h">${datos.map(d => `<div class="fila-g" data-t="${esc(d.k)} · ${esc(fmtV(d.v))}"><span class="et">${esc(d.k)}</span><span class="pista"><i style="width:${Math.max(1, d.v / max * 100)}%"></i></span><span class="val">${esc(fmtV(d.v))}</span></div>`).join("")}</div>`;
  }
  async function panelDueno() {
    if (!nube) return; if (!usuario) { cuenta2(panelDueno); return; }
    const s = $("panelD"); s.hidden = false; s.innerHTML = `<header><div><span class="eti">Panel</span><h2>Tus casas, <em>en cifras</em>.</h2></div><button class="x" type="button" aria-label="Cerrar">${ico("x")}</button></header><div class="cuerpoD"><span class="puntos" aria-label="Cargando"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div><div class="tip" hidden></div>`;
    s.querySelector(".x").onclick = () => { s.hidden = true; s.textContent = ""; };
    const { data: pr } = await nube.from("proyectos").select("id,nombre,slug").eq("owner", usuario.id);
    const ids = (pr || []).map(p => p.id), nom = Object.fromEntries((pr || []).map(p => [p.id, p.nombre]));
    const [{ data: vi }, { data: co }] = await Promise.all([ids.length ? nube.from("visitas").select("proyecto_id,sesion,estancia,segundos,creado").in("proyecto_id", ids).order("creado", { ascending: false }).limit(5000) : { data: [] }, ids.length ? nube.from("contactos").select("proyecto_id,nombre,contacto,mensaje,creado").in("proyecto_id", ids).order("creado", { ascending: false }).limit(20) : { data: [] }]);
    const v = vi || [], ses = new Set(v.map(x => x.sesion)), seg = v.reduce((a, x) => a + x.segundos, 0), med = ses.size ? seg / ses.size : 0;
    const dias = []; for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5); dias.push({ k: d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }), d: d.toDateString(), s: new Set() }); }
    v.forEach(x => { const d = dias.find(q => q.d === new Date(x.creado).toDateString()); if (d) d.s.add(x.sesion); });
    const porEst = {}; v.forEach(x => { if (x.estancia) porEst[x.estancia] = (porEst[x.estancia] || 0) + x.segundos; });
    const porPro = {}; v.forEach(x => { (porPro[x.proyecto_id] = porPro[x.proyecto_id] || new Set()).add(x.sesion); });
    const min = t => t >= 60 ? `${Math.round(t / 60)} min` : `${Math.round(t)} s`;
    s.querySelector(".cuerpoD").innerHTML = `
      <div class="tiles"><div><b>${(pr || []).length}</b><span>proyectos</span></div><div><b>${ses.size}</b><span>visitas</span></div><div><b>${min(med)}</b><span>tiempo medio</span></div><div><b>${(co || []).length}</b><span>solicitudes</span></div></div>
      <section><h3>Visitas por día · últimos 30 días</h3>${barras(dias.map(d => ({ k: d.k, v: d.s.size })), { vertical: true, fmtV: n => n + (n === 1 ? " visita" : " visitas") })}</section>
      <div class="dos"><section><h3>Tiempo por estancia</h3>${barras(Object.entries(porEst).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, x]) => ({ k, v: x })), { fmtV: min })}</section>
      <section><h3>Visitas por proyecto</h3>${barras(Object.entries(porPro).sort((a, b) => b[1].size - a[1].size).slice(0, 10).map(([k, x]) => ({ k: nom[k] || "Proyecto", v: x.size })))}</section></div>
      <section><h3>Últimas solicitudes de visita</h3>${(co || []).length ? `<table class="tablaR"><thead><tr><th>Persona</th><th>Proyecto</th><th>Fecha</th></tr></thead><tbody>${co.map(c => `<tr><td><b>${esc(c.nombre)}</b><small>${esc(c.contacto)}${c.mensaje ? " · " + esc(c.mensaje) : ""}</small></td><td>${esc(nom[c.proyecto_id] || "")}</td><td>${new Date(c.creado).toLocaleDateString("es-ES")}</td></tr>`).join("")}</tbody></table>` : '<p class="nota2">Aún no hay solicitudes.</p>'}</section>`;
    const tip = s.querySelector(".tip");
    s.querySelectorAll("[data-t]").forEach(el => { el.onpointerenter = () => { tip.textContent = el.dataset.t; tip.hidden = false; }; el.onpointermove = e => { tip.style.transform = `translate(${e.clientX + 14}px,${e.clientY - 34}px)`; }; el.onpointerleave = () => tip.hidden = true; });
  }

  /* ---------- Galería de proyectos publicados ---------- */
  async function galeria() {
    const s = $("galeria"); s.hidden = false; cierraPanel();
    s.innerHTML = `<header><div><span class="eti">Galería</span><h2>Casas que se <em>recorren</em>.</h2></div><button class="x" type="button" aria-label="Cerrar">${ico("x")}</button></header><div class="tarjetas"></div>`;
    s.querySelector(".x").onclick = () => { s.hidden = true; s.textContent = ""; };
    const caja = s.querySelector(".tarjetas"), tarjeta = (img, nombre, fecha, f) => { const b = texto("button", "tarjetaG"); b.type = "button"; b.innerHTML = `<span class="img">${img ? `<img alt="" loading="lazy">` : ""}</span><span class="info"><b></b><small></small></span>`; if (img) b.querySelector("img").src = img; b.querySelector("b").textContent = nombre; b.querySelector("small").textContent = fecha; b.onclick = f; caja.append(b); };
    let foto = null; try { if (T.modo === "portada" && pf.listo) foto = vistaPortada(); } catch (e) {}
    tarjeta(foto, "Villa de ejemplo", "Recorrido de muestra", () => { s.hidden = true; $("muestra").click(); });
    if (!nube) return;
    const { data, error } = await nube.from("proyectos").select("nombre,slug,miniatura,actualizado").eq("publico", true).eq("en_galeria", true).order("actualizado", { ascending: false }).limit(30);
    if (error) { caja.insertAdjacentHTML("beforeend", '<p class="nota2">No se ha podido cargar la galería.</p>'); return; }
    (data || []).forEach(p => tarjeta(p.miniatura, p.nombre, new Date(p.actualizado).toLocaleDateString("es-ES", { month: "long", year: "numeric" }), () => { s.hidden = true; try { history.replaceState(null, "", enlaceDe(p.slug)); } catch (e) {} abreProyecto(p.slug); }));
    if (!(data || []).length) caja.insertAdjacentHTML("beforeend", '<p class="nota2 vacio">Publica un modelo y actívalo en «Mis proyectos» para que aparezca aquí.</p>');
  }

  /* ---------- App instalable y sin conexión ---------- */
  let instalar0 = null;
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); instalar0 = e; });
  if ("serviceWorker" in navigator && location.protocol === "https:" && !EMBEBIDO) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  async function instalaApp() {
    if (instalar0) { instalar0.prompt(); const r = await instalar0.userChoice; if (r.outcome === "accepted") aviso("INNRA3D instalada."); instalar0 = null; return; }
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) aviso("En iPhone: pulsa Compartir y luego «Añadir a pantalla de inicio».");
    else if (matchMedia("(display-mode: standalone)").matches) aviso("Ya estás usando la app instalada.");
    else aviso("Abre el menú del navegador y elige «Instalar aplicación».");
  }
