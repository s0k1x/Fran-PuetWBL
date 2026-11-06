  /* ---------- Portada con escultura y modelos de ejemplo generados por código (0 KB de descarga) ---------- */

  /* ---------- Escultura: un tubo continuo que pasa de nudo a espiral y a esfera al hacer scroll ---------- */
  class CurvaF extends THREE.Curve { constructor(f) { super(); this.f = f; } getPoint(t, o = new THREE.Vector3()) { return o.copy(this.f(t)); } }
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const FORMAS = [
    t => { const a = t * Math.PI * 2, p = 2, q = 3, r = .62 + .26 * Math.cos(q * a); return V3(r * Math.cos(p * a), .26 * Math.sin(q * a) * 1.6 + .02, r * Math.sin(p * a)).multiplyScalar(1.15); },
    t => { const a = t * Math.PI * 7, r = .78 * (1 - .62 * t) + .06; return V3(r * Math.cos(a), t * 2.1 - 1.02, r * Math.sin(a)); },
    t => { const a = t * Math.PI * 16, ph = .12 + t * (Math.PI - .24); return V3(Math.sin(ph) * Math.cos(a), Math.cos(ph), Math.sin(ph) * Math.sin(a)).multiplyScalar(.95); }
  ];
  function geoEscultura() {
    /* Tubo más grueso en el centro y afilado en los extremos, como una pieza tallada; mucho detalle en ordenador */
    const S = tactil ? 520 : 900, Rr = tactil ? 18 : 28, gs = FORMAS.map(f => {
      const c = new CurvaF(f), g = new THREE.TubeGeometry(c, S, .12, Rr, false), p = g.attributes.position, v = new THREE.Vector3(), q = new THREE.Vector3();
      for (let i = 0; i <= S; i++) { const u = i / S, k = .22 + .78 * Math.pow(Math.sin(Math.PI * u), .55); c.getPointAt(u, q); for (let j = 0; j <= Rr; j++) { const n = i * (Rr + 1) + j; v.fromBufferAttribute(p, n).sub(q).multiplyScalar(k).add(q); p.setXYZ(n, v.x, v.y, v.z); } }
      return g;
    });
    const g = gs[0]; g.morphAttributes.position = [gs[1].attributes.position, gs[2].attributes.position]; g.morphAttributes.normal = [gs[1].attributes.normal, gs[2].attributes.normal];
    return g;
  }
  /* Mármol con vetas en 3D (sin costuras sobre superficies curvas) que se puede volver oro */
  function matEscultura() {
    const m = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: .14, metalness: 0, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: .9 });
    m.userData.oro = { value: 0 };
    m.onBeforeCompile = sh => {
      sh.uniforms.uOro = m.userData.oro;
      sh.vertexShader = "varying vec3 vObj;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = transformed;");
      sh.fragmentShader = "varying vec3 vObj; uniform float uOro;\nfloat h3(vec3 p){ p = fract(p * .3183 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\nfloat n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y), mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }\n" + sh.fragmentShader
        .replace("#include <color_fragment>", `#include <color_fragment>
          float bt = n3(vObj * 2.1) * .6 + n3(vObj * 5.3) * .3 + n3(vObj * 11.) * .1;
          float bv = exp(-abs(sin((vObj.x * 1.7 + vObj.y * 2.3 + bt * 3.4) * 3.1)) / .05);
          /* Obsidiana con vetas de oro; con uOro se vuelve oro macizo */
          float bVeta = clamp(bv * 1.4, 0., 1.), bOro = max(bVeta * .9, uOro);
          diffuseColor.rgb = mix(vec3(.018, .018, .02) * (.8 + .4 * bt), vec3(1., .78, .42), bOro);`)
        .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 1., bOro);")
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .24, bOro);")
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1., .72, .35) * bVeta * (1. - uOro) * 1.6;");
    };
    return m;
  }
  /* Paradas del scroll: cámara (ángulo, altura, distancia), forma (0 nudo, 1 espiral, 2 esfera) y oro */
  const PARADAS_ESC = [
    { az: .5, el: .18, d: 5.4, f: 0, oro: 0 }, { az: 1.3, el: .55, d: 4.6, f: 0, oro: 0 }, { az: 2.2, el: .12, d: 4.3, f: 1, oro: 0 }, { az: 3.0, el: .35, d: 5.0, f: 1, oro: 0 },
    { az: 3.9, el: 1.05, d: 5.6, f: 2, oro: 0 }, { az: 4.6, el: .25, d: 4.4, f: 2, oro: .35 }, { az: 5.4, el: .3, d: 4.8, f: 0, oro: 1 }, { az: 6.1, el: .15, d: 4.2, f: 1, oro: 1 }, { az: 6.9, el: .22, d: 5.6, f: 0, oro: 0 }
  ];
  function montaEscultura() {
    escaparate.clear(); const g = new THREE.Group();
    const m = matEscultura(), esc = new THREE.Mesh(geoEscultura(), m); esc.position.y = 1.62; esc.castShadow = false; esc.morphTargetInfluences = [0, 0]; g.add(esc);
    /* Sombra de contacto pintada: un degradado bajo la pieza, sin calcular sombras cada fotograma */
    const cs = document.createElement("canvas"); cs.width = cs.height = 256; const cg = cs.getContext("2d"), gr = cg.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(0,0,0,.85)"); gr.addColorStop(.45, "rgba(0,0,0,.45)"); gr.addColorStop(1, "rgba(0,0,0,0)"); cg.fillStyle = gr; cg.fillRect(0, 0, 256, 256);
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cs), transparent: true, depthWrite: false, toneMapped: false })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = .004; g.add(sombra);
    /* Sin peana: la pieza flota sobre el suelo del estudio */
    /* Suelo de estudio infinito: pulido y que se funde en la oscuridad */
    const suelo = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: 0x030303, roughness: .82, metalness: 0, envMapIntensity: 0 }));
    suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = false;
    suelo.material.onBeforeCompile = sh => { sh.vertexShader = "varying vec2 vP;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvP = position.xy;"); sh.fragmentShader = "varying vec2 vP;\n" + sh.fragmentShader.replace("#include <dithering_fragment>", "#include <dithering_fragment>\ngl_FragColor.rgb *= 1. - smoothstep(1.2, 6.5, length(vP));"); };
    g.add(suelo);
    /* Anillo dorado que orbita */
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(1.25, .012, 10, 160), new THREE.MeshStandardMaterial({ color: 0xd8c49c, metalness: 1, roughness: .2 })); anillo.position.y = 1.62; g.add(anillo);
    /* Luces de estudio: clave con sombra suave, contraluz cálido y relleno frío */
    const clave = new THREE.DirectionalLight(0xfff4e6, .7); clave.position.set(2.5, 7, 2.5); clave.castShadow = false; clave.shadow.mapSize.set(1024, 1024); Object.assign(clave.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: .5, far: 15 }); clave.shadow.bias = -.0004; clave.shadow.normalBias = .02;
    /* Contraluces que recortan la silueta sobre el negro: uno cálido y otro frío */
    const contra = new THREE.DirectionalLight(0xffc98a, 3.2); contra.position.set(-4, 3, -4);
    const contra2 = new THREE.DirectionalLight(0xbcd0ff, 2.4); contra2.position.set(4.5, 2.2, -3.5);
    const relleno = new THREE.DirectionalLight(0x9fb4ff, .18); relleno.position.set(-3, 1.5, 4);
    g.add(clave, clave.target, contra, contra2, relleno);
    escaparate.add(g);
    pf.escultura = { esc, m, anillo, g, clave }; pf.capas = null; pf.propio = false; pf.eti = []; $("etiP").textContent = "";
    pf.centro = V3(0, 1.45, 0); renderer.shadowMap.needsUpdate = true;
  }
  const S_ESC = { s: 0, rot: 0 };
  function frameEscultura(dt, now) {
    /* En reposo basta con 30 imágenes por segundo: la pieza gira despacio y el equipo queda libre para el scroll */
    const mov = pf.play || Math.abs(portada.scrollTop - (pf.yUlt ?? -1)) > .5 || Math.abs(destinoScroll() - pf.s) > .003;
    if (mov) pf.tMov = now; pf.acum = (pf.acum || 0) + dt;
    if (!mov && R.nivel < 2 && now - (pf.tMov || 0) > 500 && pf.acum < .031) return;
    dt = Math.min(.05, pf.acum); pf.acum = 0;
    raiz.visible = false; capa.visible = false; escaparate.visible = true; luces.visible = false;
    if (pf.play) { portada.scrollTop += dt * portada.clientHeight * .16 * Aj.velRec; if (portada.scrollTop + portada.clientHeight >= portada.scrollHeight - 2) paraRecorrido(); }
    pf.s += (destinoScroll() - pf.s) * (calmo ? 1 : 1 - Math.exp(-dt * 4));
    const P = PARADAS_ESC, i = Math.min(P.length - 2, Math.floor(pf.s)), t0 = pf.s - i, t = t0 * t0 * (3 - 2 * t0), A = P[i], B = P[i + 1], e = pf.escultura;
    const az = A.az + (B.az - A.az) * t + pf.giro + (calmo || !Aj.giro ? 0 : Math.sin(now * .00015) * .12), el = A.el + (B.el - A.el) * t, d = (A.d + (B.d - A.d) * t) / Math.min(1, camera.aspect / 1.1);
    camera.position.set(Math.sin(az) * Math.cos(el) * d, 1.35 + Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d); camera.up.set(0, 1, 0); camera.lookAt(pf.centro);
    /* Forma: mezcla suave entre nudo, espiral y esfera */
    const fA = A.f, fB = B.f, w = [0, 0, 0]; w[fA] += 1 - t; w[fB] += t; e.esc.morphTargetInfluences[0] = w[1]; e.esc.morphTargetInfluences[1] = w[2];
    e.m.userData.oro.value = A.oro + (B.oro - A.oro) * t;
    S_ESC.rot += dt * (calmo ? 0 : .22); e.esc.rotation.y = S_ESC.rot; e.esc.position.y = 1.62 + (calmo ? 0 : Math.sin(now * .0009) * .06); e.esc.rotation.z = calmo ? 0 : Math.sin(now * .0005) * .05; e.anillo.rotation.set(Math.PI / 2 + Math.sin(now * .0004) * .35, 0, now * .00025); e.anillo.position.y = 1.62 + Math.sin(now * .0007) * .05;
    T.clip = 1000; corte.constant = 1000; renderer.toneMappingExposure = Aj.brillo; R.abObj = 0;
    /* Plano cinematográfico: enfoque en la escultura y fondo suavemente desenfocado */
    R.dof = calmo || R.nivel < 1 ? 0 : .3; R.foco = camera.position.distanceTo(pf.centro);

    const alto = portada.clientHeight;
    if (Math.abs(portada.scrollTop - (pf.yUlt ?? -1)) > .5) { pf.yUlt = portada.scrollTop; if (!pf.offs || pf.offsAlto !== alto) { pf.offsAlto = alto; pf.offs = secs.map(s => [s.offsetTop, s.offsetHeight]); } secs.forEach((s, k) => { const x = s.firstElementChild, r = { top: pf.offs[k][0] - portada.scrollTop, height: pf.offs[k][1] }, dd = Math.abs(r.top + r.height / 2 - alto / 2) / alto, o = Math.max(0, Math.min(1, 1.5 - dd * 2.1)); x.style.opacity = s === secs[0] ? Math.max(.25, o) : o; x.style.transform = `translateY(${(1 - o) * 26}px)`; }); }
    $("etiP").hidden = true; usarReal("portada"); vigilaRitmo(dt); R.sucio = true; pintar(false);
    if (pf.foto) { pf.foto = false; vista.toBlob(b => guardar(b, "portada.png"), "image/png"); }
  }
  const frameBase = framePortada;
  /* ---------- Portada: un busto clásico de mármol (Poly Haven, CC0) · 9 600 triángulos, 242 KB ---------- */
  /* Solo la pieza, una luz con sombra suave y un contraluz: nada de escenario. Se pinta directo, sin posproceso */
  const BU = { cam: new THREE.PerspectiveCamera(28, 1, .05, 30), raton: [0, 0], suave: [0, 0], rot: 0 };
  function sombraContacto() {
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,.75)"); g.addColorStop(.45, "rgba(0,0,0,.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; return m;
  }
  async function montaBusto() {
    await pide("loaders/GLTFLoader.js"); await pide("libs/meshopt_decoder.js");
    const L = new THREE.GLTFLoader(); L.setMeshoptDecoder(window.MeshoptDecoder);
    const gl = await new Promise((ok, ko) => L.load("modelos/busto.glb", ok, undefined, ko)), e = new THREE.Scene(), m = gl.scene;
    m.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.material.envMapIntensity = .5; o.material.roughness = 1; } });
    const caja = new THREE.Box3().setFromObject(m), c = caja.getCenter(V3(0, 0, 0)), k = 1.6 / (caja.max.y - caja.min.y);
    m.scale.setScalar(k); m.position.set(-c.x * k, -caja.min.y * k, -c.z * k);
    const piv = new THREE.Group(); piv.add(m); e.add(piv);
    const clave = new THREE.DirectionalLight(0xffe7cc, 2.4), sc = clave.shadow.camera;
    clave.position.set(2.4, 3.2, 2.2); clave.castShadow = true; clave.shadow.mapSize.set(1024, 1024); clave.shadow.bias = -.0005; clave.shadow.normalBias = .015; clave.shadow.radius = 4;
    sc.left = -1.1; sc.right = 1.1; sc.top = 1.9; sc.bottom = -.4; sc.near = .5; sc.far = 9; sc.updateProjectionMatrix();
    const contra = new THREE.DirectionalLight(0x9fbaff, 1.5); contra.position.set(-2.6, 2.4, -2.4);
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: .45 })); suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true;
    const contacto = sombraContacto(); contacto.scale.setScalar(1.1); contacto.position.y = .002;
    e.add(clave, clave.target, contra, new THREE.HemisphereLight(0xdfe6ff, 0x0b0a09, .2), suelo, contacto);
    await pide("environments/RoomEnvironment.js"); const pm = new THREE.PMREMGenerator(renderer); e.environment = pm.fromScene(new THREE.RoomEnvironment(), .04).texture; pm.dispose();
    e.background = new THREE.Color(0x070707);
    BU.escena = e; BU.piv = piv; pf.busto = true; medir(); renderer.compile(e, BU.cam);
    const lz = renderer.domElement; lz.style.opacity = 0; lz.style.transition = "opacity 1s ease"; requestAnimationFrame(() => requestAnimationFrame(() => { lz.style.opacity = 1; }));
  }
  addEventListener("pointermove", e => { if (T.modo === "portada") { BU.raton[0] = e.clientX / innerWidth * 2 - 1; BU.raton[1] = e.clientY / innerHeight * 2 - 1; } }, { passive: true });
  function frameBusto(dt, now) {
    const y = portada.scrollTop, mov = Math.abs(y - (BU.y ?? -1)) > .5 || Math.abs(BU.raton[0] - BU.suave[0]) + Math.abs(BU.raton[1] - BU.suave[1]) > .003;
    if (mov) BU.tMov = now; BU.acum = (BU.acum || 0) + dt;
    /* En reposo, 30 imágenes por segundo: la pieza gira muy despacio */
    if (!mov && now - (BU.tMov || 0) > 400 && BU.acum < .031) return;
    dt = Math.min(.05, BU.acum); BU.acum = 0; BU.y = y;
    const a = calmo ? 1 : 1 - Math.exp(-dt * 4); BU.suave[0] += (BU.raton[0] - BU.suave[0]) * a; BU.suave[1] += (BU.raton[1] - BU.suave[1]) * a;
    BU.rot += dt * (calmo ? 0 : .1); const s = y / Math.max(1, portada.clientHeight);
    BU.piv.rotation.y = -.35 + BU.rot + s * .5 + BU.suave[0] * .22;
    const lz = renderer.domElement, w = lz.width, h = lz.height, asp = w / Math.max(1, h), ancho = asp > 1.05, cm = BU.cam;
    cm.aspect = asp; const d = 4.3 / Math.min(1, asp / 1.25) * (ancho ? 1 : 1.05) + Math.min(s, 3) * .12;
    cm.position.set(BU.suave[0] * .25, 1.0 - BU.suave[1] * .12, d); cm.lookAt(0, .86, 0);
    if (ancho) cm.setViewOffset(w, h, -w * .2, 0, w, h); else cm.setViewOffset(w, h, 0, h * .2, w, h);
    const tm = renderer.toneMapping, ex = renderer.toneMappingExposure;
    renderer.setRenderTarget(null); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = (ancho ? 1 : .42) * Aj.brillo;
    renderer.render(BU.escena, cm); renderer.toneMapping = tm; renderer.toneMappingExposure = ex;
  }
  framePortada = function (dt, now) {
    const lz = renderer.domElement;
    if (pf.modelo) { lz.style.visibility = ""; luces.visible = true; return frameBase(dt, now); }
    if (!BU.escena) { if (lz.style.visibility !== "hidden") lz.style.visibility = "hidden"; return; }
    if (lz.style.visibility) lz.style.visibility = ""; frameBusto(dt, now);
  };
  montaPortada = async function () {
    pf.listo = true; vista.classList.add("lista"); aplicaAj(); revelaSecciones();
    try { await montaBusto(); } catch (e) { console.error(e); }
  };
  /* Al salir de la portada vuelven las luces de la escena */
  /* Las secciones aparecen al entrar en pantalla, sin trabajo por fotograma */
  function revelaSecciones() {
    if (!("IntersectionObserver" in window) || calmo) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } }), { root: portada, threshold: .15 });
    secs.forEach((s, i) => { if (i) { s.classList.add("revelable"); io.observe(s); } });
  }
  const interfazBase = interfaz; interfaz = function (modo) {
    renderer.domElement.style.visibility = modo === "portada" && !pf.modelo && !BU.escena ? "hidden" : ""; if (modo !== "portada") BU.cam.clearViewOffset();
    luces.visible = modo !== "portada" || !pf.escultura; const r = interfazBase(modo);
    if (modo !== "portada") { R.dof = 0; const t = R.nivel >= 2 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap; if (renderer.shadowMap.type !== t) { renderer.shadowMap.type = t; renderer.shadowMap.needsUpdate = true; } }
    PQ.w = 0; medir(); return r;
  };

  /* ---------- Modelos de ejemplo hechos con código: materiales con nombre, así toman el realismo ---------- */
  /* Los mismos colores base que la villa (su MTL): así cada material se ve como debe */
  const KD = { cesped: [.3, .48, .2], pavimento_exterior: [.76, .74, .7], hormigon_claro: [.84, .82, .78], hormigon_pulido: [.6, .6, .58], madera_suelo: [.58, .42, .28], estuco_blanco: [.93, .92, .89], metal_negro: [.07, .07, .08], vidrio: [.6, .7, .74], techo_blanco: [.97, .96, .94], alfombra: [.66, .62, .56], tela_gris: [.52, .5, .48], nogal: [.36, .24, .15], marmol_negro: [.12, .11, .11], tela_acento: [.45, .35, .26], negro_brillo: [.03, .03, .035], lacado_arena: [.82, .76, .67], marmol_blanco: [.95, .94, .92], marmol_crema: [.9, .86, .79], cuero_cognac: [.55, .32, .17], tela_crema: [.93, .9, .84], tela_arena: [.8, .74, .65], porcelanico_gris: [.72, .71, .69], porcelana: [.97, .97, .96], espejo: [.8, .83, .86], luz_calida: [1, .86, .62], piedra_natural: [.74, .68, .6], piedra_oscura: [.4, .38, .36], agua_piscina: [.22, .62, .74], azulejo_piscina: [.3, .66, .76], acero: [.72, .73, .74], hoja: [.16, .3, .14], libro_a: [.62, .2, .16], libro_b: [.2, .3, .42], libro_c: [.85, .8, .7] };
  const mn = n => { const c = KD[n] || [.8, .8, .8], m = new THREE.MeshStandardMaterial({ color: new THREE.Color(...c) }); if (n === "luz_calida") m.emissive = new THREE.Color(1, .8, .52); if (n === "vidrio") { m.transparent = true; m.opacity = .22; } m.name = n; return m; };
  function constructor(g) {
    const M = {}, mat = n => M[n] || (M[n] = mn(n));
    return (n, w, h, d, x, y, z, nombre) => { const e = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(n)); e.position.set(x + w / 2, y + h / 2, z + d / 2); e.name = nombre || n; g.add(e); return e; };
  }
  /* Iluminación propia de cada ejemplo: se ven bien a cualquier hora, aunque sean salas cerradas */
  function luzEstudio(g, { cielo = 0xfff4e8, suelo = 0x2a2622, amb = .55, clave = 1.1, relleno = .45, pos = [6, 9, 5] } = {}) {
    const h = new THREE.HemisphereLight(cielo, suelo, amb), k = new THREE.DirectionalLight(0xfff2e2, clave), f = new THREE.DirectionalLight(0xcfdcff, relleno);
    k.position.set(...pos); f.position.set(-pos[0], pos[1] * .6, -pos[2]); g.add(h, k, f); return g;
  }
  const estanciaM = (name, x0, x1, z0, z1, y = 0) => ({ name, x: (x0 + x1) / 2, y, z: (z0 + z1) / 2, area: Math.round((x1 - x0) * (z1 - z0) * 10) / 10, rects: [[x0, x1, z0, z1]] });
  /* Loft minimalista: salón-cocina con ventanal, dormitorio, baño y terraza */
  function creaLoft() {
    const g = new THREE.Group(), B = constructor(g), H = 3.1, t = .15;
    B("cesped", 30, .3, 26, -9, -.3, -9); B("pavimento_exterior", 14, .02, 3, -1, 0, 9);
    B("hormigon_claro", 12.3, .3, 9.3, -.15, -.3, -.15); B("madera_suelo", 12, .02, 9, 0, 0, 0);
    B("estuco_blanco", 12.3, H, t, -.15, 0, -.15); B("estuco_blanco", t, H, 9.3, -.15, 0, -.15); B("estuco_blanco", t, H, 9.3, 12, 0, -.15);
    /* Ventanal sur: montantes negros y vidrio */
    B("estuco_blanco", 1.2, H, t, -.15, 0, 9); B("estuco_blanco", 1.2, H, t, 10.95, 0, 9); B("metal_negro", 9.9, .12, .1, 1.05, H - .12, 9.02); B("metal_negro", 9.9, .08, .1, 1.05, 0, 9.02);
    for (let i = 0; i <= 5; i++) B("metal_negro", .06, H, .1, 1.05 + i * 1.97, 0, 9.02);
    B("vidrio", 9.9, H - .2, .02, 1.05, .08, 9.06);
    /* Tabiques: dormitorio (8..12 x 0..4.5) y baño (8..12 x 4.5..7) con huecos de puerta */
    B("estuco_blanco", t, H, 3.4, 8, 0, 0); B("estuco_blanco", t, H, 1.6, 8, 0, 4.4); B("estuco_blanco", 1.2, H, t, 8, 0, 4.4); B("estuco_blanco", 2.4, H, t, 9.6, 0, 4.4);
    B("estuco_blanco", t, H, 2.6, 8, 0, 6.0); B("estuco_blanco", 4, H, t, 8, 0, 7);
    B("techo_blanco", 12.3, .2, 9.3, -.15, H, -.15); B("hormigon_claro", 12.6, .25, 9.6, -.3, H + .2, -.3);
    /* Salón */
    B("alfombra", 3.4, .015, 2.4, 1.2, .02, 4.6); B("tela_gris", 2.6, .42, .95, 1.6, .02, 6.6); B("tela_gris", 2.6, .45, .22, 1.6, .44, 7.33); B("tela_gris", .22, .3, .95, 1.6, .44, 6.6); B("tela_gris", .22, .3, .95, 3.98, .44, 6.6);
    B("nogal", 1.1, .3, .6, 2.35, .02, 5.4); B("marmol_negro", 1.12, .03, .62, 2.34, .32, 5.39); B("tela_acento", .8, .45, .8, 4.2, .02, 4.9);
    B("nogal", 2.6, .45, .45, 1.6, .02, .2); B("negro_brillo", 1.8, 1.0, .05, 2.0, 1.1, .2);
    /* Cocina con isla y comedor */
    B("lacado_arena", 4.2, .9, .62, 3.6, .02, .1); B("marmol_blanco", 4.2, .04, .64, 3.6, .92, .09); B("lacado_arena", 4.2, .7, .35, 3.6, 1.55, .1);
    B("lacado_arena", 2.4, .88, .9, 4.5, .02, 2.0); B("marmol_blanco", 2.5, .05, 1.0, 4.45, .9, 1.95);
    B("nogal", 2.0, .05, .95, 5.8, .74, 5.4); B("metal_negro", .06, .72, .8, 5.9, .02, 5.47); B("metal_negro", .06, .72, .8, 7.68, .02, 5.47);
    [[6.0, 5.0], [6.9, 5.0], [6.0, 6.45], [6.9, 6.45]].forEach(([x, z]) => { B("cuero_cognac", .45, .46, .45, x, .02, z); B("cuero_cognac", .45, .45, .06, x, .48, z + (z < 6 ? 0 : .39)); });
    /* Dormitorio y baño */
    B("nogal", 2.0, .3, 2.2, 9.2, .02, .4); B("tela_crema", 1.9, .25, 2.05, 9.25, .32, .5); B("nogal", 2.1, 1.0, .08, 9.15, .3, .32); B("tela_arena", .5, .1, .3, 9.4, .57, .6); B("tela_arena", .5, .1, .3, 10.4, .57, .6);
    B("porcelanico_gris", 4, .02, 2.6, 8, .02, 4.45); B("porcelana", 1.7, .55, .8, 10.1, .03, 4.6); B("porcelana", .6, .15, .45, 8.4, .85, 6.4); B("espejo", .9, .9, .02, 8.25, 1.3, 6.92);
    /* Lámparas y terraza */
    [[2.9, 5.6], [6.7, 5.9], [5.7, 2.4], [10.2, 1.6], [3.2, 6.9]].forEach(([x, z]) => B("luz_calida", .5, .03, .5, x - .25, H - .04, z - .25));
    B("tela_crema", 1.8, .38, .8, 2, .02, 10.2); B("nogal", .6, .35, .6, 4.2, .02, 10.3);
    /* Detalles: rodapiés, estantería con libros, cuadros, cojines, plantas, lámparas y grifería */
    const M2 = {}, mt = n => M2[n] || (M2[n] = mn(n));
    const cil = (n, r, h, x, y, z, seg = 16) => { const e = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .92, h, seg), mt(n)); e.position.set(x, y + h / 2, z); e.name = n; g.add(e); return e; };
    const bola = (n, r, x, y, z) => { const e = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mt(n)); e.position.set(x, y, z); e.scale.y = .85; e.name = n; g.add(e); return e; };
    B("nogal", 8, .08, .02, 0, 0, 0); B("nogal", .02, .08, 9, 0, 0, 0); B("nogal", 4, .08, .02, 8, 0, 0); B("nogal", .02, .08, 4.4, 11.98, 0, 0);
    [.5, 1.0, 1.5, 2.0].forEach((y, k) => { B("nogal", .3, .035, 2.4, .02, y, 1.0); let z = 1.06; while (z < 3.3) { const w = .04 + ((k * 7 + z * 13) % 5) * .012, hb = .2 + ((k * 3 + z * 17) % 4) * .04; B(["libro_a", "libro_b", "libro_c", "tela_arena"][Math.floor(z * 11 + k) % 4], .22, hb, w, .05, y + .035, z); z += w + .006; if (((z * 10) | 0) % 7 === 0) z += .25; } });
    B("nogal", .04, 1.0, 1.5, .02, 1.3, 4.7); B("tela_acento", .02, .86, 1.36, .05, 1.37, 4.77); B("nogal", 1.3, .8, .04, 9.55, 1.45, .02); B("lacado_arena", 1.18, .68, .02, 9.61, 1.51, .05);
    [[1.9, 6.72], [2.55, 6.72], [3.4, 6.72]].forEach(([x, z], k) => { const e = B(k === 1 ? "tela_acento" : "tela_crema", .45, .38, .14, x, .45, z + .58); e.rotation.x = -.18; });
    cil("hormigon_claro", .22, .42, .45, .02, 8.4); bola("hoja", .42, .45, .95, 8.4); bola("hoja", .3, .62, 1.3, 8.3); cil("hormigon_claro", .18, .36, 11.55, .02, 3.95); bola("hoja", .32, 11.55, .78, 3.95);
    cil("metal_negro", .015, 1.45, 1.15, .02, 7.35, 8); cil("metal_negro", .14, .02, 1.15, .02, 7.35); cil("luz_calida", .17, .26, 1.15, 1.42, 7.35);
    [5.1, 5.7, 6.3].forEach(x => { cil("metal_negro", .006, 1.0, x, H - 1.0, 2.45, 6); bola("luz_calida", .11, x, H - 1.08, 2.45); });
    B("negro_brillo", .62, .01, .5, 4.0, .94, .14); cil("metal_negro", .015, .28, 6.0, .94, .3, 8); B("metal_negro", .03, .03, .2, 5.985, 1.2, .3);
    B("nogal", .45, .45, .4, 8.65, .02, .45); B("nogal", .45, .45, .4, 11.3, .02, .45); cil("luz_calida", .09, .2, 8.87, .47, .65); cil("luz_calida", .09, .2, 11.52, .47, .65);
    g.traverse(o => { if (o.isMesh) { o.castShadow = o.material.name !== "vidrio"; o.receiveShadow = true; } });
    luzEstudio(g, { amb: .5, clave: .7, relleno: .35 });
    return { g, amb: "Atardecer", estilo: "Original", rooms: [estanciaM("Salón y cocina", 0, 8, 0, 9), estanciaM("Dormitorio", 8, 12, 0, 4.4), estanciaM("Baño", 8, 12, 4.45, 7), estanciaM("Recibidor", 8, 12, 7, 9), estanciaM("Terraza", -1, 13, 9, 12)], nombre: "Loft minimalista" };
  }
  /* Pabellón de cristal: losa volada sobre pilares finos, muros de piedra y lámina de agua */
  function creaPabellon() {
    const g = new THREE.Group(), B = constructor(g);
    B("cesped", 40, .3, 32, -12, -.3, -10); B("piedra_natural", 22, .55, 13, -2, -.3, 0); B("azulejo_piscina", 6.2, .01, 5.2, -1.6, .27, 1.1); B("agua_piscina", 6, .012, 5, -1.5, .275, 1.2);
    B("piedra_natural", 22, .02, 13, -2, .25, 0, "suelo");
    B("hormigon_claro", 14, .3, 9, 4, 3.5, 2); B("techo_blanco", 13.8, .02, 8.8, 4.1, 3.48, 2.1);
    [[5, 3], [5, 10], [12, 3], [12, 10], [16.5, 3], [16.5, 10]].forEach(([x, z]) => B("acero", .14, 3.25, .14, x, .27, z));
    B("vidrio", .02, 3.2, 6.8, 5.5, .27, 3.1); B("vidrio", .02, 3.2, 6.8, 16.2, .27, 3.1); B("vidrio", 10.7, 3.2, .02, 5.5, .27, 9.9);
    B("marmol_crema", 5, 3.2, .18, 8, .27, 5.5); B("marmol_negro", .18, 3.2, 3.5, 13.5, .27, 4); B("piedra_oscura", 9, 2.6, .3, 9, .27, 11.6);
    B("cuero_cognac", .8, .42, .8, 9.2, .27, 7); B("cuero_cognac", .8, .42, .8, 10.4, .27, 7); B("metal_negro", .8, .04, .8, 9.2, .27, 7); B("vidrio", 1.1, .04, .6, 9.6, .62, 8.1);
    B("alfombra", 4, .012, 3, 8.6, .28, 6.4); B("estuco_blanco", 3, 2.2, .05, 0, .27, 12.4);
    g.traverse(o => { if (o.isMesh) { o.castShadow = o.material.name !== "vidrio"; o.receiveShadow = true; } });
    luzEstudio(g, { amb: .45, clave: .5, relleno: .3 });
    return { g, amb: "Atardecer", estilo: "Oscuro", rooms: [estanciaM("Pabellón", 5.5, 16.2, 3.1, 9.9, .27), estanciaM("Lámina de agua", -1.5, 4.5, 1.2, 6.2, .27)], nombre: "Pabellón de cristal" };
  }
  /* Sala de exposición con el superdeportivo */
  function creaShowroom() {
    const g = new THREE.Group(), B = constructor(g);
    B("hormigon_pulido", 22, .3, 18, -11, -.3, -9); B("estuco_blanco", 22, 5, .2, -11, 0, -9.2); B("estuco_blanco", .2, 5, 18, -11.2, 0, -9); B("estuco_blanco", .2, 5, 18, 11, 0, -9); B("estuco_blanco", 22.4, 5, .2, -11.2, 0, 9);
    B("techo_blanco", 22.4, .2, 18.2, -11.2, 5, -9.2); B("marmol_negro", 7, .12, 4, -3.5, 0, -2);
    for (let i = -8; i <= 8; i += 4) B("luz_calida", .3, .03, 12, i - .15, 4.96, -6);
    const k = { caja: new THREE.Box3(V3(-2.4, .12, -1), V3(2.4, 1.3, 1)), faros: V3(3, .6, 0), nf: 1, suelo: .12 };
    g.add(supercoche(k, 0));
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    luzEstudio(g, { amb: .6, clave: 1.25, relleno: .55, pos: [4, 8, 6] });
    return { g, amb: "Blanco", estilo: "Original", rooms: [estanciaM("Sala de exposición", -11, 11, -9, 9)], nombre: "Superdeportivo" };
  }
  /* Galería de arte con la escultura en el centro */
  function creaGaleriaArte() {
    const g = new THREE.Group(), B = constructor(g);
    B("porcelanico_gris", 16, .3, 12, -8, -.3, -6); B("estuco_blanco", 16, 4.2, .2, -8, 0, -6.2); B("estuco_blanco", .2, 4.2, 12, -8.2, 0, -6); B("estuco_blanco", .2, 4.2, 12, 8, 0, -6); B("estuco_blanco", 16, 4.2, .2, -8, 0, 6);
    B("techo_blanco", 16.4, .2, 12.4, -8.2, 4.2, -6.2);
    [[-7.9, -2], [-7.9, 2], [7.75, 0]].forEach(([x, z]) => B("nogal", .15, 1.4, 1.9, x, 1.2, z - .95));
        const e = new THREE.Mesh(geoEscultura(), matEscultura()); e.position.y = 1.62; e.morphTargetInfluences = [0, 0]; e.castShadow = true; e.name = "escultura"; g.add(e); B("marmol_negro", 1.3, .45, 1.3, -.65, 0, -.65, "peana");
    for (let i = -6; i <= 6; i += 3) B("luz_calida", .25, .03, 9, i - .12, 4.16, -4.5);
    g.traverse(o => { if (o.isMesh) { o.receiveShadow = true; if (o.castShadow !== true) o.castShadow = true; } });
    luzEstudio(g, { amb: .5, clave: .9, relleno: .4, pos: [3, 9, 4] });
    return { g, amb: "Blanco", estilo: "Original", rooms: [estanciaM("Galería", -8, 8, -6, 6)], nombre: "Galería con escultura" };
  }
  const MUESTRAS = [
    { n: "Loft minimalista", d: "Salón-cocina, dormitorio y baño, con todo detalle", foto: "loft", c: creaLoft }
  ];
  async function abreMuestra(mu) {
    $("galeria").hidden = true; cierraPanel();
    if (mu.f) { mu.f(); return; }
    irPortada(); ocupado(true);
    try {
      await estado("Construyendo " + mu.n.toLowerCase()); const r = mu.c(); H.fuentes = null; H.ruta = null;
      /* Los ejemplos se abren en su versión oscura y minimalista: de noche y con las luces encendidas */
      const k = "pc:datos:" + r.nombre, d0 = guarda.leer(k); if (!d0 || d0.v !== 3) guarda.poner(k, Object.assign({}, d0 || { puntos: [], muebles: [], vistas: [], suelo: "", pared: "" }, { v: 3, amb: r.amb || "Atardecer", estilo: r.estilo || "Oscuro" }));
      await instalar(r.g, "glb", r.nombre, { rooms: r.rooms }); ponLuces(true);
    }
    catch (e) { console.error(e); fallo(motivo(e)); }
  }
  /* La galería empieza por los modelos de ejemplo */
  const galeriaBase = galeria;
  galeria = async function () {
    await galeriaBase(); const caja = $("galeria").querySelector(".tarjetas"); if (!caja) return;
    caja.querySelectorAll(".tarjetaG").forEach((b, i) => { if (i === 0) b.remove(); });
    const GR = ["linear-gradient(135deg,#2b3a2e,#0d120e)", "linear-gradient(135deg,#3a332a,#120f0c)", "linear-gradient(135deg,#25313a,#0b0f12)", "linear-gradient(135deg,#3a1414,#120606)", "linear-gradient(135deg,#34322d,#0f0e0c)"];
    const t = texto("p", "eti"); t.innerHTML = "<b>00</b>Modelo de ejemplo"; t.style.gridColumn = "1 / -1"; caja.prepend(t);
    MUESTRAS.slice().reverse().forEach((mu, k) => { const i = MUESTRAS.length - 1 - k, b = texto("button", "tarjetaG"); b.type = "button"; b.innerHTML = `<span class="img" style="background:${GR[i]}"><img src="muestras/${mu.foto}.jpg" alt="" loading="lazy" decoding="async" onerror="this.remove()"><span class="num">${String(i + 1).padStart(2, "0")}</span></span><span class="info"><b></b><small></small></span>`; b.querySelector("b").textContent = mu.n; b.querySelector("small").textContent = mu.d; b.onclick = () => abreMuestra(mu); t.after(b); });
  };
  /* Explorar: los modelos de ejemplo a mano */
  BOTONES.vista = function (p) {
    titulo(p, "Modelo de ejemplo");
    MUESTRAS.forEach((mu, i) => { const b = texto("button", "linea"); b.type = "button"; b.innerHTML = `${ico(["casa", "sofa", "techo", "flecha", "chispa"][i])}<div><span></span><small></small></div>`; b.querySelector("span").textContent = mu.n; b.querySelector("small").textContent = mu.d; b.onclick = () => abreMuestra(mu); p.append(b); });
    const g = texto("button", "linea"); g.type = "button"; g.innerHTML = ico("galeria") + "<div>Galería de proyectos<small>Casas publicadas para recorrer</small></div>"; g.onclick = galeria; p.append(g);
  };
  $("verMuestras").onclick = galeria;
  /* Las posiciones de las secciones se recalculan solo cuando cambia el diseño */
  addEventListener("resize", () => { pf.offs = null; }, { passive: true });
  if (document.fonts) document.fonts.ready.then(() => { pf.offs = null; });
  setTimeout(() => { pf.offs = null; }, 2500);
  /* El botón principal abre el loft de ejemplo (generado al momento, 0 KB de descarga) */
  { const b = $("muestra"), n = b.cloneNode(true); b.replaceWith(n); n.onclick = () => abreMuestra(MUESTRAS[0]); }
