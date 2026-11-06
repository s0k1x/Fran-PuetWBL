  { /* Bloque propio: sus nombres no chocan con el resto */
  /* ---------- Visita 360: fotos y vídeos equirrectangulares → recorrido y casa en maqueta ---------- */
  /* Cada estancia es una caja; dentro puede haber varias fotos 360 (vistas) tomadas desde puntos distintos.
     La foto activa se proyecta desde su punto de captura: dentro se ve igual que la foto y desde fuera
     las cajas forman la maqueta de la casa (casa de muñecas, sin techo). La IA agrupa las fotos por estancia */
  const TR = { salas: [], i: 0, modo: "dentro", escena: null, cam: new THREE.PerspectiveCamera(75, 1, .05, 400), yaw: 0, pitch: 0, fov: 75, orb: { az: .75, el: .95, d: 18, c: new THREE.Vector3() }, sucio: true, activo: false };
  ICO.pausa = '<path d="M8 5v14M16 5v14"/>';
  const OJO = 1.55, ES_VIDEO = /\.(mp4|webm|mov|m4v)$/i, ES_IMG = /\.(jpe?g|png|webp|avif)$/i;
  const TIPOS = { "Salón": [5, 4.2], "Comedor": [4, 3.5], "Cocina": [3.6, 3], "Dormitorio": [3.6, 3.2], "Baño": [2.6, 2], "Pasillo": [1.4, 4], "Recibidor": [2.4, 2.4], "Despacho": [3, 3], "Terraza": [4, 3], "Estancia": [4, 3.5] };
  const PALABRAS = [[/sal[oó]n|living|estar/i, "Salón"], [/comedor|dining/i, "Comedor"], [/cocina|kitchen/i, "Cocina"], [/dormi|habita|bed|cuarto/i, "Dormitorio"], [/ba[ñn]o|aseo|bath|wc/i, "Baño"], [/pasillo|corredor/i, "Pasillo"], [/recibidor|entrada|hall/i, "Recibidor"], [/despacho|oficina|office|estudio/i, "Despacho"], [/terraza|balc|patio|jard/i, "Terraza"]];
  const GENERICO = /^(img|pano|dsc|vid|pxl|r\d|gs__|insta|mvimg|\d)/i, nat = new Intl.Collator("es", { numeric: true });
  const maxTex = () => Math.min(renderer.capabilities.maxTextureSize, tactil ? 2048 : 4096);
  const puntos = () => TR.salas.flatMap(s => s.puntos), actual = () => puntos()[TR.i];

  /* Material: muestrea la foto en la dirección desde el punto de captura */
  const matPano = () => new THREE.ShaderMaterial({
    side: THREE.BackSide, toneMapped: false,
    uniforms: { map: { value: null }, centro: { value: new THREE.Vector3() }, giro: { value: 0 }, brillo: { value: 1 } },
    vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader: "uniform sampler2D map; uniform vec3 centro; uniform float giro, brillo; varying vec3 vW; void main(){ vec3 d = normalize(vW - centro); float u = fract(atan(d.x, -d.z) / 6.2831853 + .5 + giro); float v = 1. - acos(clamp(d.y, -1., 1.)) / 3.1415927; gl_FragColor = vec4(texture2D(map, vec2(u, v)).rgb * brillo, 1.); }"
  });
  function texDe(fuente, ancho) {
    const w = Math.min(ancho, fuente.width || fuente.videoWidth), c = document.createElement("canvas"); c.width = w; c.height = Math.round(w / 2);
    c.getContext("2d").drawImage(fuente, 0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c); t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.wrapS = THREE.RepeatWrapping; return t;
  }
  async function leePano(archivo) {
    const p = { archivo, giro: 0, ox: 0, oz: 0, auto: true, fecha: archivo.lastModified || 0 };
    if (ES_VIDEO.test(archivo.name) || /^video\//.test(archivo.type)) {
      const v = document.createElement("video"); v.muted = true; v.loop = true; v.playsInline = true; v.crossOrigin = "anonymous"; v.src = URL.createObjectURL(archivo);
      await new Promise((ok, ko) => { v.onloadeddata = ok; v.onerror = () => ko(new Error("No se puede leer el vídeo " + archivo.name)); });
      /* La miniatura sale de un fotograma ya decodificado, no del primero (suele ser negro) */
      await new Promise(ok => { const t = setTimeout(ok, 2500); v.onseeked = () => { clearTimeout(t); ok(); }; v.currentTime = Math.min(1, (v.duration || 2) / 3); });
      p.video = v; p.lo = texDe(v, 1024); p.thumb = p.lo.image.toDataURL("image/jpeg", .7); p.ratio = v.videoWidth / v.videoHeight;
    } else {
      const bm = await createImageBitmap(archivo); p.ratio = bm.width / bm.height; p.bm = bm;
      p.lo = texDe(bm, tactil ? 1024 : 2048); const th = texDe(bm, 512); p.thumb = th.image.toDataURL("image/jpeg", .72); th.dispose();
    }
    return p;
  }
  const nuevaSala = (tipo = "Estancia", nombre = tipo) => { const [an, la] = TIPOS[tipo] || TIPOS.Estancia; return { nombre, tipo, ancho: an, largo: la, alto: 2.6, puntos: [] }; };
  /* Sin IA: «salon 1», «salon-2»… van a la misma estancia; los nombres de cámara (IMG_0001) quedan cada uno en la suya */
  function agrupaPorNombre(lista) {
    const mapa = new Map(), salas = [];
    lista.forEach(p => {
      const base = p.archivo.name.replace(/\.[^.]+$/, ""), tipo = (PALABRAS.find(([r]) => r.test(base)) || [0, ""])[1], tallo = base.toLowerCase().replace(/[\s_\-().]*\d+$/, "").trim();
      const clave = GENERICO.test(base) && !tipo ? Symbol() : (tipo || "") + "|" + tallo;
      let s = mapa.get(clave);
      if (!s) { s = nuevaSala(tipo || "Estancia", tipo || (GENERICO.test(base) ? "" : base.replace(/[\s_\-]*\d+$/, "").replace(/[_-]+/g, " ").slice(0, 28))); mapa.set(clave, s); salas.push(s); }
      s.puntos.push(p);
    });
    return salas;
  }
  /* Nombres únicos: «Dormitorio 1», «Dormitorio 2»; las que no tienen nombre, «Estancia n» */
  function numera(salas) {
    const cuenta = {}; salas.forEach(s => { if (!s.nombre) s.nombre = "Estancia"; cuenta[s.nombre] = (cuenta[s.nombre] || 0) + 1; });
    const van = {}; salas.forEach(s => { if (cuenta[s.nombre] > 1 && !/\d$/.test(s.nombre)) { const b = s.nombre; van[b] = (van[b] || 0) + 1; s.nombre = b + " " + van[b]; } });
  }
  /* Vistas sin posición propia: repartidas a lo largo del lado mayor de la estancia */
  function reparte(s) {
    const n = s.puntos.length, largo = s.largo >= s.ancho; let k = 0;
    s.puntos.forEach(p => { if (!p.auto) return; const t = n > 1 ? (k + .5) / n - .5 : 0; k++; p.ox = largo ? 0 : t * s.ancho * .6; p.oz = largo ? t * s.largo * .6 : 0; });
    s.puntos.forEach(p => { p.ox = Math.max(-s.ancho / 2 + .3, Math.min(s.ancho / 2 - .3, p.ox)); p.oz = Math.max(-s.largo / 2 + .3, Math.min(s.largo / 2 - .3, p.oz)); });
  }

  /* Coloca las estancias en filas, en el orden del recorrido */
  function construyeCasa() {
    const e = TR.escena; e.children.slice().forEach(o => { e.remove(o); if (o.geometry) o.geometry.dispose(); });
    TR.salas = TR.salas.filter(s => s.puntos.length);
    const total = TR.salas.reduce((a, s) => a + s.ancho * s.largo, 0), fila = Math.max(9, Math.sqrt(total) * 1.35), G = .14;
    let x = 0, z = 0, fondo = 0;
    TR.salas.forEach(s => {
      if (x > 0 && x + s.ancho > fila) { x = 0; z += fondo + G; fondo = 0; }
      s.x = x + s.ancho / 2; s.z = z + s.largo / 2; x += s.ancho + G; fondo = Math.max(fondo, s.largo); reparte(s);
      s.mat = s.mat || matPano(); s.malla = new THREE.Mesh(new THREE.BoxGeometry(s.ancho, s.alto, s.largo), s.mat); s.malla.position.set(s.x, s.alto / 2, s.z); s.malla.userData.sala = s; e.add(s.malla);
    });
    const caja = new THREE.Box3(); TR.salas.forEach(s => caja.expandByObject(s.malla)); caja.getCenter(TR.orb.c); TR.orb.c.y = 0;
    const t = caja.getSize(new THREE.Vector3()); TR.orb.d = Math.max(t.x, t.z) * 1.25 + 5; TR.i = Math.max(0, Math.min(TR.i, puntos().length - 1)); actualizaMats();
  }
  const salaDe = p => TR.salas.find(s => s.puntos.includes(p));
  const centroDe = (s, p) => new THREE.Vector3(s.x + p.ox, Math.min(OJO, s.alto - .3), s.z + p.oz);
  const texDePunto = p => p.vt && p === actual() ? p.vt : p.hi || p.lo;
  /* Cada estancia muestra la vista activa (si estás en ella) o la primera */
  function actualizaMats() {
    const a = actual();
    TR.salas.forEach(s => { const p = s.puntos.includes(a) ? a : s.puntos[0], u = s.mat.uniforms; u.map.value = texDePunto(p); u.centro.value.copy(centroDe(s, p)); u.giro.value = p.giro / 360; });
    TR.sucio = true; barraTour();
  }
  /* Alta resolución solo para la vista en la que estás: memoria contenida aunque haya decenas de fotos */
  function activa(i, suave = true) {
    const cambia = () => {
      const l = puntos(); TR.i = Math.max(0, Math.min(l.length - 1, i)); const p = l[TR.i];
      l.forEach(q => { if (q !== p && q.hi) { q.hi.dispose(); q.hi = null; } if (q !== p && q.video) q.video.pause(); });
      if (p.video) { if (!p.vt) { p.vt = new THREE.VideoTexture(p.video); p.vt.generateMipmaps = false; p.vt.minFilter = THREE.LinearFilter; p.vt.wrapS = THREE.RepeatWrapping; } p.video.play().catch(() => {}); }
      else if (p.bm && !p.hi && maxTex() > p.lo.image.width) p.hi = texDe(p.bm, maxTex());
      TR.yaw = 0; TR.pitch = 0; actualizaMats();
    };
    if (!suave || calmo) return cambia();
    const v = $("tVelo"); v.style.opacity = 1; setTimeout(() => { cambia(); requestAnimationFrame(() => { v.style.opacity = 0; }); }, 180);
  }
  function salasVecinas(s) {
    const k = TR.salas.indexOf(s);
    return TR.salas.filter((q, j) => j !== k && (Math.abs(j - k) === 1 || (Math.abs(s.x - q.x) <= (s.ancho + q.ancho) / 2 + .3 && Math.abs(s.z - q.z) <= (s.largo + q.largo) / 2 + .3)));
  }

  /* ---------- Bucle propio: solo pinta cuando algo cambia (o hay vídeo) ---------- */
  function tickTour() {
    const p = actual(); if (!p) return;
    const vid = TR.modo === "dentro" && p.video && !p.video.paused;
    if (!TR.sucio && !vid && !TR.inercia) return; TR.sucio = false;
    if (TR.inercia) { TR.yaw += TR.vy; TR.pitch = Math.max(-1.45, Math.min(1.45, TR.pitch + TR.vp)); TR.vy *= .9; TR.vp *= .9; if (Math.abs(TR.vy) + Math.abs(TR.vp) < 1e-4) TR.inercia = false; }
    const lz = renderer.domElement, cm = TR.cam; cm.aspect = lz.clientWidth / Math.max(1, lz.clientHeight);
    TR.salas.forEach(s => { s.mat.uniforms.brillo.value = TR.modo === "dentro" ? 1 : .92; });
    if (TR.modo === "dentro") { cm.fov = TR.fov; cm.position.copy(centroDe(salaDe(p), p)); cm.rotation.set(TR.pitch, TR.yaw, 0, "YXZ"); }
    else { const o = TR.orb; cm.fov = 40; cm.position.set(o.c.x + Math.sin(o.az) * Math.cos(o.el) * o.d, Math.sin(o.el) * o.d, o.c.z + Math.cos(o.az) * Math.cos(o.el) * o.d); cm.lookAt(o.c); }
    cm.updateProjectionMatrix();
    const tm = renderer.toneMapping; renderer.setRenderTarget(null); renderer.toneMapping = THREE.NoToneMapping; renderer.render(TR.escena, cm); renderer.toneMapping = tm;
    pintaEtiquetas();
  }
  /* Marcadores: dentro, las otras vistas de la estancia (en el suelo) y las estancias vecinas; en maqueta, los nombres */
  function marcadores() {
    if (TR.modo !== "dentro") return TR.salas.map(s => ({ t: s.nombre + (s.puntos.length > 1 ? ` · ${s.puntos.length} vistas` : ""), ir: () => entra(puntos().indexOf(s.puntos[0])), pos: new THREE.Vector3(s.x, s.alto + .2, s.z), cls: "" }));
    const p = actual(), s = salaDe(p), c = centroDe(s, p), r = [];
    s.puntos.forEach((q, k) => { if (q !== p) r.push({ t: "Vista " + (k + 1), ir: () => entra(puntos().indexOf(q)), pos: new THREE.Vector3(s.x + q.ox, .05, s.z + q.oz), cls: "suelo" }); });
    salasVecinas(s).forEach(q => { const dx = q.x - c.x, dz = q.z - c.z, l = Math.hypot(dx, dz) || 1, rr = Math.min(s.ancho, s.largo) * .42; r.push({ t: q.nombre, ir: () => entra(puntos().indexOf(q.puntos[0])), pos: new THREE.Vector3(c.x + dx / l * rr, OJO - .35, c.z + dz / l * rr), cls: "" }); });
    return r;
  }
  function pintaEtiquetas() {
    const caja = $("tHot"); if (!caja || !TR.activo) return; const lz = renderer.domElement, W = lz.clientWidth, Hh = lz.clientHeight, v = new THREE.Vector3(), M = marcadores();
    const k = TR.modo + TR.i + M.map(m => m.t).join("|");
    if (caja.dataset.k !== k) { caja.dataset.k = k; caja.textContent = ""; M.forEach((m, j) => { const b = texto("button", "tPin " + m.cls); b.type = "button"; b.dataset.j = j; b.innerHTML = (TR.modo === "dentro" ? ico(m.cls ? "pin" : "flecha") : "") + "<span></span>"; b.querySelector("span").textContent = m.t; b.onclick = m.ir; caja.append(b); }); }
    [...caja.children].forEach(b => { const m = M[+b.dataset.j]; if (!m) return; v.copy(m.pos).project(TR.cam); const ver = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1; b.hidden = !ver; if (ver) b.style.transform = `translate(${((v.x + 1) / 2 * W).toFixed(1)}px,${((1 - v.y) / 2 * Hh).toFixed(1)}px) translate(-50%,-50%)`; });
  }
  function entra(j) { if (j < 0) return; if (TR.modo !== "dentro") { TR.modo = "dentro"; activa(j, true); } else if (j !== TR.i) activa(j, true); }
  function barraTour() {
    const p = actual(); if (!p || !$("tNom")) return; const s = salaDe(p), k = s.puntos.indexOf(p);
    $("tNom").textContent = TR.modo === "dentro" ? s.nombre + (s.puntos.length > 1 ? ` · vista ${k + 1} de ${s.puntos.length}` : "") : "Maqueta de la casa";
    $("tCnt").textContent = TR.modo === "dentro" ? `${TR.salas.indexOf(s) + 1} / ${TR.salas.length} estancias · ${fmt(s.ancho)} × ${fmt(s.largo)} m` : `${TR.salas.length} estancias · ${puntos().length} fotos · ${fmt(TR.salas.reduce((a, q) => a + q.ancho * q.largo, 0))} m²`;
    $("tMaq").setAttribute("aria-pressed", String(TR.modo === "maqueta")); $("tVid").hidden = !(p.video && TR.modo === "dentro");
    $("tVid").innerHTML = ico(p.video && !p.video.paused ? "pausa" : "reproducir") + `<span>${p.video && !p.video.paused ? "Pausa" : "Vídeo"}</span>`;
  }

  /* ---------- Interfaz ---------- */
  $("app").insertAdjacentHTML("beforeend", `<div id="tour" hidden>
    <div class="tArr"><button id="tSalir" class="tool" type="button" aria-label="Salir de la visita">${ico("x")}</button><div class="tTit"><b id="tNom"></b><small id="tCnt"></small></div></div>
    <div id="tHot"></div><div id="tVelo"></div>
    <div class="tDock"><button id="tAnt" class="tool" type="button" aria-label="Vista anterior">${ico("flecha")}</button>
      <button id="tMaq" class="tool" type="button" aria-pressed="false">${ico("maqueta")}<span>Maqueta</span></button>
      <button id="tVid" class="tool" type="button" hidden></button>
      <button id="tOrg" class="tool" type="button">${ico("rejilla")}<span>Organizar</span></button>
      <button id="tMas" class="tool" type="button">${ico("subir")}<span>Añadir</span></button>
      <button id="tSig" class="tool" type="button" aria-label="Vista siguiente">${ico("flecha")}</button></div>
    <input id="tArch" type="file" accept="image/*,video/*" multiple hidden></div>`);
  const tour = $("tour");
  $("tSalir").onclick = () => saleTour();
  $("tAnt").onclick = () => entra((TR.i - 1 + puntos().length) % puntos().length);
  $("tSig").onclick = () => entra((TR.i + 1) % puntos().length);
  $("tMaq").onclick = () => { TR.modo = TR.modo === "dentro" ? "maqueta" : "dentro"; const p = actual(); if (p.video && TR.modo === "maqueta") p.video.pause(); actualizaMats(); };
  $("tVid").onclick = () => { const v = actual().video; if (!v) return; if (v.paused) v.play().catch(() => {}); else v.pause(); TR.sucio = true; setTimeout(barraTour, 50); };
  $("tMas").onclick = () => $("tArch").click();
  $("tArch").onchange = e => { const f = [...e.target.files]; e.target.value = ""; if (f.length) abreTour(f, true); };
  $("tOrg").onclick = () => organizador();
  addEventListener("keydown", e => {
    if (!TR.activo || /^(text|number|search|range)$/.test(e.target.type) || e.target.tagName === "SELECT") return;
    if (e.key === "Escape") { if (!$("ficha").hidden) cierraOrg(); else saleTour(); }
    else if (e.key === "ArrowRight") $("tSig").click(); else if (e.key === "ArrowLeft") $("tAnt").click(); else if (e.key.toLowerCase() === "m") $("tMaq").click();
  });
  /* Mirar (dentro) u orbitar (maqueta) arrastrando; rueda o pellizco para acercar */
  const dedos = new Map(); let arr = null, pel = 0;
  tour.addEventListener("pointerdown", e => { if (e.target.closest("button, input, .tDock, .tArr")) return; dedos.set(e.pointerId, [e.clientX, e.clientY]); arr = { t: performance.now(), mov: 0 }; TR.inercia = false; tour.setPointerCapture(e.pointerId); });
  tour.addEventListener("pointermove", e => {
    if (!dedos.has(e.pointerId) || !arr) return; const [px, py] = dedos.get(e.pointerId), dx = e.clientX - px, dy = e.clientY - py; dedos.set(e.pointerId, [e.clientX, e.clientY]);
    if (dedos.size === 2) { const [a, b] = [...dedos.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pel) zoom((pel - d) * 4); pel = d; arr.mov += 99; return; }
    arr.mov += Math.abs(dx) + Math.abs(dy);
    if (TR.modo === "dentro") { const k = TR.fov / 75 * .0042; TR.vy = dx * k; TR.vp = dy * k; TR.yaw += TR.vy; TR.pitch = Math.max(-1.45, Math.min(1.45, TR.pitch + TR.vp)); }
    else { TR.orb.az -= dx * .006; TR.orb.el = Math.max(.25, Math.min(1.45, TR.orb.el + dy * .005)); }
    TR.sucio = true;
  });
  const suelta = e => {
    dedos.delete(e.pointerId); if (dedos.size < 2) pel = 0; if (!arr || dedos.size) return;
    if (arr.mov < 6 && TR.modo === "maqueta") { const q = renderer.domElement.getBoundingClientRect(), r = new THREE.Raycaster(); r.setFromCamera({ x: (e.clientX - q.left) / q.width * 2 - 1, y: -(e.clientY - q.top) / q.height * 2 + 1 }, TR.cam); const h = r.intersectObjects(TR.salas.map(s => s.malla))[0]; if (h) entra(puntos().indexOf(h.object.userData.sala.puntos[0])); }
    else if (TR.modo === "dentro" && !calmo && performance.now() - arr.t < 600) TR.inercia = true;
    arr = null;
  };
  tour.addEventListener("pointerup", suelta); tour.addEventListener("pointercancel", suelta);
  const zoom = d => { if (TR.modo === "dentro") TR.fov = Math.max(30, Math.min(100, TR.fov + d * .05)); else TR.orb.d = Math.max(4, Math.min(120, TR.orb.d * (1 + d * .0012))); TR.sucio = true; };
  tour.addEventListener("wheel", e => { e.preventDefault(); zoom(e.deltaY); }, { passive: false });
  addEventListener("resize", () => { if (TR.activo) { ponResolucion(); TR.sucio = true; } });
  function ponResolucion() { const lz = renderer.domElement, w = lz.clientWidth, h = lz.clientHeight; renderer.setPixelRatio(Math.max(.75, Math.min(devicePixelRatio || 1, 2, Math.sqrt((tactil ? 2e6 : 3.2e6) / Math.max(1, w * h))))); renderer.setSize(w, h, false); }

  /* ---------- Organizar: estancias, vistas, medidas, posición y orientación ---------- */
  const cierraOrg = () => { const f = $("ficha"); f.hidden = true; f.classList.remove("tEd"); };
  function organizador() {
    const f = $("ficha"); f.hidden = false; f.textContent = ""; f.classList.add("tEd");
    const h = texto("h3"); h.textContent = "Organizar la visita"; f.append(h);
    const nota = texto("p", "nota2"); nota.textContent = "Cada estancia puede tener varias fotos 360 tomadas desde puntos distintos. El orden es el del recorrido y el de la maqueta."; f.append(nota);
    const acc = texto("div", "tGlob"); f.append(acc); const lista = texto("div", "tLista"); f.append(lista);
    const rehace = () => { const a = actual(); construyeCasa(); const j = puntos().indexOf(a); activa(j < 0 ? 0 : j, false); pinta(); };
    const num = (o, k, min, max, fn) => { const i = document.createElement("input"); i.type = "number"; i.min = min; i.max = max; i.step = .1; i.value = +(+o[k]).toFixed(1); i.setAttribute("aria-label", k); i.onchange = () => { if (i.value !== "" && isFinite(+i.value)) o[k] = Math.max(min, Math.min(max, +i.value)); if (fn) fn(); rehace(); }; return i; };
    const bt = (caja, t, a, fn) => { const b = texto("button", "tool"); b.type = "button"; b.textContent = t; b.setAttribute("aria-label", a); b.onclick = fn; caja.append(b); };
    function pinta() {
      lista.textContent = "";
      TR.salas.forEach((s, k) => {
        const c = texto("div", "tSala"); c.innerHTML = `<div class="tCab"><input class="tN" type="text" maxlength="40" aria-label="Nombre de la estancia"><div class="tAcc"></div></div><div class="tMed"></div><div class="tVistas"></div>`;
        const n = c.querySelector(".tN"); n.value = s.nombre; n.onchange = () => { s.nombre = n.value.trim() || s.nombre; actualizaMats(); };
        const ac = c.querySelector(".tAcc");
        bt(ac, "↑", "Subir estancia", () => { if (k) { [TR.salas[k - 1], TR.salas[k]] = [TR.salas[k], TR.salas[k - 1]]; rehace(); } });
        bt(ac, "↓", "Bajar estancia", () => { if (k < TR.salas.length - 1) { [TR.salas[k + 1], TR.salas[k]] = [TR.salas[k], TR.salas[k + 1]]; rehace(); } });
        const m = c.querySelector(".tMed"); m.append(num(s, "ancho", 1, 30), document.createTextNode("×"), num(s, "largo", 1, 30), document.createTextNode("m · alto"), num(s, "alto", 2, 6));
        const vs = c.querySelector(".tVistas");
        s.puntos.forEach((p, j) => {
          const r = texto("div", "tFila"); r.innerHTML = `<img alt="" src="${p.thumb}"><div class="tCampos"><div class="tMed tPos"></div><label class="tGiro">Giro <input type="range" min="0" max="355" step="5"></label><select aria-label="Estancia de esta foto"></select></div><div class="tAcc"></div>`;
          r.querySelector(".tPos").append(document.createTextNode(`Vista ${j + 1} · x`), num(p, "ox", -15, 15, () => { p.auto = false; }), document.createTextNode("z"), num(p, "oz", -15, 15, () => { p.auto = false; }));
          const g = r.querySelector(".tGiro input"); g.value = p.giro; g.oninput = () => { p.giro = +g.value; actualizaMats(); };
          const sel = r.querySelector("select"); TR.salas.forEach((q, i) => sel.add(new Option(q.nombre, i, false, q === s))); sel.add(new Option("Nueva estancia", "nueva"));
          sel.onchange = () => {
            s.puntos.splice(j, 1); p.auto = true; let d;
            if (sel.value === "nueva") { d = nuevaSala("Estancia", "Estancia " + (TR.salas.length + 1)); TR.salas.splice(k + 1, 0, d); } else d = TR.salas[+sel.value];
            d.puntos.push(p); rehace();
          };
          const a2 = r.querySelector(".tAcc");
          bt(a2, "Ver", "Ir a esta vista", () => { cierraOrg(); entra(puntos().indexOf(p)); });
          bt(a2, "✕", "Quitar foto", () => { if (puntos().length < 2) return aviso("La visita necesita al menos una foto."); s.puntos.splice(j, 1); libera(p); rehace(); });
          vs.append(r);
        });
        lista.append(c);
      });
    }
    const reagrupa = (salas, txt) => { numera(salas); TR.salas = salas; TR.i = 0; rehace(); aviso(txt); };
    if (iaLista()) acc.append(fila(["Agrupar y ordenar con IA", () => organizaIA().then(pinta)]));
    acc.append(fila(
      ["Agrupar por nombre", () => { const l = puntos().sort((a, b) => nat.compare(a.archivo.name, b.archivo.name)); l.forEach(p => { p.auto = true; }); reagrupa(agrupaPorNombre(l), "Agrupadas por nombre de archivo."); }],
      ["Separar todas", () => { const l = puntos(); l.forEach(p => { p.auto = true; }); reagrupa(l.map(p => { const s = nuevaSala(); s.puntos.push(p); return s; }), "Una estancia por foto."); }],
      ["Por fecha", () => { TR.salas.forEach(s => s.puntos.sort((a, b) => a.fecha - b.fecha)); TR.salas.sort((a, b) => Math.min(...a.puntos.map(p => p.fecha)) - Math.min(...b.puntos.map(p => p.fecha))); rehace(); aviso("Ordenadas por fecha."); }]));
    f.append(fila(["Añadir fotos", () => $("tArch").click()], ["Listo", cierraOrg]));
    pinta();
  }
  /* La IA mira todas las fotos: junta las de la misma estancia aunque estén tomadas desde otro punto,
     estima dónde se hizo cada una, las medidas de cada estancia y el orden lógico del recorrido */
  async function organizaIA() {
    const l = puntos(), n = Math.min(l.length, 20);
    aviso(l.length > 20 ? "La IA agrupa las primeras 20 fotos; el resto se mantiene como está." : "Gemini está mirando las fotos…");
    try {
      const partes = [];
      l.slice(0, n).forEach((p, i) => { partes.push({ text: `Foto ${i}:` }, parteImagen(p.thumb)); });
      partes.push({ text: `Son ${n} fotos 360 equirrectangulares de una misma vivienda (el centro de cada imagen es la dirección «al frente»). Varias pueden ser de la MISMA estancia tomadas desde puntos distintos: reconócelo por los muebles, ventanas, suelo y paredes que comparten y júntalas en una sola estancia. Para cada estancia da: un nombre corto en español (numera si hay dos del mismo tipo), su tipo (${Object.keys(TIPOS).join(", ")}), medidas aproximadas en metros (ancho en el eje x, largo en el eje z, alto libre) y sus fotos con la posición aproximada de captura en metros respecto al centro de la estancia (x, z). Devuelve las estancias en un orden lógico de recorrido empezando por la entrada. Cada foto debe aparecer exactamente una vez.` });
      const r = await gemini([{ role: "user", parts: partes }], { type: "object", properties: { estancias: { type: "array", items: { type: "object", properties: { nombre: { type: "string" }, tipo: { type: "string" }, ancho: { type: "number" }, largo: { type: "number" }, alto: { type: "number" }, fotos: { type: "array", items: { type: "object", properties: { i: { type: "integer" }, x: { type: "number" }, z: { type: "number" } } } } } } } } }, "fuerte");
      const usadas = new Set(), ok = (v, a, b) => isFinite(v) && v >= a && v <= b, salas = [];
      (r.estancias || []).forEach(e => {
        const s = nuevaSala(TIPOS[e.tipo] ? e.tipo : "Estancia", String(e.nombre || e.tipo || "Estancia").slice(0, 40));
        if (ok(e.ancho, 1, 30)) s.ancho = +(+e.ancho).toFixed(1); if (ok(e.largo, 1, 30)) s.largo = +(+e.largo).toFixed(1); if (ok(e.alto, 2, 6)) s.alto = +(+e.alto).toFixed(1);
        (e.fotos || []).forEach(f => { const p = l[f.i]; if (!Number.isInteger(f.i) || !p || f.i >= n || usadas.has(f.i)) return; usadas.add(f.i); p.auto = !(isFinite(f.x) && isFinite(f.z)); if (!p.auto) { p.ox = +f.x; p.oz = +f.z; } s.puntos.push(p); });
        if (s.puntos.length) salas.push(s);
      });
      if (!salas.length) throw new Error("La IA no ha devuelto estancias. Inténtalo de nuevo.");
      l.forEach((p, i) => { if (!usadas.has(i)) { const s = salaDe(p), q = nuevaSala(s ? s.tipo : "Estancia", s ? s.nombre : ""); q.puntos.push(p); salas.push(q); } });
      numera(salas); TR.salas = salas; TR.i = 0; construyeCasa(); activa(0, false);
      const juntas = l.length - salas.length; aviso(`${salas.length} estancias${juntas > 0 ? `: ${juntas} ${juntas > 1 ? "fotos se han juntado" : "foto se ha juntado"} con otras de la misma estancia` : ""}. Revisa medidas y giro si hace falta.`);
    } catch (e) { aviso(motivo(e)); }
  }
  function libera(p) { [p.lo, p.hi, p.vt].forEach(t => t && t.dispose()); if (p.bm && p.bm.close) p.bm.close(); if (p.video) { p.video.pause(); URL.revokeObjectURL(p.video.src); } }

  /* ---------- Entrar y salir ---------- */
  async function abreTour(archivos, anadir) {
    const vale = archivos.filter(f => ES_IMG.test(f.name) || ES_VIDEO.test(f.name) || /^(image|video)\//.test(f.type));
    if (!vale.length) return aviso("Elige fotos o vídeos 360 (JPG, PNG, WEBP, MP4 o WEBM).");
    if (!anadir && TR.salas.length) { puntos().forEach(libera); TR.salas = []; TR.i = 0; }
    const dentro = TR.activo; if (!dentro) ocupado(true);
    try {
      if (!TR.escena) { TR.escena = new THREE.Scene(); TR.escena.background = new THREE.Color(0x0b0b0c); }
      let raras = 0; const nuevos = [];
      vale.sort((a, b) => nat.compare(a.name, b.name));
      for (let k = 0; k < vale.length; k++) { const t = `Preparando foto 360 ${k + 1} de ${vale.length}`; if (dentro) aviso(t); else await estado(t); const p = await leePano(vale[k]); if (Math.abs(p.ratio - 2) > .25) raras++; nuevos.push(p); }
      const antes = puntos().length; TR.salas.push(...agrupaPorNombre(nuevos)); numera(TR.salas); construyeCasa();
      if (!dentro) { ocupado(false); entraTour(); }
      activa(anadir ? antes : 0, false);
      aviso(raras ? `${raras} ${raras > 1 ? "fotos no tienen" : "foto no tiene"} proporción 2:1 y puede verse deformada.` : puntos().length > 1 ? `${puntos().length} fotos en ${TR.salas.length} estancias.${iaLista() ? " En Organizar, la IA junta las de la misma estancia." : ""}` : "Arrastra para mirar alrededor.");
    } catch (e) { console.error(e); if (dentro) aviso(motivo(e)); else fallo(motivo(e)); }
  }
  function entraTour() {
    if (TR.activo) return; TR.activo = true; T.modo = "tour"; cierraPanel(); $("galeria").hidden = true;
    interfaz("andar"); ["dock", "esq", "mini", "etiPlanta", "palanca", "pista"].forEach(id => { const e = $(id); if (e) e.hidden = true; });
    renderer.domElement.style.visibility = ""; renderer.domElement.style.opacity = 1; tour.hidden = false; TR.modo = "dentro";
    ponResolucion(); renderer.setAnimationLoop(tickTour); TR.sucio = true;
  }
  function saleTour() {
    if (!TR.activo) return; TR.activo = false; tour.hidden = true; cierraOrg();
    puntos().forEach(p => p.video && p.video.pause()); renderer.setAnimationLoop(tick); irPortada(); medir();
  }
  /* Las fotos y vídeos 360 sueltos se abren como visita; los modelos siguen su camino */
  const cargarBase = cargar;
  cargar = function (archivos, ruta) {
    const l = [...archivos];
    if (l.length && l.every(f => ES_IMG.test(f.name) || ES_VIDEO.test(f.name))) return abreTour(l);
    return cargarBase(archivos, ruta);
  };
  const abre360 = () => { if (TR.salas.length) { entraTour(); activa(TR.i, false); } else $("tArch").click(); };
  $("verMuestras").insertAdjacentHTML("afterend", '<button id="ver360" type="button">Fotos 360</button>'); $("ver360").onclick = abre360;
  const vista360 = BOTONES.vista;
  BOTONES.vista = function (p) { vista360(p); const b = texto("button", "linea"); b.type = "button"; b.innerHTML = ico("camara") + "<div>Visita 360<small>Sube tus fotos o vídeos 360 y monta la casa</small></div>"; b.onclick = () => { cierraPanel(); abre360(); }; p.firstElementChild.after(b); };
  }
