  /* ---------- Portada: el modelo se cuenta al hacer scroll ---------- */
  const escaparate = new THREE.Group(); escaparate.visible = false; scene.add(escaparate);
  const V = (x, y, z) => new THREE.Vector3(x, y, z), EJE_Y = V(0, 1, 0);
  /* Una parada por sección: cámara, punto de mira, corte, cielo interior y separación de piezas */
  const PARADAS_CASA = [
    { p: V(-7, 8.5, -13), m: V(8, .9, 6.5), c: 99, w: 0, e: 0 },
    { p: V(-4, 17, -9), m: V(8, .3, 6.5), c: 2.25, w: 0, e: 0 },
    { p: V(15.1, 1.6, 8.75), m: V(2, 1.45, 8.75), c: 99, w: 1, e: 0 },
    { p: V(4.9, 1.55, 6.9), m: V(3.2, 1.05, .5), c: 99, w: 1, e: 0 },
    { p: V(8, 25, 7), m: V(8, 0, 6.5), c: 2.25, w: 0, e: 0 },
    { p: V(-3, 19, 21), m: V(8, 0, 6.5), c: 2.25, w: 0, e: 1 },
    { p: V(22, 15, 19), m: V(8, 0, 6.5), c: 2.25, w: 0, e: 0 },
    { p: V(27, 10, -7), m: V(8, .5, 6.5), c: 99, w: 0, e: 0 },
    { p: V(-14, 6, 8), m: V(8, 1, 6.5), c: 99, w: 0, e: 0 }
  ];
  let PARADAS = PARADAS_CASA;
  const portada = $("portada"), secs = [...portada.querySelectorAll(".sec")], pf = { s: 0, listo: false, eti: [], giro: 0, play: false, centro: V(8, .6, 6.5), altoCorte: 3.4, propio: false, base: 0, cortar: 0 };
  const posC = V(0, 0, 0), mirC = V(0, 0, 0), suave = t => t * t * (3 - 2 * t);
  /* Recorrido a partir de cualquier modelo: se calcula con su tamaño y sus habitaciones */
  function paradasDe(a) {
    const [ax, ay, az, bx, by, bz] = a.caja, c = V((ax + bx) / 2, ay + Math.min(1, (by - ay) * .3), (az + bz) / 2), R = Math.max(bx - ax, bz - az, by - ay) * .62 + 1, pl = a.planos[0], y0 = pl ? pl.floorY : ay;
    const ext = (an, alt, d = 2.4) => V(c.x + Math.sin(an) * R * d, c.y + R * alt * 1.5, c.z + Math.cos(an) * R * d), cor = pl ? y0 + Math.min(2.25, pl.ceilH - .35) : 99;
    const sal = pl ? [...pl.rooms].sort((p, q) => q.area - p.area) : [], ojo = y0 + 1.55;
    const dentro = (s, o) => ({ p: V(s.x, ojo, s.z), m: o ? V(o.x, ojo - .2, o.z) : V(s.x + 3, ojo - .2, s.z), c: 99, w: 0, e: 0 });
    const ex = (an, alt, cc, d) => ({ p: ext(an, alt, d), m: c.clone(), c: cc, w: 0, e: 0 });
    return [ex(-2.5, .55, 99), ex(-2, 1, cor), sal[0] ? dentro(sal[0], sal[1]) : ex(-1.2, .4, 99, 1.7), sal[1] ? dentro(sal[1], sal[0]) : ex(-.4, .3, 99, 1.7), { p: V(c.x, c.y + R * 3.1, c.z + .4), m: c.clone(), c: cor, w: 0, e: 0 }, ex(.6, 1, cor), ex(1.5, .9, cor), ex(2.6, .55, 99), ex(3.6, .25, 99, 2)];
  }
  function destinoScroll() {
    const y = portada.scrollTop + portada.clientHeight * .5; let i = 0;
    for (let k = 0; k < secs.length; k++) if (secs[k].offsetTop <= y) i = k;
    const a = secs[i]; return Math.max(0, Math.min(PARADAS.length - 1, i + Math.max(0, Math.min(1, (y - a.offsetTop) / Math.max(1, a.offsetHeight))) - .5));
  }
  function framePortada(dt, now) {
    if (!pf.listo) return;
    raiz.visible = false; capa.visible = false; escaparate.visible = true;
    if (pf.play) { portada.scrollTop += dt * portada.clientHeight * .16 * Aj.velRec; if (portada.scrollTop + portada.clientHeight >= portada.scrollHeight - 2) paraRecorrido(); }
    pf.s += (destinoScroll() - pf.s) * (calmo ? 1 : 1 - Math.exp(-dt * 5));
    const i = Math.min(PARADAS.length - 2, Math.floor(pf.s)), t = suave(pf.s - i), A = PARADAS[i], B = PARADAS[i + 1], c = pf.centro;
    posC.lerpVectors(A.p, B.p, t); mirC.lerpVectors(A.m, B.m, t);
    const entra = (A.c > 50 && B.c < 50) || (A.c < 50 && B.c > 50) || A.w !== B.w; if (entra) posC.y += Math.sin(t * Math.PI) * 3;
    /* Giro: el lento automático más el que hace el usuario arrastrando */
    const interior = pf.propio ? (A.p.distanceTo(c) < 4 || B.p.distanceTo(c) < 4) : Math.max(A.w * (1 - t), B.w * t) > .5;
    if (!interior) { const g = (!calmo && Aj.giro ? Math.sin(now * .00012) * .08 : 0) + pf.giro, dx = posC.x - c.x, dz = posC.z - c.z, co = Math.cos(g), si = Math.sin(g); posC.x = c.x + dx * co - dz * si; posC.z = c.z + dx * si + dz * co; }
    camera.position.copy(posC); camera.up.copy(EJE_Y); camera.lookAt(mirC);
    const cA = A.c > 50 ? pf.altoCorte : A.c, cB = B.c > 50 ? pf.altoCorte : B.c; T.clip = pf.cortar ? pf.cortar : (A.c > 50 && B.c > 50) ? 1000 : cA + (cB - cA) * t;
    U.uW.value = A.w + (B.w - A.w) * t; U.uE.value = A.e + (B.e - A.e) * t; scene.background.copy(FONDO_P).lerp(BLANCO, U.uW.value);
    escaparate.children.forEach(o => { if (o.userData.fino) o.visible = U.uE.value < .02; });
    renderer.toneMappingExposure = (.56 + (EXPO_CASA - .56) * U.uW.value) * Aj.brillo;
    /* Texto y etiquetas según lo cerca que esté su sección */
    const alto = portada.clientHeight;
    if (Math.abs(portada.scrollTop - (pf.yUlt ?? -1)) > .5) { pf.yUlt = portada.scrollTop; secs.forEach(s => { const x = s.firstElementChild, r = s.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - alto / 2) / alto, o = Math.max(0, Math.min(1, 1.5 - d * 2.1)); x.style.opacity = s === secs[0] ? Math.max(.25, o) : o; x.style.transform = `translateY(${(1 - o) * 26}px)`; }); }
    const q = vista.getBoundingClientRect(), vis = Math.max(0, 1 - Math.abs(pf.s - 6) * 2.2), eti = $("etiP"); eti.style.opacity = vis; eti.hidden = vis < .01;
    if (vis >= .01) pf.eti.forEach(e => { v3.set(e.x, pf.base + .3, e.z).project(camera); e.el.style.transform = `translate(-50%,-50%) translate(${(v3.x + 1) / 2 * q.width}px,${(1 - v3.y) / 2 * q.height}px)`; });
    corte.constant = T.clip; renderer.render(scene, camera);
    $("avance").style.transform = `scaleY(${portada.scrollTop / Math.max(1, portada.scrollHeight - alto)})`;
    if (pf.foto) { pf.foto = false; vista.toBlob(b => guardar(b, "portada.png"), "image/png"); }
  }
  /* Vista desplazada para dejar sitio al texto */
  function marcoPortada() {
    const w = vista.clientWidth, h = vista.clientHeight; camera.aspect = w / Math.max(1, h); camera.fov = w > 760 ? 42 : 58;
    if (w > 760) camera.setViewOffset(w, h, Aj.texto ? -w * .16 : 0, 0, w, h); else camera.setViewOffset(w, h, 0, Aj.texto ? h * .13 : 0, w, h);
    camera.updateProjectionMatrix();
  }
  let luzC = null;
  const cargaLuz = () => luzC || (luzC = new Promise((ok, no) => new THREE.TextureLoader().load("luz.png", t => { t.flipY = false; t.encoding = THREE.sRGBEncoding; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; ok(t); }, undefined, () => no(new Error("No se ha podido cargar la iluminación de la casa.")))));
  function ponEtiquetas2(lista) { const et = $("etiP"), v = {}; et.textContent = ""; pf.eti = lista.filter(r => !v[r.name] && (v[r.name] = 1)).map(r => { const s = texto("span"); s.textContent = r.name; et.append(s); return { x: r.x, z: r.z, el: s }; }); }
  async function montaCasaPortada() {
    const luz = await cargaLuz(); await new Promise(r => setTimeout(r, 40));
    escaparate.clear(); const c = construirCasa(luz, escaparate); PARADAS = PARADAS_CASA; pf.centro = V(8, .6, 6.5); pf.base = 0; pf.altoCorte = 3.4; pf.propio = false; ponEtiquetas2(c.rooms);
  }
  /* Pone cualquier modelo en el scroll: el de CONFIG o el que elijas para probar */
  async function modeloEnPortada(archivos) {
    const { tabla, modelos } = await recoger(archivos); await preparaTGA(tabla);
    const prio = FORMATOS.find(e => modelos.some(m => m.e === e)); if (!prio) throw new Error("No encuentro un modelo 3D en ese archivo.");
    const m = modelos.find(x => x.e === prio), g = await leeModelo(m, tabla, new Set()), { env } = acabado(g); if (env) await entorno();
    orientar(g, m.e); g.scale.setScalar(escalar(g)); const h = new THREE.Group(); h.add(g);
    const a = await calcular(triangulos(h)); escaparate.clear(); escaparate.add(h);
    PARADAS = paradasDe(a); const [ax, ay, az, bx, by, bz] = a.caja; pf.centro = V((ax + bx) / 2, ay, (az + bz) / 2); pf.base = a.planos[0] ? a.planos[0].floorY : ay; pf.altoCorte = by + 1; pf.propio = true;
    ponEtiquetas2(a.planos[0] ? a.planos[0].rooms.slice(0, 12).map((r, i) => ({ name: "Estancia " + (i + 1), x: r.x, z: r.z })) : []);
  }
  async function montaPortada() {
    try {
      if (CONFIG.modeloPortada) { try { const r = await fetch(CONFIG.modeloPortada); if (!r.ok) throw 0; await modeloEnPortada([new File([await r.arrayBuffer()], CONFIG.modeloPortada.split("/").pop())]); } catch (e) { console.warn("Modelo de portada no disponible"); await montaCasaPortada(); } }
      else await montaCasaPortada();
      marcoPortada(); renderer.compile(scene, camera); pf.listo = true; vista.classList.add("lista"); aplicaAj();
    } catch (e) { console.error(e); }
  }
  addEventListener("resize", () => { if (T.modo === "portada" && pf.listo) marcoPortada(); });
  /* Arrastrar en la portada gira el modelo */
  let arrastreP = null;
  portada.addEventListener("pointerdown", e => { if (e.pointerType === "mouse" && (e.target === portada || e.target.classList.contains("sec"))) { arrastreP = e.clientX; portada.style.cursor = "grabbing"; } });
  addEventListener("pointermove", e => { if (arrastreP !== null) { pf.giro -= (e.clientX - arrastreP) * .005; arrastreP = e.clientX; } });
  addEventListener("pointerup", () => { arrastreP = null; portada.style.cursor = ""; });
  function paraRecorrido() { pf.play = false; const b = $("bpRec"); if (b) b.textContent = "Reproducir"; }

