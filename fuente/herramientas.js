  /* ---------- Herramientas ----------
     Todo lo que crea el usuario vive en D y se guarda por modelo. */
  const enClaude = !!(window.claude && window.claude.use);
  const capa = new THREE.Group(); scene.add(capa);
  const capaMuebles = new THREE.Group(), capaMedidas = new THREE.Group(), capaOrbes = new THREE.Group(), capaGente = new THREE.Group();
  capa.add(capaMuebles, capaMedidas, capaOrbes, capaGente);
  const vacioD = () => ({ puntos: [], muebles: [], vistas: [], suelo: "", pared: "", amb: "" });
  let D = vacioD();
  const H = { modo: null, a: null, medidas: [], reto: null, sonido: null, rec: null, foto: false, stats: {}, calor: new Map(), verCalor: false, fuentes: null };
  const claveD = () => "pc:datos:" + (cfg.name || "");
  const guardaD = () => { guarda.poner(claveD(), D); nubeGuarda(); };
  const texto = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };
  const lector = sel => new Promise(ok => { const i = document.createElement("input"); i.type = "file"; i.accept = sel; i.onchange = () => ok(i.files[0] || null); i.click(); });
  async function guardar(blob, nombre) {
    const dl = enClaude ? await window.claude.use("downloads") : null;
    if (dl) { try { await dl.save({ filename: nombre, data: blob }); aviso("Archivo guardado."); } catch (e) { if (e.code !== "declined") aviso("No se ha podido guardar el archivo."); } return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 6e4); aviso("Archivo guardado.");
  }

  /* Punto real bajo el puntero */
  const rayoP = new THREE.Raycaster(), ptrV = new THREE.Vector2();
  function puntoEn(ex, ey) {
    const q = vista.getBoundingClientRect(), fijo = document.pointerLockElement === vista;
    ptrV.set(fijo ? 0 : (ex - q.left) / q.width * 2 - 1, fijo ? 0 : -(ey - q.top) / q.height * 2 + 1);
    rayoP.setFromCamera(ptrV, camera); const o = rayoP.ray.origin, d = rayoP.ray.direction, t = rayo(o.x, o.y, o.z, d.x, d.y, d.z, 300);
    if (t === Infinity) { if (T.virtual && d.y < 0) return o.clone().addScaledVector(d, (T.sueloV - o.y) / d.y); return null; }
    return o.clone().addScaledVector(d, t);
  }
  function modoH(m, msg) {
    H.modo = m; H.a = null; $("modoH").hidden = !m;
    if (m) { $("modoTxt").textContent = msg; if (document.pointerLockElement) document.exitPointerLock(); }
    vista.style.cursor = m ? "crosshair" : "";
  }

  /* Medir */
  function marca3D(p) { const e = new THREE.Mesh(new THREE.SphereGeometry(.018, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, toneMapped: false })); e.position.copy(p); e.renderOrder = 9; capaMedidas.add(e); }
  function medirPunto(p) {
    marca3D(p);
    if (!H.a) { H.a = p; $("modoTxt").textContent = "Pulsa el segundo punto"; return; }
    const a = H.a, l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, p]), new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, toneMapped: false }));
    l.renderOrder = 9; capaMedidas.add(l);
    const dist = a.distanceTo(p), dy = Math.abs(a.y - p.y), e = texto("span", "cota");
    e.textContent = fmt(dist) + " m" + (dy > .05 ? ` · alto ${fmt(dy)}` : ""); $("marcas").append(e);
    H.medidas.push({ p: a.clone().lerp(p, .5), e, dist }); H.a = null; $("modoTxt").textContent = "Pulsa dos puntos para medir";
  }
  function borraMedidas() { H.medidas.forEach(m => m.e.remove()); H.medidas = []; capaMedidas.clear(); H.a = null; }

  /* Puntos de información */
  let marcasP = [];
  function pintaPuntos() {
    marcasP.forEach(m => m.remove());
    marcasP = D.puntos.map((p, i) => { const b = texto("button", "punto"); b.type = "button"; b.setAttribute("aria-label", p.t || "Punto de información"); b.addEventListener("click", () => ficha(i)); $("marcas").append(b); return b; });
  }
  function ficha(i) {
    const p = D.puntos[i], f = $("ficha"); f.textContent = ""; f.hidden = false;
    const h = texto("h3"); h.textContent = p.t || "Sin título"; f.append(h);
    if (p.img) { const m = texto("img"); m.src = p.img; m.alt = p.t || ""; f.append(m); }
    if (p.d) { const d = texto("p"); d.textContent = p.d; f.append(d); }
    if (p.u && /^https?:\/\//i.test(p.u)) { const a = texto("a"); a.href = p.u; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Abrir enlace"; f.append(a); }
    const fila = texto("div", "fila"), mk = (t, fn) => { const b = texto("button", "tool"); b.type = "button"; b.textContent = t; b.onclick = fn; fila.append(b); };
    mk("Editar", () => editaPunto(i)); mk("Borrar", () => { D.puntos.splice(i, 1); guardaD(); pintaPuntos(); f.hidden = true; }); mk("Cerrar", () => f.hidden = true);
    f.append(fila);
  }
  function editaPunto(i) {
    const p = D.puntos[i], f = $("ficha"); f.hidden = false;
    f.innerHTML = '<label class="ajuste">Título<input id="pT" type="text" maxlength="80"></label><label class="ajuste">Texto<textarea id="pD" rows="3" maxlength="600"></textarea></label><label class="ajuste">Enlace<input id="pU" type="text" placeholder="https://"></label><div class="fila"><button id="pF" class="tool" type="button">Añadir foto</button><button id="pG" class="tool" type="button">Guardar</button></div>';
    $("pT").value = p.t || ""; $("pD").value = p.d || ""; $("pU").value = p.u || ""; $("pT").focus();
    $("pF").onclick = async () => {
      const a = await lector("image/*"); if (!a) return;
      const im = await createImageBitmap(a), k = Math.min(1, 900 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = im.width * k; c.height = im.height * k; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      p.img = c.toDataURL("image/jpeg", .78); $("pF").textContent = "Foto añadida";
    };
    $("pG").onclick = () => { p.t = $("pT").value.trim(); p.d = $("pD").value.trim(); p.u = $("pU").value.trim(); guardaD(); pintaPuntos(); ficha(i); };
  }

  /* Muebles */
  const CATALOGO = {
    "Sofá": [[2.1, .42, .9, 0, .21, 0, "#8b8678"], [2.1, .4, .22, 0, .6, -.34, "#8b8678"]],
    "Butaca": [[.8, .42, .8, 0, .21, 0, "#55524a"], [.8, .42, .18, 0, .6, -.31, "#55524a"]],
    "Mesa": [[1.8, .05, .9, 0, .73, 0, "#a57a4f"], [.07, .71, .7, -.8, .355, 0, "#222222"], [.07, .71, .7, .8, .355, 0, "#222222"]],
    "Silla": [[.45, .05, .45, 0, .45, 0, "#a57a4f"], [.45, .42, .04, 0, .68, -.2, "#a57a4f"], [.04, .45, .4, -.2, .22, 0, "#222222"], [.04, .45, .4, .2, .22, 0, "#222222"]],
    "Cama": [[1.7, .28, 2.05, 0, .14, 0, "#a57a4f"], [1.6, .22, 1.95, 0, .39, 0, "#e7e4dc"]],
    "Armario": [[1.6, 2.2, .6, 0, 1.1, 0, "#b8a488"]],
    "Estante": [[1.2, 1.9, .3, 0, .95, 0, "#3a3a38"]],
    "Planta": [[.34, .36, .34, 0, .18, 0, "#a85b3a"], [.5, .9, .5, 0, .8, 0, "#3f6b45"]]
  };
  /* Cada color del catálogo usa un material real: tela, nogal, metal, cerámica u hojas */
  const MAT_MUEBLE = { "#8b8678": "tela_gris", "#55524a": "tela_acento", "#a57a4f": "nogal", "#222222": "metal_negro", "#e7e4dc": "tela_crema", "#b8a488": "lacado_arena", "#3a3a38": "metal_negro", "#a85b3a": "maceta", "#3f6b45": "hoja_tropical" };
  const matMueble = c => (MAT_MUEBLE[c] && materialReal({ name: MAT_MUEBLE[c], color: new THREE.Color(c) })) || new THREE.MeshStandardMaterial({ color: c, roughness: .75 });
  pide("geometries/RoundedBoxGeometry.js").catch(() => {});
  function creaMueble(m) {
    const g = new THREE.Group();
    (CATALOGO[m.k] || []).forEach(([w, h, d, x, y, z, c]) => { const geo = THREE.RoundedBoxGeometry ? new THREE.RoundedBoxGeometry(w, h, d, 3, Math.min(.04, w / 4, h / 4, d / 4)) : new THREE.BoxGeometry(w, h, d), e = new THREE.Mesh(geo, matMueble(c)); e.position.set(x, y, z); e.castShadow = e.receiveShadow = true; g.add(e); });
    g.position.set(m.x, m.y, m.z); g.rotation.y = m.r || 0; g.userData.m = m; capaMuebles.add(g); return g;
  }
  function pintaMuebles() { capaMuebles.clear(); D.muebles.forEach(creaMueble); }
  function clicMueble(ex, ey) {
    if (!capaMuebles.children.length) return false;
    const q = vista.getBoundingClientRect(); ptrV.set((ex - q.left) / q.width * 2 - 1, -(ey - q.top) / q.height * 2 + 1); rayoP.setFromCamera(ptrV, camera);
    const i = rayoP.intersectObject(capaMuebles, true)[0]; if (!i) return false;
    let o = i.object; while (o.parent !== capaMuebles) o = o.parent;
    hojaLista(o.userData.m.k, [["Girar 45°", () => { const m = o.userData.m; m.r = (m.r || 0) + Math.PI / 4; o.rotation.y = m.r; guardaD(); }], ["Mover", () => { hoja(null); H.mover = o; modoH("mueble", "Pulsa el suelo para mover el objeto"); }], ["Borrar", () => { D.muebles = D.muebles.filter(x => x !== o.userData.m); capaMuebles.remove(o); guardaD(); hoja(null); }]]);
    return true;
  }

  /* Materiales y ambiente */
  const TONOS = { suelo: { Roble: 0xffffff, Nogal: 0x8f7562, Cemento: 0xa7a8a6, Blanqueado: 0xfff4e8 }, pared: { Blanco: 0xffffff, Arena: 0xe9d9c0, Salvia: 0xc3d0c0, Azul: 0xbccbd6 } };
  function aplicaAcabados() {
    if (!T.muestra) return;
    raiz.traverse(o => { if (!o.isMesh) return; const n = o.userData.nom; if (n === "roble" && D.suelo) o.material.color.setHex(TONOS.suelo[D.suelo]); if (n === "yeso" && D.pared) o.material.color.setHex(TONOS.pared[D.pared]); });
  }
  const AMB = { Natural: "", Amanecer: "sepia(.32) saturate(1.15) brightness(1.03)", Atardecer: "sepia(.55) saturate(1.45) hue-rotate(-10deg) brightness(.92)", Noche: "brightness(.42) saturate(.75) hue-rotate(195deg) sepia(.12)", Blanco: "grayscale(1) contrast(1.05) brightness(1.08)" };
  const esLit = g => { let s = false; g.traverse(o => { if (o.isMesh && [].concat(o.material).some(m => m && m.isMeshStandardMaterial)) s = true; }); return s; };
  function aplicaAmb() { if (T.modo !== "portada" && !T.muestra && T.modelo && esLit(T.modelo)) { vista.style.filter = ""; const n = D.amb || "Natural", L = solEn(new THREE.Box3().setFromObject(T.modelo), n); pasaEnv(T.modelo, L.e); scene.background.setHex(L.cielo); renderer.shadowMap.needsUpdate = true; return; } vista.style.filter = AMB[D.amb] || ""; }

  /* Reto */
  function finReto() { capaOrbes.clear(); H.reto = null; $("crono").hidden = true; }
  function iniciaReto() {
    finReto(); if (!P) return;
    const cel = []; for (let k = 0; k < P.free.length; k += 7) if (P.free[k] && P.clear[k] > .5) cel.push(k);
    const orb = [], n = Math.min(8, Math.max(4, salas.length));
    for (let i = 0; i < n * 40 && orb.length < n && cel.length; i++) {
      const k = cel[Math.floor(Math.random() * cel.length)], x = P.ox + ((k % P.w) + .5) * P.cell, z = P.oz + (Math.floor(k / P.w) + .5) * P.cell;
      if (orb.some(o => Math.hypot(o.position.x - x, o.position.z - z) < 2.5) || Math.hypot(x - T.x, z - T.z) < 2) continue;
      const g = sueloEn(x, P.floorY, z); if (g === null) continue;
      const e = new THREE.Mesh(new THREE.SphereGeometry(.09, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); e.position.set(x, g + 1.1, z); capaOrbes.add(e); orb.push(e);
    }
    H.reto = { orb, t0: performance.now(), n: orb.length }; $("crono").hidden = false; aviso(`Encuentra las ${orb.length} luces lo antes posible.`);
  }
  const reloj = ms => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

  /* Sonido sintetizado */
  function alternaSonido() {
    if (H.sonido) { H.sonido.ac.close(); H.sonido = null; aviso("Sonido desactivado."); return; }
    const ac = new (window.AudioContext || window.webkitAudioContext)(), b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); let u = 0;
    for (let i = 0; i < d.length; i++) { u = (u + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = u * 3.5; }
    const s = ac.createBufferSource(); s.buffer = b; s.loop = true; const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 280; const g = ac.createGain(); g.gain.value = .05; s.connect(f).connect(g).connect(ac.destination); s.start();
    H.sonido = { ac, f, paso: 0 }; aviso("Sonido activado.");
  }
  function sonidoPaso() {
    const ac = H.sonido.ac, n = ac.createBufferSource(), b = ac.createBuffer(1, ac.sampleRate * .09, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * .16));
    n.buffer = b; const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 500 + Math.random() * 300; const g = ac.createGain(); g.gain.value = .18; n.connect(f).connect(g).connect(ac.destination); n.start();
  }
  function ding() { if (!H.sonido) return; const ac = H.sonido.ac, o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(.12, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .5); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + .5); }

  /* Captura */
  function alternaVideo() {
    if (H.rec) { H.rec.stop(); return; }
    if (!vista.captureStream || !window.MediaRecorder) { aviso("Este navegador no permite grabar vídeo."); return; }
    const tipo = ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find(t => MediaRecorder.isTypeSupported(t)), r = new MediaRecorder(vista.captureStream(30), { mimeType: tipo, videoBitsPerSecond: 8e6 }), tr = [];
    r.ondataavailable = e => e.data.size && tr.push(e.data);
    r.onstop = () => { H.rec = null; $("grabando").hidden = true; guardar(new Blob(tr, { type: tipo.split(";")[0] }), `${T.nombre || "recorrido"}.${tipo.includes("mp4") ? "mp4" : "webm"}`); };
    r.start(500); H.rec = r; $("grabando").hidden = false;
  }

  /* Plano exportable */
  function exportaPlano() {
    if (!P || !P.caja) return;
    const c = document.createElement("canvas"), W = 2400, H0 = 1800; c.width = W; c.height = H0;
    const g = c.getContext("2d"), b = P.caja, m = 170, s = Math.min((W - m * 2) / (b.xb - b.xa), (H0 - m * 2) / (b.zb - b.za));
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H0);
    const o = document.createElement("canvas"); o.width = P.w; o.height = P.h; const q = o.getContext("2d"), im = q.createImageData(P.w, P.h);
    for (let k = 0; k < P.w * P.h; k++) im.data[k * 4 + 3] = P.block[k] === 2 ? 255 : P.block[k] ? 55 : 0;
    q.putImageData(im, 0, 0);
    const ox = (W - (b.xb - b.xa) * s) / 2, oz = (H0 - (b.zb - b.za) * s) / 2, X = x => ox + (x - b.xa) * s, Z = z => oz + (z - b.za) * s;
    g.drawImage(o, X(P.ox), Z(P.oz), P.w * P.cell * s, P.h * P.cell * s); g.fillStyle = "#111"; g.textAlign = "center";
    salas.filter(r => r.nivel === T.nivel).forEach(r => { g.font = "500 30px Geist, Arial"; g.fillText(r.nombre, X(r.x), Z(r.z)); g.font = "400 22px Geist Mono, monospace"; g.fillText(fmt(r.area, 1) + " m²", X(r.x), Z(r.z) + 32); });
    g.textAlign = "left"; g.font = "500 30px Geist, Arial"; g.fillText(T.nombre || "Plano", 70, 86);
    g.font = "400 22px Geist Mono, monospace"; g.fillText(`${fmt(salas.reduce((a, r) => a + r.area, 0), 0)} m² · ${salas.length} estancias · techo ${fmt(P.ceilH)} m`, 70, 124);
    const ba = 2 * s; g.fillRect(70, H0 - 76, ba, 4); g.fillText("2 m", 84 + ba, H0 - 66);
    c.toBlob(bl => guardar(bl, `plano-${T.nombre || "modelo"}.png`), "image/png");
  }

  /* Estadísticas de esta visita */
  function informe() {
    const fil = salas.map(s => [s.nombre, H.stats[s.i] || 0, s.area]).sort((a, b) => b[1] - a[1]), tot = fil.reduce((a, f) => a + f[1], 0), h = $("hoja"), max = Math.max(...fil.map(f => f[1]), 1);
    h.textContent = ""; h.hidden = false; h.dataset.tipo = "informe";
    const r = texto("div", "ajuste"); r.innerHTML = `<span>Distancia<span class="dato">${fmt(T.andado, 0)} m</span></span><span>Tiempo<span class="dato">${reloj(tot * 1000)}</span></span>`; h.append(r);
    fil.forEach(f => { const d = texto("div", "barraE"), n = texto("span"), v = texto("span", "dato"), b = texto("i"); n.textContent = f[0]; v.textContent = reloj(f[1] * 1000); b.style.width = f[1] / max * 100 + "%"; d.append(n, v, b); h.append(d); });
    const fi = texto("div", "fila"), mk = (t, fn) => { const b = texto("button", "tool"); b.type = "button"; b.textContent = t; b.onclick = fn; fi.append(b); return b; };
    mk("Exportar CSV", () => guardar(new Blob(["Estancia;Segundos;Metros cuadrados\n" + fil.map(f => `${f[0]};${Math.round(f[1])};${f[2].toFixed(1)}`).join("\n")], { type: "text/csv" }), "estadisticas.csv"));
    const c = mk(H.verCalor ? "Ocultar calor" : "Mapa de calor", () => { H.verCalor = !H.verCalor; c.textContent = H.verCalor ? "Ocultar calor" : "Mapa de calor"; if (H.verCalor) plano(true); });
    h.append(fi);
  }
  function capaCalor(ctx, X, Z, s) {
    if (!H.verCalor) return; let mx = 1; H.calor.forEach(v => mx = Math.max(mx, v)); ctx.fillStyle = "#fff";
    H.calor.forEach((v, k) => { const [n, c] = k.split(":").map(Number); if (n !== T.nivel) return; ctx.globalAlpha = .12 + .6 * v / mx; ctx.beginPath(); ctx.arc(X(P.ox + ((c % P.w) + .5) * P.cell), Z(P.oz + (Math.floor(c / P.w) + .5) * P.cell), Math.max(3, s * .4), 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
  }

  /* Listas y vistas */
  function hojaLista(tit, items, extra) {
    const h = $("hoja"); h.textContent = ""; h.hidden = false; h.dataset.tipo = "lista";
    const t = texto("span", "dato"); t.textContent = tit; t.style.padding = "6px 10px"; h.append(t);
    items.forEach(([n, f, on]) => { const b = texto("button", "linea"); b.type = "button"; b.textContent = n; if (on) b.setAttribute("aria-pressed", "true"); b.onclick = f; h.append(b); });
    if (extra) h.append(extra);
  }
  function vistasHoja() {
    const it = [["Guardar esta vista", () => { D.vistas.push({ n: "Vista " + (D.vistas.length + 1), x: T.x, y: T.py, z: T.z, yaw: T.yaw, pitch: T.pitch }); guardaD(); vistasHoja(); }]];
    D.vistas.forEach(v => it.push([v.n, () => { hoja(null); $("velo").style.opacity = 1; setTimeout(() => { T.x = v.x; T.py = v.y; T.z = v.z; T.yaw = v.yaw; T.pitch = v.pitch; T.vx = T.vz = 0; $("velo").style.opacity = 0; }, 170); }]));
    hojaLista("Vistas", it);
  }
  function corteHoja() {
    if (T.modo === "andar") maqueta();
    const d = texto("div", "ajuste"), mx = P.ceilH + .4;
    d.innerHTML = `<span><label for="corteR">Altura del corte</label><output id="vCor" class="dato"></output></span><input id="corteR" type="range" min=".2" max="${mx}" step=".01" value="${Math.min(2.25, P.ceilH - .35)}">`;
    hojaLista("Corte", [], d);
    const r = $("corteR"), f = () => { $("vCor").textContent = fmt(+r.value) + " m"; T.corte = +r.value; }; r.oninput = f; f();
  }

  /* Proyecto: ZIP con el modelo y todo lo añadido */
  async function zipProyecto() {
    if (!H.fuentes) return null;
    await pide("libs/fflate.min.js");
    const e = {};
    for (const f of H.fuentes) {
      const b = new Uint8Array(await f.arrayBuffer());
      if (ext(f.name) === "zip") { const z = fflate.unzipSync(b); for (const k in z) if (!k.endsWith("/") && !/planta\.json$/.test(k)) e[k] = z[k]; } else e[f.name] = b;
    }
    e["planta.json"] = new TextEncoder().encode(JSON.stringify({ v: 1, nombre: T.nombre, datos: D, nombres: guarda.leer("pc:nombres:" + cfg.name) || [], scale: T.auto * T.scale, eye: T.eye }));
    return new Blob([fflate.zipSync(e, { level: 6 })], { type: "application/zip" });
  }
  async function exportaProyecto() { const b = await zipProyecto(); if (b) guardar(b, `${T.nombre}-proyecto.zip`); }
  async function exportaGLB() {
    await pide("exporters/GLTFExporter.js"); aviso("Preparando el GLB…");
    new THREE.GLTFExporter().parse(T.modelo, async r => {
      if (enClaude) { await pide("libs/fflate.min.js"); guardar(new Blob([fflate.zipSync({ [T.nombre + ".glb"]: new Uint8Array(r) })], { type: "application/zip" }), `${T.nombre}-glb.zip`); }
      else guardar(new Blob([r], { type: "model/gltf-binary" }), `${T.nombre || "modelo"}-optimizado.glb`);
    }, () => aviso("No se ha podido exportar el modelo."), { binary: true, maxTextureSize: 2048 });
  }

  /* Compartir y sala: en GitHub Pages el enlace apunta a la carpeta modelos/ */
  const servicio = n => enClaude ? window.claude.use(n) : Promise.resolve(null);
  async function copia(url, msg) { try { await navigator.clipboard.writeText(url); aviso(msg); } catch (e) { aviso(url); } }
  async function compartir() {
    const [as, db] = await Promise.all([servicio("assets"), servicio("db")]);
    if (!as || !db) { aviso("Solo el propietario puede compartir aquí. También puedes guardar el proyecto y enviar el ZIP."); return; }
    const b = await zipProyecto(); if (!b) return;
    if (b.size > 14.5 * 1048576) { aviso(`El proyecto pesa ${fmt(b.size / 1048576, 1)} MB y el máximo aquí es 14,5 MB.`); return; }
    aviso("Subiendo…");
    try {
      const bytes = new Uint8Array(await b.arrayBuffer()); let s = ""; for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
      const r = await as.upload(new Blob([btoa(s)], { type: "text/plain" }), { type: "text/plain" }), id = Math.random().toString(36).slice(2, 12);
      await db.doc("modelos/" + id).set({ asset: r.id, nombre: T.nombre, creado: Date.now() });
      location.hash = "m-" + id; copia(location.href, "Enlace copiado. Lo verá quien tenga acceso a la página.");
    } catch (e) { aviso("No se ha podido compartir: " + (e.code || e.message)); }
  }
  async function abreCompartido() {
    const m = location.hash.match(/^#m-([a-z0-9]+)$/); if (!m) return false;
    const db = await servicio("db"); if (!db) return false;
    ocupado(true); await estado("Abriendo el modelo compartido");
    try {
      const s = await db.doc("modelos/" + m[1]).get(); if (!s.exists) throw new Error("No encuentro ese modelo compartido.");
      const txt = await (await fetch("/_blob/" + s.data().asset)).text(), bin = atob(txt), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      await cargar([new File([u], s.data().nombre + ".zip")]);
    } catch (e) { fallo(motivo(e)); }
    return true;
  }
  function contacto() {
    if (nube && H.proyecto) { contactoNube(); return; }
    const f = $("ficha"); f.hidden = false;
    if (enClaude) {
      f.innerHTML = '<h3>Pedir visita</h3><label class="ajuste">Nombre<input id="cN" type="text" maxlength="80" autocomplete="name"></label><label class="ajuste">Correo o teléfono<input id="cC" type="text" maxlength="120"></label><label class="ajuste">Mensaje<textarea id="cM" rows="3" maxlength="600"></textarea></label><div class="fila"><button id="cE" class="tool" type="button">Enviar</button><button id="cX" class="tool" type="button">Cerrar</button></div>';
      $("cX").onclick = () => f.hidden = true;
      $("cE").onclick = async () => {
        const n = $("cN").value.trim(), c = $("cC").value.trim(), db = await servicio("db"); if (!n || !c) { aviso("Escribe tu nombre y cómo contactarte."); return; }
        if (!db) { aviso("Tu acceso no permite enviar solicitudes aquí."); return; }
        try { await db.collection("contactos").add({ n, c, m: $("cM").value.trim(), modelo: T.nombre, t: Date.now() }); f.hidden = true; aviso("Solicitud enviada."); } catch (e) { aviso("Tu acceso no permite enviar solicitudes aquí."); }
      };
    } else {
      f.textContent = ""; const h = texto("h3"), p = texto("p"), c = texto("button", "tool"); h.textContent = "Contacto"; p.textContent = CONFIG.contacto; p.style.userSelect = "text"; c.type = "button"; c.textContent = "Cerrar"; c.onclick = () => f.hidden = true; f.append(h, p, c);
    }
  }
  async function solicitudes() {
    const db = await servicio("db"); if (!db) return;
    try {
      const q = await db.collection("contactos").orderBy("t", "desc").limit(40).get(), h = $("hoja"); h.textContent = ""; h.hidden = false; h.dataset.tipo = "lista";
      if (!q.docs.length) { const p = texto("p", "dato"); p.textContent = "Aún no hay solicitudes."; p.style.padding = "8px 10px"; h.append(p); }
      q.docs.forEach(d => { const v = d.data(), e = texto("div", "ajuste"), m = texto("span", "dato"); e.textContent = `${v.n} · ${v.c}`; m.textContent = v.m || ""; e.append(m); h.append(e); });
    } catch (e) { aviso("Solo el propietario puede ver las solicitudes."); }
  }
  const gente = new Map(); let sala = null;
  async function alternaSala() {
    if (sala) { await sala.leave(); sala = null; capaGente.clear(); gente.clear(); aviso("Has salido de la sala."); return; }
    const room = await servicio("room"); if (!room) { aviso("La sala necesita sesión iniciada en Claude."); return; }
    try {
      sala = await room.join("m-" + ((cfg.name || "x").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40) || "x"));
      sala.onPeers(c => {
        c.left.forEach(p => { const e = gente.get(p.peer); if (e) { capaGente.remove(e); gente.delete(p.peer); } });
        c.peers.forEach(p => {
          if (p.sameTab || typeof p.presence.x !== "number") return; let e = gente.get(p.peer);
          if (!e) { e = new THREE.Mesh(new THREE.CapsuleGeometry(.16, 1.1, 6, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .4 })); capaGente.add(e); gente.set(p.peer, e); }
          e.position.set(+p.presence.x || 0, (+p.presence.y || 0) + .85, +p.presence.z || 0);
        });
      });
      aviso("Dentro de la sala. Quien abra este modelo y entre te verá.");
    } catch (e) { sala = null; aviso("No se ha podido entrar en la sala."); }
  }

  /* Gafas VR */
  let xrOK = false, xrSes = null, rig = null;
  if (navigator.xr && navigator.xr.isSessionSupported) navigator.xr.isSessionSupported("immersive-vr").then(v => xrOK = v, () => {});
  async function entrarVR() {
    if (xrSes) { xrSes.end(); return; }
    try {
      renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType("local-floor");
      xrSes = await navigator.xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor"] }); await renderer.xr.setSession(xrSes);
      if (!rig) { rig = new THREE.Group(); scene.add(rig); } rig.add(camera);
      xrSes.addEventListener("end", () => { xrSes = null; renderer.xr.enabled = false; rig.remove(camera); });
    } catch (e) { aviso("No se ha podido iniciar la realidad virtual."); }
  }
  function pasoVR(dt) {
    let ax = 0, ay = 0; for (const s of xrSes.inputSources) if (s.gamepad && s.gamepad.axes.length >= 4) { ax = s.gamepad.axes[2]; ay = s.gamepad.axes[3]; }
    const sy = Math.sin(T.yaw), cy = Math.cos(T.yaw);
    if (Math.abs(ax) + Math.abs(ay) > .15) {
      const dx = (sy * ay + cy * ax) * 1.8 * dt, dz = (cy * ay - sy * ax) * 1.8 * dt, l = Math.hypot(dx, dz) || 1e-6, g = T.libre ? T.py : sueloEn(T.x + dx, T.py, T.z + dz);
      if (g !== null && rayo(T.x, T.py + 1, T.z, dx / l, 0, dz / l, RADIO) === Infinity) { T.x += dx; T.z += dz; T.py = g; }
    }
    rig.position.set(T.x, T.py, T.z); rig.rotation.y = T.yaw;
  }

  /* Menú */
  function AGRUPA() {
    const m = T.muestra, it = [], add = (g, n, d, f, k) => it.push({ g, n, d, f, k });
    if (C) {
      add("Medir y anotar", "Medir", "Distancia real entre dos puntos", () => modoH("medir", "Pulsa dos puntos para medir"), "1");
      if (H.medidas.length) add("Medir y anotar", "Borrar medidas", "Quita las cotas de la vista", borraMedidas);
      add("Medir y anotar", "Punto de información", "Marca con texto, foto y enlace", () => modoH("punto", "Pulsa donde quieras colocar el punto"), "2");
    }
    add("Medir y anotar", "Vistas guardadas", "Guarda y recupera encuadres", vistasHoja);
    if (C) add("Diseñar", "Colocar mueble", "Prueba mobiliario a escala", () => hojaLista("Colocar", Object.keys(CATALOGO).map(k => [k, () => { hoja(null); H.mover = null; H.nuevo = k; modoH("mueble", "Pulsa el suelo para colocar: " + k.toLowerCase()); }])));
    if (m) {
      add("Diseñar", "Color del suelo", "Cambia el acabado del suelo", () => hojaLista("Suelo", Object.keys(TONOS.suelo).map(k => [k, () => { D.suelo = k; guardaD(); aplicaAcabados(); }])));
      add("Diseñar", "Color de paredes", "Cambia el acabado de las paredes", () => hojaLista("Paredes", Object.keys(TONOS.pared).map(k => [k, () => { D.pared = k; guardaD(); aplicaAcabados(); }])));
    }
    add("Diseñar", "Ambiente", "Amanecer, atardecer, noche o blanco", () => hojaLista("Ambiente", Object.keys(AMB).map(k => [k, () => { D.amb = k === "Natural" ? "" : k; guardaD(); aplicaAmb(); }])));
    if (P) add("Diseñar", "Corte de sección", "Ajusta el corte de la maqueta", corteHoja);
    add("Capturar", "Foto", "Guarda la imagen actual en PNG", () => H.foto = true, "3");
    add("Capturar", "Grabar vídeo", H.rec ? "Detiene y guarda la grabación" : "Empieza a grabar lo que ves", alternaVideo, "4");
    if (P) add("Capturar", "Exportar plano", "PNG con superficies y escala", exportaPlano);
    add("Capturar", "Modo presentación", "Oculta la interfaz. Esc la recupera", () => $("app").classList.add("limpio"), "H");
    if (xrOK) add("Capturar", "Gafas de realidad virtual", "Entra con tu visor", entrarVR);
    agregaIA(add); agregaNube(add);
    if (salas.length) add("Datos", "Estadísticas", "Tiempo por estancia y mapa de calor", informe);
    if (enClaude || CONFIG.contacto || (nube && H.proyecto)) add("Datos", "Pedir visita", "Contacto con quien publica el modelo", contacto);
    if (enClaude) add("Datos", "Ver solicitudes", "Mensajes recibidos", solicitudes);
    if (!m) {
      if (enClaude) add("Archivo", "Compartir enlace", "Publica este modelo para quien tenga acceso", compartir);
      else if (H.ruta) add("Archivo", "Copiar enlace", "Enlace directo a este modelo", () => copia(location.href, "Enlace copiado."));
      if (H.fuentes) add("Archivo", "Guardar proyecto", "ZIP con modelo, puntos y muebles", exportaProyecto);
      add("Archivo", "Exportar GLB", "Convierte a GLB con texturas de 2048 px", exportaGLB);
    }
    add("Archivo", "Ajustes del modelo", "Brillo, altura, tamaño y paso libre", () => hoja("ajustes"));
    add("Archivo", "Preferencias", "Velocidad, sensibilidad, visión y calidad", () => { const f = $("ficha"); f.hidden = false; f.textContent = ""; panelAjustes(f); const x = texto("button", "tool"); x.type = "button"; x.textContent = "Cerrar"; x.onclick = () => f.hidden = true; f.append(x); });
    return it;
  }
  let selP = 0, itemsP = [];
  function abrePaleta() { if (document.pointerLockElement) document.exitPointerLock(); hoja(null); $("paleta").hidden = false; $("busca").value = ""; selP = 0; listaP(); $("busca").focus(); }
  function cierraPaleta() { $("paleta").hidden = true; vista.focus({ preventScroll: true }); }
  function listaP() {
    const q = $("busca").value.trim().toLowerCase(), ul = $("resP"); ul.textContent = "";
    itemsP = AGRUPA().filter(i => !q || (i.n + " " + i.d + " " + i.g).toLowerCase().includes(q)); selP = Math.min(selP, Math.max(0, itemsP.length - 1));
    let g = "";
    itemsP.forEach((i, n) => {
      if (i.g !== g && !q) { g = i.g; const h = texto("li", "grupo"); h.textContent = g; ul.append(h); }
      const li = texto("li"), b = texto("button"), a = texto("span"), d = texto("span", "dato"); b.type = "button"; a.textContent = i.n; d.textContent = i.d; b.append(a, d);
      if (n === selP) b.className = "sel"; b.onclick = () => ejecuta(i); li.append(b); ul.append(li);
    });
    if (!itemsP.length) { const li = texto("li", "grupo"); li.textContent = "Sin resultados"; ul.append(li); }
    const s = ul.querySelector(".sel"); if (s) s.scrollIntoView({ block: "nearest" });
  }
  function ejecuta(i) { cierraPaleta(); i.f(); }
  $("busca").addEventListener("input", () => { selP = 0; listaP(); });
  $("busca").addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { selP = Math.min(itemsP.length - 1, selP + 1); listaP(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { selP = Math.max(0, selP - 1); listaP(); e.preventDefault(); }
    else if (e.key === "Enter" && itemsP[selP]) ejecuta(itemsP[selP]);
    else if (e.key === "Escape") cierraPaleta();
    e.stopPropagation();
  });
  $("paleta").addEventListener("pointerdown", e => { if (e.target.id === "paleta") cierraPaleta(); });
  $("bHer").addEventListener("click", abrePaleta);
  $("salirH").addEventListener("click", () => { modoH(null); H.mover = H.nuevo = null; });
  $("verH").addEventListener("click", () => $("catalogo").hidden = false);
  $("cierraCat").addEventListener("click", () => $("catalogo").hidden = true);
  document.addEventListener("keydown", e => {
    if (T.modo === "portada" || /^(text|textarea|search|password)$/.test(e.target.type) || !$("paleta").hidden) return;
    const c = e.code;
    if (c === "Slash" || c === "KeyK" || c === "Tab") { e.preventDefault(); abrePaleta(); return; }
    if (c === "Escape") { if (H.modo) modoH(null); $("app").classList.remove("limpio"); return; }
    if (e.repeat) return;
    const it = AGRUPA().find(i => i.k && ("Digit" + i.k === c || "Key" + i.k === c)); if (it) it.f();
  });
  /* Clic con una herramienta activa. Devuelve true si lo atendió */
  function clicHerr(e) {
    if (!H.modo) return clicMueble(e.clientX, e.clientY);
    const p = puntoEn(e.clientX, e.clientY); if (!p) { aviso("Pulsa sobre una superficie del modelo."); return true; }
    if (H.modo === "medir") medirPunto(p);
    else if (H.modo === "punto") { D.puntos.push({ x: p.x, y: p.y, z: p.z, t: "", d: "", u: "" }); guardaD(); pintaPuntos(); modoH(null); editaPunto(D.puntos.length - 1); }
    else if (H.modo === "mueble") {
      if (H.mover) { const m = H.mover.userData.m; m.x = p.x; m.y = p.y; m.z = p.z; H.mover.position.copy(p); H.mover = null; }
      else { const m = { k: H.nuevo, x: p.x, y: p.y, z: p.z, r: Math.round(T.yaw / (Math.PI / 4)) * Math.PI / 4 }; D.muebles.push(m); creaMueble(m); }
      guardaD(); modoH(null);
    }
    return true;
  }
  function prepararHerramientas(extra) {
    H.proyecto = null; finReto(); borraMedidas(); capaGente.clear(); gente.clear(); H.stats = {}; H.calor = new Map(); H.verCalor = false; T.corte = undefined; $("ficha").hidden = true; modoH(null);
    D = Object.assign(vacioD(), (extra && extra.datos) || guarda.leer(claveD()) || {});
    pintaPuntos(); pintaMuebles(); aplicaAcabados(); aplicaAmb();
  }
  const v9 = new THREE.Vector3(), v8 = new THREE.Vector3(); let tOc = 0, tapado = [], tCal = 0;
  function cadaFrame(dt, now) {
    if (xrSes) pasoVR(dt);
    frameNube(dt, now);
    const q = vista.getBoundingClientRect(), limpio = $("app").classList.contains("limpio");
    const pon = (e, p, vis) => { v9.copy(p).project(camera); const fuera = v9.z > 1 || !vis; e.hidden = fuera; if (!fuera) e.style.transform = `translate(-50%,-50%) translate(${(v9.x + 1) / 2 * q.width}px,${(1 - v9.y) / 2 * q.height}px)`; };
    if (now - tOc > 180) { tOc = now; const c = camera.position; tapado = D.puntos.map(p => { const dx = p.x - c.x, dy = p.y - c.y, dz = p.z - c.z, l = Math.hypot(dx, dy, dz) || 1; return rayo(c.x, c.y, c.z, dx / l, dy / l, dz / l, l - .08) < Infinity; }); }
    D.puntos.forEach((p, i) => { if (marcasP[i]) pon(marcasP[i], v8.set(p.x, p.y, p.z), !tapado[i] && !limpio); });
    H.medidas.forEach(m => pon(m.e, m.p, !limpio));
    if (T.modo === "orbita" && T.corte !== undefined && P) T.clip = P.floorY + T.corte;
    if (H.reto) {
      $("crono").textContent = `${reloj(now - H.reto.t0)} · ${H.reto.n - H.reto.orb.length} de ${H.reto.n}`;
      H.reto.orb.forEach(o => o.scale.setScalar(1 + Math.sin(now * .005 + o.id) * .15));
      for (let i = H.reto.orb.length - 1; i >= 0; i--) { const o = H.reto.orb[i]; if (Math.hypot(o.position.x - T.x, o.position.z - T.z) < .9 && Math.abs(o.position.y - T.py - 1) < 1.6) { capaOrbes.remove(o); H.reto.orb.splice(i, 1); ding(); } }
      if (!H.reto.orb.length) { const t = now - H.reto.t0, k = "pc:reto:" + cfg.name, mej = guarda.leer(k), nuevo = !mej || t < mej; if (nuevo) guarda.poner(k, t); aviso(`Reto completado en ${reloj(t)}${nuevo ? ". Nuevo récord." : `. Récord: ${reloj(mej)}.`}`); finReto(); }
    }
    if (T.modo === "andar") {
      if (T.sala >= 0) H.stats[T.sala] = (H.stats[T.sala] || 0) + dt;
      const ce = celda(T.x, T.z); if (ce >= 0 && now - tCal > 300) { tCal = now; const k = T.nivel + ":" + ce; H.calor.set(k, (H.calor.get(k) || 0) + 1); }
      if (H.sonido) { H.sonido.paso += Math.hypot(T.vx, T.vz) * dt; if (H.sonido.paso > .72) { H.sonido.paso = 0; sonidoPaso(); } if (T.sala >= 0) H.sonido.f.frequency.value = 180 + Math.min(300, salas[T.sala].area * 7); }
      if (sala) sala.presence({ x: +T.x.toFixed(2), y: +T.py.toFixed(2), z: +T.z.toFixed(2) }).catch(() => {});
    }
  }
  function trasRender() { if (H.foto) { H.foto = false; vista.toBlob(b => guardar(b, `${T.nombre || "vista"}-${Date.now()}.png`), "image/png"); } }

