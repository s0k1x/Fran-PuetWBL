  /* ---------- Portada: la casa se cuenta al hacer scroll ---------- */
  const escaparate = new THREE.Group(); escaparate.visible = false; scene.add(escaparate);
  const CENTRO = [8, .6, 6.5], V = (x, y, z) => new THREE.Vector3(x, y, z);
  /* Una parada por sección: cámara, punto de mira, altura de corte, cielo interior, separación de piezas */
  const PARADAS = [
    { p: V(-8, 11, -14), m: V(8, .6, 6.5), c: 99, w: 0, e: 0 },
    { p: V(-4, 17, -9), m: V(8, .3, 6.5), c: 2.25, w: 0, e: 0 },
    { p: V(15.1, 1.6, 8.75), m: V(2, 1.45, 8.75), c: 99, w: 1, e: 0 },
    { p: V(4.9, 1.55, 6.9), m: V(3.2, 1.05, .5), c: 99, w: 1, e: 0 },
    { p: V(8, 25, 7), m: V(8, 0, 6.5), c: 2.25, w: 0, e: 0 },
    { p: V(-3, 19, 21), m: V(8, 0, 6.5), c: 2.25, w: 0, e: 1 },
    { p: V(22, 15, 19), m: V(8, 0, 6.5), c: 2.25, w: 0, e: 0 },
    { p: V(27, 10, -7), m: V(8, .5, 6.5), c: 99, w: 0, e: 0 },
    { p: V(-14, 6, 8), m: V(8, 1, 6.5), c: 99, w: 0, e: 0 }
  ];
  const portada = $("portada"), secs = [...portada.querySelectorAll(".sec")], pf = { s: 0, listo: false }, posC = V(0, 0, 0), mirC = V(0, 0, 0);
  const suave = t => t * t * (3 - 2 * t);
  function destinoScroll() {
    const y = portada.scrollTop + portada.clientHeight * .5; let i = 0;
    for (let k = 0; k < secs.length; k++) if (secs[k].offsetTop <= y) i = k;
    const a = secs[i], l = Math.max(1, a.offsetHeight); return Math.min(PARADAS.length - 1, i + Math.max(0, Math.min(1, (y - a.offsetTop) / l)) - .5 < 0 ? 0 : i + Math.max(0, Math.min(1, (y - a.offsetTop) / l)) - .5);
  }
  function framePortada(dt, now) {
    if (!pf.listo) return;
    raiz.visible = false; capa.visible = false; escaparate.visible = true;
    pf.s += (destinoScroll() - pf.s) * (calmo ? 1 : 1 - Math.exp(-dt * 5));
    const i = Math.min(PARADAS.length - 2, Math.floor(pf.s)), t = suave(pf.s - i), A = PARADAS[i], B = PARADAS[i + 1];
    posC.lerpVectors(A.p, B.p, t); mirC.lerpVectors(A.m, B.m, t);
    /* El vuelo pasa por encima de los muros al entrar y salir de la casa */
    if (A.w !== B.w) posC.y += Math.sin(t * Math.PI) * 5;
    /* Giro lento solo fuera de la casa */
    const ext = 1 - Math.max(A.w * (1 - t), B.w * t);
    if (!calmo && ext > .5) { const g = Math.sin(now * .00012) * .06; const dx = posC.x - CENTRO[0], dz = posC.z - CENTRO[2], c = Math.cos(g), s = Math.sin(g); posC.x = CENTRO[0] + dx * c - dz * s; posC.z = CENTRO[2] + dx * s + dz * c; }
    camera.position.copy(posC); camera.up.set(0, 1, 0); camera.lookAt(mirC);
    const cA = A.c > 50 ? 3.4 : A.c, cB = B.c > 50 ? 3.4 : B.c; let cl = cA + (cB - cA) * t; if ((A.c > 50 && B.c > 50) || (t < .02 && A.c > 50) || (t > .98 && B.c > 50)) cl = 1000; T.clip = cl;
    U.uW.value = A.w + (B.w - A.w) * t; U.uE.value = (A.e + (B.e - A.e) * t) * (i === 4 ? 1 : 1); scene.background.copy(NEGRO).lerp(BLANCO, U.uW.value);
    escaparate.children.forEach(o => { if (o.userData.fino) o.visible = U.uE.value < .02; });
    renderer.toneMappingExposure = .56 + (EXPO_CASA - .56) * U.uW.value;
    /* Etiquetas de estancias en la sección de IA */
    const q = vista.getBoundingClientRect(), vis = Math.max(0, 1 - Math.abs(pf.s - 6) * 2.2), eti = $("etiP"); eti.style.opacity = vis; eti.hidden = vis < .01;
    if (vis >= .01) pf.eti.forEach(e => { v3.set(e.x, .3, e.z).project(camera); e.el.style.transform = `translate(-50%,-50%) translate(${(v3.x + 1) / 2 * q.width}px,${(1 - v3.y) / 2 * q.height}px)`; });
    corte.constant = T.clip; renderer.render(scene, camera);
    const prog = portada.scrollTop / Math.max(1, portada.scrollHeight - portada.clientHeight); $("avance").style.transform = `scaleY(${prog})`;
  }
  /* Vista desplazada para dejar sitio al texto */
  function marcoPortada() {
    const w = vista.clientWidth, h = vista.clientHeight; camera.aspect = w / Math.max(1, h); camera.fov = w > 760 ? 42 : 58;
    if (w > 760) camera.setViewOffset(w, h, -w * .16, 0, w, h); else camera.setViewOffset(w, h, 0, h * .13, w, h);
    camera.updateProjectionMatrix();
  }
  let luzC = null;
  const cargaLuz = () => luzC || (luzC = new Promise((ok, no) => new THREE.TextureLoader().load("luz.png", t => { t.flipY = false; t.encoding = THREE.sRGBEncoding; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; ok(t); }, undefined, () => no(new Error("No se ha podido cargar la iluminación de la casa.")))));
  async function montaPortada() {
    try {
      const luz = await cargaLuz(); await new Promise(r => setTimeout(r, 40));
      const c = construirCasa(luz, escaparate); marcoPortada(); renderer.compile(scene, camera);
      const et = $("etiP"), vistos = {}; pf.eti = c.rooms.filter(r => !vistos[r.name] && (vistos[r.name] = 1)).map(r => { const s = texto("span"); s.textContent = r.name; et.append(s); return { x: r.x, z: r.z, el: s }; });
      pf.listo = true; vista.classList.add("lista");
    } catch (e) { console.error(e); }
  }
  addEventListener("resize", () => { if (T.modo === "portada" && pf.listo) marcoPortada(); });
  portada.querySelectorAll("a[href^='#']").forEach(a => a.addEventListener("click", e => { e.preventDefault(); const d = document.querySelector(a.getAttribute("href")); if (d) portada.scrollTo({ top: d.offsetTop, behavior: calmo ? "auto" : "smooth" }); }));

