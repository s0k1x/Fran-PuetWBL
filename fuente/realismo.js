  /* ---------- Realismo: materiales físicos, cielo, agua y posproceso ----------
     Los materiales se reconocen por su nombre (madera_suelo, marmol_blanco, vidrio…).
     Las texturas usan proyección en caja en metros reales: no dependen de las UV del modelo.
     El posproceso trabaja en alto rango dinámico: oclusión ambiental, resplandor,
     tono fílmico, gradación, viñeta y grano. Hay tres niveles y baja solo si va lento. */
  const R = {
    activo: false, tex: new Map(), mats: new Map(), pend: 0, t: 0, ambiente: "Natural",
    exp: 1, mascara: null, caja: null, transparentes: new Set(), luces: [], cielo: null, suelo: null, cieloEnv: {}, envAct: null,
    nivel: 2, medidas: [], fijo: false, lucesOn: true, expAuto: 1, expMed: 1, escala: 1, mascaraDatos: null, abObj: 0, abS: 0, sombras: true, solBase: 1, hemiBase: .2
  };
  const RL = R;
  const NIVELES = ["Básica", "Alta", "Ultra"];
  /* Media de cada textura de color: la textura se tiñe con el color del material sin cambiar su albedo */
  const MEDIAS = { asfalto: .801, cesped: .29, cuero: .835, estuco: .932, follaje: .709, grava: .585, gresite: .856, hormigon: .867, madera: .818, marmol: .89, marmol_negro: .149, pavimento: .932, piedra: .875, porcelanico: .948, tela: .899, tierra: .848 };
  /* t: textura · e: metros que cubre · r: rugosidad · m: metal · cc: barniz · sh: terciopelo · n: fuerza del relieve
     tinte:false usa la textura tal cual · int: el material está dentro (recibe menos cielo) */
  const BIB = {
    acera: { t: "hormigon", e: 2.5, r: .82, n: .8, rug: true },
    acero: { r: .32, m: 1, col: 0xc9cdd2 },
    agua_piscina: { tipo: "agua" },
    alfombra: { t: "tela", e: .45, r: .97, sh: .6, n: 1.2 },
    alfombra_oscura: { t: "tela", e: .45, r: .97, sh: .6, n: 1.2 },
    asfalto: { t: "asfalto", e: 3, r: .88, n: 1 },
    azulejo_piscina: { t: "gresite", e: .5, r: .12, n: .9, caus: true, col: 0x4aa9c4 },
    cesped: { t: "cesped", e: 3.2, r: .93, tinte: false, k: .82, n: 0 },
    coche_blanco: { r: .32, cc: 1, ccr: .03, col: 0xeeeeec },
    coche_gris: { r: .38, m: .65, cc: 1, ccr: .04 },
    coche_negro: { r: .3, cc: 1, ccr: .03 },
    cristal_lampara: { r: .1, luz: 1.4 },
    cubierta_grava: { t: "grava", e: 1.2, r: .95, n: 1 },
    cuero_cognac: { t: "cuero", e: .35, r: .52, cc: .25, ccr: .4, n: .9 },
    espejo: { r: .02, m: 1, col: 0xf2f4f6 },
    estuco_blanco: { t: "estuco", e: 2.2, r: .9, n: .6 },
    flores_crema: { r: .75, sh: .4 },
    flores_rojas: { r: .75, sh: .4 },
    hoja_palmera: { t: "follaje", e: .9, r: .78, n: .8, sh: .25 },
    hoja_tropical: { t: "follaje", e: .7, r: .7, n: .8, sh: .25 },
    hormigon_claro: { t: "hormigon", e: 3, r: .78, n: .7, rug: true },
    hormigon_pulido: { t: "hormigon", e: 3, r: .22, n: .3, cc: .6, ccr: .12 },
    lacado_arena: { r: .3, cc: .9, ccr: .08 },
    laton: { r: .26, m: 1, col: 0xd7ae6a },
    libro_a: { r: .7 }, libro_b: { r: .7 }, libro_c: { r: .7 },
    luz_calida: { r: .4, luz: 1.6 },
    luz_piscina: { r: .4, luz: 1.4 },
    luz_roja: { r: .4, luz: 1.2 },
    maceta: { t: "hormigon", e: .8, r: .85, n: .8 },
    madera_calida: { t: "madera", e: 2.4, r: .5, n: .7, rug: true, cc: .2, ccr: .3 },
    madera_suelo: { t: "madera", e: 2.6, r: .42, n: .8, rug: true, cc: .35, ccr: .18 },
    marmol_blanco: { t: "marmol", e: 3.4, r: .09, n: .25, rug: true, cc: .5, ccr: .05 },
    marmol_crema: { t: "marmol", e: 3.4, r: .1, n: .25, rug: true, cc: .5, ccr: .05 },
    marmol_negro: { t: "marmol_negro", e: 1.8, r: .07, n: .25, tinte: false, cc: .7, ccr: .03 },
    metal_negro: { r: .42, m: .9, col: 0x1b1c1e },
    negro_brillo: { r: .34, cc: .4, ccr: .2 },
    neumatico: { r: .9 },
    nogal: { t: "madera", e: 2.4, r: .45, n: .7, rug: true, cc: .3, ccr: .2 },
    panel_tapizado: { t: "tela", e: .4, r: .95, sh: .7, n: 1 },
    pantalla_lampara: { t: "tela", e: .3, r: .9, sh: .3, luz: .55 },
    pavimento_exterior: { t: "pavimento", e: 1.2, r: .74, n: 1 },
    piedra_exterior: { t: "piedra", e: 1.2, r: .78, n: 1 },
    piedra_natural: { t: "piedra", e: 1.2, r: .72, n: 1 },
    piedra_oscura: { t: "piedra", e: 1.2, r: .7, n: 1 },
    pintura_crema: { t: "estuco", e: 2.2, r: .86, n: .5 },
    pintura_linea: { r: .6 },
    porcelana: { r: .06, cc: 1, ccr: .02 },
    porcelana_int: { r: .08, cc: .8, ccr: .03 },
    porcelanico_gris: { t: "porcelanico", e: 1.2, r: .16, n: .8, cc: .4, ccr: .06 },
    seto: { t: "follaje", e: .8, r: .8, n: 1, sh: .25 },
    techo_blanco: { t: "estuco", e: 3, r: .95, n: .4 },
    tela_acento: { t: "tela", e: .4, r: .95, sh: .7, n: 1 },
    tela_arena: { t: "tela", e: .4, r: .95, sh: .7, n: 1 },
    tela_crema: { t: "tela", e: .4, r: .95, sh: .7, n: 1 },
    tela_gris: { t: "tela", e: .4, r: .95, sh: .7, n: 1 },
    tierra: { t: "tierra", e: 2, r: 1, n: 0 },
    tronco_palmera: { t: "cuero", e: .5, r: .9, n: 1.6 },
    vidrio: { tipo: "vidrio", op: .1, r: .02 },
    vidrio_esmerilado: { tipo: "vidrio", op: .62, r: .4 },
    vidrio_oscuro: { tipo: "vidrio", op: .55, r: .04, col: 0x111416 }
  };
  /* Cada ambiente: cielo físico, entorno HDR, sol, niebla y exposición */
  const CIELOS = {
    Natural: { hdr: "rooitou_park", turb: 2.4, ray: 1.1, mie: .004, g: .82, exp: 1.02, niebla: 0xb9cad8, dens: .0026, env: .55, noche: 0, gan: .32, sol: 1.5 },
    Amanecer: { hdr: "kiara_1_dawn", turb: 4, ray: 2.2, mie: .006, g: .86, exp: 1, niebla: 0xd9b9a2, dens: .003, env: .55, noche: .25, gan: .3, sol: 1.5 },
    Atardecer: { hdr: "venice_sunset", turb: 6, ray: 2.8, mie: .008, g: .9, exp: 1.05, niebla: 0xc98a62, dens: .0032, env: .5, noche: .5, gan: .3, sol: 1.6 },
    Noche: { hdr: "moonless_golf", turb: 1, ray: .4, mie: .002, g: .7, exp: 1, niebla: 0x060a12, dens: .004, env: .6, noche: 1, gan: .03, sol: 1 },
    Blanco: { hdr: "rooitou_park", turb: 1.5, ray: .3, mie: .002, g: .7, exp: 1, niebla: 0xe8e8e6, dens: .003, env: .9, noche: 0, gan: .5, sol: 1.2 }
  };

  function cargaTex(n, srgb) {
    const k = n + (srgb ? "+" : ""); if (R.tex.has(k)) return R.tex.get(k);
    R.pend++;
    const t = new THREE.TextureLoader().load("texturas/" + n + ".jpg", () => R.pend--, undefined, () => { R.pend--; console.warn("Falta la textura " + n); });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); if (srgb) t.encoding = THREE.sRGBEncoding;
    R.tex.set(k, t); return t;
  }
  const esperaReal = (max = 9000) => new Promise(ok => { const t0 = performance.now(), mira = () => (R.pend <= 0 || performance.now() - t0 > max) ? ok() : setTimeout(mira, 60); mira(); });
  const U_R = { uT: { value: 0 }, uMask: { value: null }, uMaskBox: { value: new THREE.Vector4(0, 0, 0, 0) }, uNiv: { value: new THREE.Vector2(3.75, 7.4) }, uEnvIn: { value: .82 }, uCaus: { value: .6 }, uNoche: { value: 0 }, uLuz: { value: 1 }, uRelleno: { value: new THREE.Vector3() } };

  /* Fragmentos de shader comunes */
  const GLSL_CAJA = `
    varying vec3 vMundo; varying vec3 vNorM;
    uniform vec2 uEsc; uniform float uNs, uRM, uT, uEnvIn, uCaus, uNoche, uLuz; uniform vec3 uRelleno; uniform vec3 uMedia;
    uniform sampler2D tC, tN, tR, uMask; uniform vec4 uMaskBox; uniform vec2 uNiv;
    vec2 bUV; vec3 bT, bB, bN;
    void cajaUV() {
      bN = normalize(vNorM); vec3 a = abs(bN);
      if (a.y >= a.x && a.y >= a.z) { bUV = vMundo.xz; bT = vec3(1., 0., 0.); bB = vec3(0., 0., -1.); }
      else if (a.x >= a.z) { bUV = vec2(vMundo.z * sign(bN.x), vMundo.y); bT = vec3(0., 0., sign(bN.x)); bB = vec3(0., 1., 0.); }
      else { bUV = vec2(-vMundo.x * sign(bN.z), vMundo.y); bT = vec3(-sign(bN.z), 0., 0.); bB = vec3(0., 1., 0.); }
      bUV /= uEsc;
    }
    float interior() {
      vec2 q = (vMundo.xz + bN.xz * .3 - uMaskBox.xy) * uMaskBox.zw;
      if (uMaskBox.z == 0. || q.x < 0. || q.y < 0. || q.x > 1. || q.y > 1. || vMundo.y > uNiv.y) return 0.;
      vec2 m = texture2D(uMask, q).rg; return vMundo.y < uNiv.x ? m.r : m.g;
    }
    float causticas(vec2 p, float t) {
      p *= 1.3; vec2 i = p; float c = 1.;
      for (int n = 0; n < 4; n++) { float tt = t * (1. - (3.5 / float(n + 1))); i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x)); c += 1. / max(length(vec2(p.x * sin(i.x + tt) / .006, p.y * cos(i.y + tt) / .006)), .05); }
      c /= 4.; c = 1.17 - pow(clamp(c, 0., 3.), 1.4); return min(pow(abs(c), 7.), 2.);
    }`;
  function inyecta(m, d, op = {}) {
    const un = { uEsc: { value: new THREE.Vector2(d.e || 1, (d.e || 1) * (d.t === "madera" ? .5 : 1)) }, uNs: { value: d.n ?? 1 }, uRM: { value: 1 / ({ hormigon: .829, madera: .363, marmol: .086 }[d.t] || .5) }, uMedia: { value: new THREE.Vector3(1, 1, 1) },
      tC: { value: d.t ? cargaTex(d.t + "_c", true) : null }, tN: { value: d.t && d.n !== 0 ? cargaTex((d.tn || d.t.replace("_negro", "")) + "_n") : (op.tN || null) }, tR: { value: d.rug ? cargaTex(d.t + "_r") : null } };
    if (op.tN) un.tN.value = op.tN;
    const def = []; if (un.tC.value) def.push("B_COL"); if (un.tN.value) def.push("B_NOR"); if (un.tR.value) def.push("B_RUG"); if (op.agua) def.push("B_AGUA"); if (d.caus) def.push("B_CAUS"); if (op.vidrio) def.push("B_VIDRIO"); if (d.luz) def.push("B_LUZ");
    if (!op.sinMascara) def.push("B_MASK");
    m.userData.real = d; m.userData.un = un;
    m.customProgramCacheKey = () => "real:" + def.join(",");
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, un, U_R);
      sh.vertexShader = "varying vec3 vMundo; varying vec3 vNorM;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.0)).xyz; vNorM = normalize(mat3(modelMatrix) * objectNormal);");
      let f = def.map(x => "#define " + x).join("\n") + "\n" + sh.fragmentShader.replace("void main() {", GLSL_CAJA + "\nvoid main() {\n cajaUV();");
      f = f.replace("#include <map_fragment>", `#include <map_fragment>
        #ifdef B_COL
          vec3 bc = texture2D(tC, bUV).rgb;
          float bMac = dot(texture2D(tC, bUV * .11 + .37).rgb, vec3(.3333)) / max(.05, dot(uMedia, vec3(.3333)));
          diffuseColor.rgb *= bc * mix(1., clamp(bMac, .6, 1.4), .22);
        #endif`);
      f = f.replace("#include <roughnessmap_fragment>", `float roughnessFactor = roughness;
        #ifdef B_RUG
          roughnessFactor = clamp(roughness * texture2D(tR, bUV).g * uRM, .02, 1.);
        #endif`);
      f = f.replace("#include <normal_fragment_maps>", `#ifdef B_NOR
          #ifdef B_AGUA
            vec3 bn = normalize(texture2D(tN, bUV * .7 + uT * vec2(.021, .013)).xyz * 2. - 1. + texture2D(tN, bUV * 1.6 + uT * vec2(-.017, .019)).xyz * 2. - 1.);
          #else
            vec3 bn = texture2D(tN, bUV).xyz * 2. - 1.;
          #endif
          bn.xy *= uNs;
          normal = normalize((viewMatrix * vec4(normalize(bT * bn.x + bB * bn.y + bN * bn.z), 0.)).xyz) * faceDirection;
        #else
          #include <normal_fragment_maps>
        #endif`);
      f = f.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        #ifdef B_CAUS
          totalEmissiveRadiance += causticas(vMundo.xz, uT * .9) * uCaus * diffuseColor.rgb * 2.2;
        #endif
        #ifdef B_LUZ
          totalEmissiveRadiance *= uLuz;
        #endif`);
      f = f.replace("#include <lights_fragment_maps>", `#include <lights_fragment_maps>
        #ifdef B_MASK
          float bIn = interior(), bEnv = mix(1., uEnvIn, bIn);
          iblIrradiance = mix(iblIrradiance, vec3(dot(iblIrradiance, vec3(.3, .59, .11))) * vec3(1.04, 1., .93), bIn * .85);
          iblIrradiance *= bEnv; irradiance *= bEnv; radiance *= mix(1., bEnv, .55);
          irradiance += uRelleno * bIn;
        #endif`);
      if (op.vidrio) f = f.replace("#include <output_fragment>", `vec3 bSp = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
          float bF = pow(1. - abs(dot(normalize(-vViewPosition), normal)), 4.);
          float bA = clamp(diffuseColor.a + bF * .55, 0., .96);
          gl_FragColor = vec4((outgoingLight - bSp) * bA + bSp * (1. + bF * 1.5), bA);`).replace("#include <premultiplied_alpha_fragment>", "");
      sh.fragmentShader = f;
    };
    return m;
  }
  function materialReal(a) {
    const nom = String(a && a.name || "").toLowerCase().replace(/\.\d+$/, ""), d = BIB[nom]; if (!d) return null;
    if (R.mats.has(nom)) return R.mats.get(nom);
    const base = d.col !== undefined ? new THREE.Color(d.col) : (a.color ? a.color.clone() : new THREE.Color(.8, .8, .8));
    let m;
    if (d.tipo === "vidrio") {
      m = new THREE.MeshPhysicalMaterial({ color: base, roughness: d.r, metalness: 0, transparent: true, opacity: d.op, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.3, ior: 1.52, specularIntensity: 1 });
      m.premultipliedAlpha = true; inyecta(m, { n: 0 }, { vidrio: true, sinMascara: true });
    } else if (d.tipo === "agua") {
      /* Agua sin pasada extra: transparente con reflejos de Fresnel, así no se dibuja la escena dos veces */
      m = new THREE.MeshPhysicalMaterial({ color: 0x1f8fa6, roughness: .035, metalness: 0, transparent: true, opacity: .5, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.25, ior: 1.333, specularIntensity: 1 });
      m.premultipliedAlpha = true; inyecta(m, { e: 2.2, n: .32 }, { agua: true, vidrio: true, tN: cargaTex("agua_n"), sinMascara: true });
    } else {
      const fis = d.cc || d.sh;
      m = new (fis ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({ color: 0xffffff, roughness: d.r ?? .7, metalness: d.m || 0, side: THREE.DoubleSide });
      const media = d.t ? MEDIAS[d.t] || 1 : 1;
      if (d.t && d.tinte === false) m.color.setScalar(d.k || 1); else m.color.copy(base).multiplyScalar(1 / media);
      if (d.cc) { m.clearcoat = d.cc; m.clearcoatRoughness = d.ccr ?? .08; }
      if (d.sh) { m.sheen = d.sh; m.sheenRoughness = .55; m.sheenColor = base.clone().lerp(new THREE.Color(1, 1, 1), .25); }
      if (d.luz) { const e = a.emissive && a.emissive.getHex() ? a.emissive.clone() : base.clone(); m.emissive.copy(e); m.emissiveIntensity = d.luz; m.userData.luz = d.luz; }
      if (a.transparent && a.opacity < 1) { m.transparent = true; m.opacity = a.opacity; m.depthWrite = false; }
      inyecta(m, d);
      if (d.t) m.userData.un.uMedia.value.setScalar(media);
    }
    m.name = nom; R.mats.set(nom, m); return m;
  }

  /* Máscara de interiores: dentro de casa el cielo ilumina menos y manda la luz que entra por las ventanas */
  function mascaraInteriores(rooms) {
    const rs = (rooms || []).filter(r => r.rects && !/terraza|balc[oó]n|porche|jard[ií]n|piscina|exterior/i.test(r.name));
    if (!rs.length) { U_R.uMaskBox.value.set(0, 0, 0, 0); R.mascaraDatos = null; return; }
    let xa = 1e9, xb = -1e9, za = 1e9, zb = -1e9; rs.forEach(r => r.rects.forEach(([x0, x1, z0, z1]) => { xa = Math.min(xa, x0); xb = Math.max(xb, x1); za = Math.min(za, z0); zb = Math.max(zb, z1); }));
    xa -= 1; za -= 1; xb += 1; zb += 1;
    const S = 256, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d"), sx = S / (xb - xa), sz = S / (zb - za);
    g.fillStyle = "#000"; g.fillRect(0, 0, S, S); g.globalCompositeOperation = "lighter";
    const ys = [...new Set(rs.map(r => +(r.y || 0).toFixed(1)))].sort((a, b) => a - b);
    rs.forEach(r => { const alta = ys.length > 1 && r.y > ys[0] + .5; g.fillStyle = alta ? "#00ff00" : "#ff0000"; r.rects.forEach(([x0, x1, z0, z1]) => g.fillRect((x0 - xa) * sx, (z0 - za) * sz, (x1 - x0) * sx, (z1 - z0) * sz)); });
    R.mascaraDatos = { d: g.getImageData(0, 0, S, S).data, S };
    const t = new THREE.CanvasTexture(c); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.flipY = false;
    if (R.mascara) R.mascara.dispose(); R.mascara = t; U_R.uMask.value = t;
    U_R.uMaskBox.value.set(xa, za, 1 / (xb - xa), 1 / (zb - za));
    const yPA = ys.length > 1 ? ys[1] : 99; U_R.uNiv.value.set(yPA - .2, (ys.length > 1 ? ys[1] : ys[0]) + 3.3);
  }

  /* ---------- Cielo, entorno y suelo ---------- */
  async function preparaCielo() {
    if (R.cielo) return;
    await pide("objects/Sky.js");
    const s = new THREE.Sky(); s.scale.setScalar(900); s.frustumCulled = false; s.renderOrder = -10; s.userData.noCollide = true;
    s.material.uniforms.uGan = { value: 1 };
    s.material.fragmentShader = s.material.fragmentShader.replace("gl_FragColor = vec4( retColor, 1.0 );", "gl_FragColor = vec4( retColor * uGan, 1.0 );").replace("void main() {", "uniform float uGan;\nvoid main() {");
    s.material.depthWrite = false; s.visible = false; scene.add(s); R.cielo = s;
  }
  function entornoHDR(nombre) {
    if (R.cieloEnv[nombre]) return R.cieloEnv[nombre];
    return R.cieloEnv[nombre] = pide("loaders/RGBELoader.js").then(() => new Promise((ok, no) => new THREE.RGBELoader().load("cielos/" + nombre + ".hdr", t => {
      t.mapping = THREE.EquirectangularReflectionMapping; const pm = new THREE.PMREMGenerator(renderer), env = pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose(); ok(env);
    }, undefined, no)));
  }
  function sueloInfinito(caja) {
    if (R.suelo) { scene.remove(R.suelo); R.suelo.geometry.dispose(); }
    const L = 700, s = new THREE.Shape([new THREE.Vector2(-L, -L), new THREE.Vector2(L, -L), new THREE.Vector2(L, L), new THREE.Vector2(-L, L)]);
    s.holes.push(new THREE.Path([new THREE.Vector2(caja.min.x, -caja.min.z), new THREE.Vector2(caja.min.x, -caja.max.z), new THREE.Vector2(caja.max.x, -caja.max.z), new THREE.Vector2(caja.max.x, -caja.min.z)]));
    const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2);
    const m = materialReal({ name: "cesped", color: new THREE.Color(.3, .48, .2) });
    const e = new THREE.Mesh(g, m); e.position.y = -.004; e.receiveShadow = true; e.userData.noCollide = true; e.visible = false; scene.add(e); R.suelo = e;
  }
  /* Ambiente: cambia cielo, entorno, niebla, exposición y lámparas. Se llama desde solEn */
  function ambienteReal(n, solDir) {
    const C = CIELOS[n] || CIELOS.Natural; R.ambiente = n; R.exp = C.exp; R.solDir = solDir.clone().normalize(); U_R.uNoche.value = C.noche; U_R.uCaus.value = C.noche > .7 ? .15 : .6 * (1 - C.noche * .5);
    if (!R.activo) return;
    if (R.cielo) { const u = R.cielo.material.uniforms; u.turbidity.value = C.turb; u.rayleigh.value = C.ray; u.mieCoefficient.value = C.mie; u.mieDirectionalG.value = C.g; u.sunPosition.value.copy(solDir).multiplyScalar(400); u.uGan.value = C.gan; }
    R.solBase = (LUCES[n] || LUCES.Natural).i * C.sol; R.hemiBase = (LUCES[n] || LUCES.Natural).h * .35; R.abS = -1;
    scene.fog = new THREE.FogExp2(C.niebla, C.dens);
    const pedido = n; entornoHDR(C.hdr).then(env => { if (R.ambiente === pedido && R.activo) { scene.environment = env; R.envAct = env; } }).catch(e => console.warn(e));
    aplicaLuces();
  }
  /* Lámparas: encendidas solas al atardecer y de noche, o como diga quien visita (también la IA) */
  function aplicaLuces() {
    const C = CIELOS[R.ambiente] || CIELOS.Natural, on = R.lucesOn === null ? C.noche >= .25 : R.lucesOn;
    U_R.uLuz.value = on ? 1 + C.noche * 1.1 : .04;
    /* Luz de relleno de las lámparas en todo el interior: ilumina como varias luces sin costar como ellas */
    const k = on ? .95 + C.noche * .55 : C.noche > .7 ? .05 : 0; U_R.uRelleno.value.set(1, .84, .66).multiplyScalar(k * Math.PI * .32);
    R.luces.forEach(l => l.intensity = on ? 1.2 + C.noche * 2.6 : 0);
    return on;
  }
  function ponLuces(v) { const antes = aplicaLuces(); R.lucesOn = v === "alternar" ? !antes : !!v; return aplicaLuces(); }
  /* Dos escenarios: la portada y el modelo abierto. Cada uno recuerda si usa realismo */
  const ESC = { portada: null, modelo: null }; let escAct = null;
  async function registraReal(destino, grupo, rooms) {
    let n = 0; grupo.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => { if (m && m.userData.real) n++; }); });
    if (!n) { ESC[destino] = null; if (escAct === destino) { escAct = null; usarReal(destino); } return false; }
    const trans = []; grupo.traverse(o => { if (!o.isMesh) return; const ms = [].concat(o.material), tr = ms.some(m => m.transparent), tm = ms.some(m => m.transmission); if (tr || tm) trans.push(o); o.castShadow = !tr; o.userData.cs = o.castShadow; o.receiveShadow = true; });
    await preparaCielo();
    ESC[destino] = { rooms, caja: new THREE.Box3().setFromObject(grupo), trans, grupo };
    escAct = null; usarReal(destino);
    return true;
  }
  function usarReal(destino) {
    if (escAct === destino) return; escAct = destino;
    const e = ESC[destino];
    if (!e) {
      R.activo = false; scene.fog = null; if (R.cielo) R.cielo.visible = false; if (R.suelo) R.suelo.visible = false;
      R.luces.forEach(l => scene.remove(l)); R.luces = []; R.transparentes.clear();
      if (R.envAct && scene.environment === R.envAct) scene.environment = R.envSala || null;
      return;
    }
    R.activo = true; mascaraInteriores(e.rooms); sueloInfinito(e.caja); R.caja = e.caja; R.abS = -1; R.sombras = !R.sombras; R.sombras = true; e.grupo.traverse(o => { if (o.isMesh && o.userData.cs !== undefined) o.castShadow = o.userData.cs; });
    R.transparentes = new Set(e.trans);
    /* Lámparas reales en las estancias principales: se encienden al atardecer y de noche */
    R.luces.forEach(l => scene.remove(l)); R.luces = [];
    if (R.nivel >= 1) (e.rooms || []).filter(r => r.rects && !/terraza|balc|garaje|pasillo|distribuidor|almac|cuarto|despensa|bodega/i.test(r.name)).sort((a, b) => b.area - a.area).slice(0, R.nivel >= 2 ? 4 : 0).forEach(r => {
      const l = new THREE.PointLight(0xffd2a0, 0, Math.max(7, Math.sqrt(r.area) * 1.6), 2); l.position.set(r.x, (r.y || 0) + 2.45, r.z); scene.add(l); R.luces.push(l);
    });
    R.cielo.visible = R.suelo.visible = true;
    if (R.envAct) scene.environment = R.envAct; aplicaLuces();
    ambienteReal(R.ambiente, R.solDir || new THREE.Vector3(-.55, .75, .5));
  }

  /* ---------- Posproceso propio en alto rango dinámico ---------- */
  const PQ = { listo: false, w: 0, h: 0 };
  const QUAD = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), CAM_Q = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); QUAD.frustumCulled = false;
  const VS_Q = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }";
  const shQ = (fs, u) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS_Q, fragmentShader: fs, depthTest: false, depthWrite: false });
  function paso(mat, destino) { QUAD.material = mat; renderer.setRenderTarget(destino); renderer.render(QUAD, CAM_Q); }
  const FS_AO = `
    varying vec2 vUv; uniform sampler2D tProf, tNor; uniform mat4 uPI, uP; uniform vec2 uRes; uniform float uRad; uniform vec3 uK[14];
    vec3 vista(vec2 uv, float d) { vec4 c = vec4(uv * 2. - 1., d * 2. - 1., 1.); vec4 v = uPI * c; return v.xyz / v.w; }
    void main() {
      float d = texture2D(tProf, vUv).x; if (d >= .9999) { gl_FragColor = vec4(1.); return; }
      vec3 p = vista(vUv, d), n = normalize(texture2D(tNor, vUv).xyz * 2. - 1.);
      float r = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715)))) * 6.2831;
      vec3 t = normalize(vec3(cos(r), sin(r), 0.) - n * dot(vec3(cos(r), sin(r), 0.), n)), b = cross(n, t);
      float oc = 0., rad = uRad * clamp(-p.z / 6., .35, 1.6);
      for (int i = 0; i < 14; i++) {
        vec3 s = p + (t * uK[i].x + b * uK[i].y + n * uK[i].z) * rad;
        vec4 q = uP * vec4(s, 1.); q.xy = q.xy / q.w * .5 + .5;
        if (q.x < 0. || q.y < 0. || q.x > 1. || q.y > 1.) continue;
        float sd = vista(q.xy, texture2D(tProf, q.xy).x).z;
        oc += step(s.z + .03, sd) * smoothstep(0., 1., rad / abs(p.z - sd));
      }
      gl_FragColor = vec4(vec3(1. - oc / 14.), 1.);
    }`;
  const FS_DESENF = `
    varying vec2 vUv; uniform sampler2D tA, tProf; uniform vec2 uDir; uniform mat4 uPI;
    float lin(vec2 uv) { vec4 v = uPI * vec4(uv * 2. - 1., texture2D(tProf, uv).x * 2. - 1., 1.); return v.z / v.w; }
    void main() {
      float z0 = lin(vUv), s = 0., w = 0.;
      for (int i = -3; i <= 3; i++) { vec2 uv = vUv + uDir * float(i); float k = exp(-float(i * i) / 8.) * (1. / (1. + abs(lin(uv) - z0) * 6.)); s += texture2D(tA, uv).r * k; w += k; }
      gl_FragColor = vec4(vec3(s / w), 1.);
    }`;
  const FS_BRILLO = `varying vec2 vUv; uniform sampler2D tA; uniform float uUmbral; uniform vec2 uPx;
    void main(){ vec3 c = (texture2D(tA, vUv + uPx * vec2(-1., -1.)).rgb + texture2D(tA, vUv + uPx * vec2(1., -1.)).rgb + texture2D(tA, vUv + uPx * vec2(-1., 1.)).rgb + texture2D(tA, vUv + uPx).rgb) * .25;
      c = clamp(c, vec3(0.), vec3(60.)); if (c.r != c.r || c.g != c.g || c.b != c.b) c = vec3(0.);
      float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(min(c * max(0., l - uUmbral) / max(l, 1e-4), vec3(40.)), 1.); }`;
  const FS_BAJA = `varying vec2 vUv; uniform sampler2D tA; uniform vec2 uPx;
    void main(){ vec3 c = texture2D(tA, vUv).rgb * 4.; c += texture2D(tA, vUv - uPx).rgb + texture2D(tA, vUv + uPx).rgb + texture2D(tA, vUv + vec2(uPx.x, -uPx.y)).rgb + texture2D(tA, vUv - vec2(uPx.x, -uPx.y)).rgb; gl_FragColor = vec4(c / 8., 1.); }`;
  const FS_SUBE = `varying vec2 vUv; uniform sampler2D tA, tB; uniform vec2 uPx; uniform float uMez;
    void main(){ vec3 c = texture2D(tA, vUv + vec2(-uPx.x * 2., 0.)).rgb + texture2D(tA, vUv + vec2(uPx.x * 2., 0.)).rgb + texture2D(tA, vUv + vec2(0., uPx.y * 2.)).rgb + texture2D(tA, vUv + vec2(0., -uPx.y * 2.)).rgb;
      c += (texture2D(tA, vUv + uPx).rgb + texture2D(tA, vUv - uPx).rgb + texture2D(tA, vUv + vec2(uPx.x, -uPx.y)).rgb + texture2D(tA, vUv - vec2(uPx.x, -uPx.y)).rgb) * 2.;
      gl_FragColor = vec4(c / 12. + texture2D(tB, vUv).rgb * uMez, 1.); }`;
  const FS_FINAL = `
    varying vec2 vUv; uniform sampler2D tHDR, tAO, tBloom, tProf; uniform float uExp, uAO, uBloom, uT, uGrano, uVin, uSat, uCon, uNit, uDof, uFoco, uFundido; uniform vec2 uRes, uPx, uCam; uniform bool uConAO, uConBloom;
    vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + .0245786) - .000090537; vec3 b = v * (.983729 * v + .4329510) + .238081; return a / b; }
    vec3 aces(vec3 c) {
      const mat3 I = mat3(vec3(.59719, .07600, .02840), vec3(.35458, .90834, .13383), vec3(.04823, .01566, .83777));
      const mat3 O = mat3(vec3(1.60475, -.10208, -.00327), vec3(-.53108, 1.10813, -.07276), vec3(-.07367, -.00605, 1.07602));
      c *= uExp / .6; c = I * c; c = RRTAndODTFit(c); c = O * c; return clamp(c, 0., 1.);
    }
    vec3 srgb(vec3 c) { return mix(c * 12.92, pow(c, vec3(.41666)) * 1.055 - .055, step(.0031308, c)); }
    void main() {
      vec3 c = texture2D(tHDR, vUv).rgb; if (c.r != c.r || c.g != c.g || c.b != c.b) c = vec3(0.);
      /* Profundidad de campo del modo foto: desenfoca según la distancia al punto enfocado */
      if (uDof > 0.) {
        float d = texture2D(tProf, vUv).x, z = uCam.x * uCam.y / (uCam.y - d * (uCam.y - uCam.x));
        float coc = clamp(abs(z - uFoco) / max(uFoco, .8) * 1.4, 0., 1.) * uDof;
        if (coc > .02) { vec3 s = c; for (int i = 0; i < 20; i++) { float a = float(i) * 2.39996, r = sqrt((float(i) + .5) / 20.); s += texture2D(tHDR, vUv + vec2(cos(a), sin(a)) * r * coc * uPx * 16.).rgb; } c = s / 21.; }
      }
      /* Nitidez: realce suave de bordes sobre la imagen ya en tono final */
      vec3 vec = texture2D(tHDR, vUv + vec2(uPx.x, 0.)).rgb + texture2D(tHDR, vUv - vec2(uPx.x, 0.)).rgb + texture2D(tHDR, vUv + vec2(0., uPx.y)).rgb + texture2D(tHDR, vUv - vec2(0., uPx.y)).rgb;
      float ao = uConAO ? mix(1., texture2D(tAO, vUv).r, uAO) : 1.;
      vec3 bl = uConBloom ? texture2D(tBloom, vUv).rgb * uBloom : vec3(0.);
      vec3 cT = srgb(aces(c * ao + bl)), vT = srgb(aces(min(vec * .25, vec3(64.)) * ao + bl));
      c = clamp(cT + (cT - vT) * uNit, 0., 1.);
      float l = dot(c, vec3(.2126, .7152, .0722));
      c = mix(vec3(l), c, uSat);
      c = (c - .5) * uCon + .5;
      c += vec3(-.012, -.004, .014) * (1. - l) + vec3(.014, .006, -.01) * l;
      vec2 q = vUv - .5; c *= 1. - dot(q, q) * uVin;
      float g = fract(sin(dot(gl_FragCoord.xy + fract(uT) * 91.7, vec2(12.9898, 78.233))) * 43758.5453);
      c += (g - .5) * uGrano;
      c *= 1. - uFundido;
      gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
    }`;
  function rt(w, h, op = {}) { return new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), Object.assign({ type: PQ.tipo, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, generateMipmaps: false }, op)); }
  function preparaPost() {
    if (PQ.listo) return true;
    const gl2 = renderer.capabilities.isWebGL2, ext = renderer.extensions;
    if (!gl2 || !(ext.has("EXT_color_buffer_float") || ext.has("EXT_color_buffer_half_float"))) return false;
    PQ.tipo = THREE.HalfFloatType;
    const K = []; for (let i = 0; i < 14; i++) { const a = i * 2.39996, z = .15 + .85 * (i + .5) / 14, r = Math.sqrt(1 - z * z), s = .25 + .75 * ((i * 7 % 14) / 14) ** 2; K.push(new THREE.Vector3(Math.cos(a) * r * s, Math.sin(a) * r * s, z * s)); }
    PQ.mAO = shQ(FS_AO, { tProf: { value: null }, tNor: { value: null }, uPI: { value: new THREE.Matrix4() }, uP: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2() }, uRad: { value: .55 }, uK: { value: K } });
    PQ.mDes = shQ(FS_DESENF, { tA: { value: null }, tProf: { value: null }, uDir: { value: new THREE.Vector2() }, uPI: { value: new THREE.Matrix4() } });
    PQ.mBri = shQ(FS_BRILLO, { tA: { value: null }, uUmbral: { value: 1.1 }, uPx: { value: new THREE.Vector2() } });
    PQ.mBaja = shQ(FS_BAJA, { tA: { value: null }, uPx: { value: new THREE.Vector2() } });
    PQ.mSube = shQ(FS_SUBE, { tA: { value: null }, tB: { value: null }, uPx: { value: new THREE.Vector2() }, uMez: { value: 1 } });
    PQ.mFin = shQ(FS_FINAL, { tHDR: { value: null }, tAO: { value: null }, tBloom: { value: null }, uExp: { value: 1 }, uAO: { value: .85 }, uBloom: { value: .12 }, uT: { value: 0 }, uGrano: { value: .018 }, uVin: { value: .55 }, uSat: { value: 1.08 }, uCon: { value: 1.07 }, uRes: { value: new THREE.Vector2() }, uConAO: { value: true }, uConBloom: { value: true }, uNit: { value: .3 }, uPx: { value: new THREE.Vector2() }, tProf: { value: null }, uDof: { value: 0 }, uFoco: { value: 5 }, uFundido: { value: 0 }, uCam: { value: new THREE.Vector2(.05, 1500) } });
    PQ.mNor = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
    PQ.mLum = shQ(`varying vec2 vUv; uniform sampler2D tA; void main(){ float s = 0.; for (int i = 0; i < 8; i++) for (int j = 0; j < 8; j++) { vec3 c = texture2D(tA, (vec2(float(i), float(j)) + .5) / 8.).rgb; s += log2(max(dot(c, vec3(.2126, .7152, .0722)), 1e-4)); } gl_FragColor = vec4(vec3(clamp((s / 64. + 10.) / 14., 0., 1.)), 1.); }`, { tA: { value: null } });
    PQ.lum = new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, depthBuffer: false }); PQ.buf = new Uint8Array(4); PQ.cuenta = 0;
    PQ.listo = true; return true;
  }
  function tamPost() {
    const v = renderer.getDrawingBufferSize(new THREE.Vector2()), w = v.x, h = v.y; if (w === PQ.w && h === PQ.h && PQ.hdr) return; PQ.w = w; PQ.h = h;
    ["hdr", "pre", "ao1", "ao2"].forEach(k => PQ[k] && PQ[k].dispose()); (PQ.bl || []).forEach(x => { x.a.dispose(); x.b.dispose(); });
    /* Profundidad de 24 bits: con 16 las superficies cercanas se pelean a distancia y salen rayas */
    PQ.hdr = rt(w, h, { depthBuffer: true, samples: R.capturando ? 0 : 4, depthTexture: new THREE.DepthTexture(w, h, THREE.UnsignedIntType) }); PQ.hdr.ignoreDepthForMultisampleCopy = false;
    const hw = w >> 1, hh = h >> 1;
    PQ.pre = rt(hw, hh, { type: THREE.UnsignedByteType, depthBuffer: true, depthTexture: new THREE.DepthTexture(hw, hh, THREE.UnsignedIntType), minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    PQ.ao1 = rt(hw, hh, { type: THREE.UnsignedByteType }); PQ.ao2 = rt(hw, hh, { type: THREE.UnsignedByteType });
    PQ.bl = []; let bw = hw, bh = hh; for (let i = 0; i < 5; i++) { PQ.bl.push({ a: rt(bw, bh), b: rt(bw, bh), w: bw, h: bh }); bw = Math.max(1, bw >> 1); bh = Math.max(1, bh >> 1); }
  }
  const usaPost = () => R.nivel >= 1 && PQ.listo && R.activo && !(renderer.xr && renderer.xr.isPresenting);
  /* Casa abierta (sin techo, por plantas o en maqueta): sin sombras interiores y con luz plena para verlo todo */
  function casaAbierta() {
    if (!R.activo) return;
    const prev = R.abS; R.abS = prev < 0 ? R.abObj : prev + (R.abObj - prev) * (calmo ? 1 : .1);
    if (Math.abs(R.abS - prev) < 1e-4) return;
    const a = R.abS; U_R.uEnvIn.value = .82 + .18 * a;
    sol.intensity = R.solBase * (1 - .35 * a); hemi.intensity = R.hemiBase * (1 + 2.2 * a);
    const quiere = a < .4, e = ESC[escAct];
    if (quiere !== R.sombras && e) { R.sombras = quiere; e.grupo.traverse(o => { if (o.isMesh) { o.castShadow = quiere && !!o.userData.cs; if (/^LT_/.test(o.name)) o.visible = quiere; } }); renderer.shadowMap.needsUpdate = true; }
  }
  /* ¿Está la cámara dentro de casa? Se mira en la máscara de interiores */
  function camDentro() {
    const m = R.mascaraDatos, b = U_R.uMaskBox.value; if (!m || !b.z) return 0;
    const p = camera.position, i = Math.floor((p.x - b.x) * b.z * m.S), j = Math.floor((p.z - b.y) * b.w * m.S); if (i < 0 || j < 0 || i >= m.S || j >= m.S || p.y > U_R.uNiv.value.y) return 0;
    const k = (j * m.S + i) * 4; return (p.y < U_R.uNiv.value.x + 1.6 ? m.d[k] : m.d[k + 1]) / 255;
  }
  /* Ganchos de otros módulos (vídeo promocional, visita en directo…) antes de cada imagen */
  R.antes = []; R.ultT = performance.now();
  function pintar() {
    const ahora = performance.now(), dtP = Math.min(.05, (ahora - R.ultT) / 1000); R.ultT = ahora; R.antes.forEach(f => f(dtP, ahora));
    R.t += 1 / 60; U_R.uT.value = ahora / 1000; casaAbierta();
    if (R.comparar && R.activo) { pintaComparado(); return; }
    /* Plano cercano según el modo: de lejos, más precisión de profundidad */
    const cerca = T.modo === "portada" ? .35 : T.modo === "orbita" || T.modo === "vuelo" ? .15 : .05;
    if (camera.near !== cerca) { camera.near = cerca; camera.far = 1500; camera.updateProjectionMatrix(); }
    /* Exposición automática: solo aclara dentro de casa; fuera manda el cielo */
    if (R.activo) { const d = camDentro() * (1 - R.abS), med = usaPost() ? Math.max(1, R.expMed) : 1.38, obj = 1 + (med - 1) * d; R.expAuto += (obj - R.expAuto) * (calmo ? 1 : .05); } else R.expAuto = 1;
    if (!usaPost()) {
      const tm = renderer.toneMapping; if (tm !== THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; }
      const e = renderer.toneMappingExposure; renderer.toneMappingExposure = e * (R.activo ? R.exp * R.expAuto : 1);
      renderer.setRenderTarget(null); renderer.render(scene, camera); renderer.toneMappingExposure = e; return;
    }
    tamPost();
    if (renderer.toneMapping !== THREE.NoToneMapping) renderer.toneMapping = THREE.NoToneMapping;
    renderer.setRenderTarget(PQ.hdr); renderer.render(scene, camera);
    const ao = R.nivel >= 2;
    if (ao) {
      const vis = [], fog = scene.fog; R.transparentes.forEach(o => { if (o.visible) { vis.push(o); o.visible = false; } }); if (R.cielo) R.cielo.visible = false; R.luces.forEach(l => l.visible = false);
      const fondo = scene.background; scene.background = null; scene.fog = null; scene.overrideMaterial = PQ.mNor;
      renderer.setRenderTarget(PQ.pre); renderer.setClearColor(0x8080ff, 1); renderer.clear(); renderer.render(scene, camera);
      scene.overrideMaterial = null; scene.background = fondo; scene.fog = fog; vis.forEach(o => o.visible = true); if (R.cielo) R.cielo.visible = R.activo; R.luces.forEach(l => l.visible = true); renderer.setClearColor(0x000000, 1);
      const u = PQ.mAO.uniforms; u.tProf.value = PQ.pre.depthTexture; u.tNor.value = PQ.pre.texture; u.uPI.value.copy(camera.projectionMatrixInverse); u.uP.value.copy(camera.projectionMatrix);
      paso(PQ.mAO, PQ.ao1);
      const d = PQ.mDes.uniforms; d.tProf.value = PQ.pre.depthTexture; d.uPI.value.copy(camera.projectionMatrixInverse);
      d.tA.value = PQ.ao1.texture; d.uDir.value.set(1.5 / PQ.ao1.width, 0); paso(PQ.mDes, PQ.ao2);
      d.tA.value = PQ.ao2.texture; d.uDir.value.set(0, 1.5 / PQ.ao1.height); paso(PQ.mDes, PQ.ao1);
    }
    /* Resplandor: brillo → bajar → subir sumando */
    const bl = PQ.bl, b = PQ.mBri.uniforms; b.tA.value = PQ.hdr.texture; b.uPx.value.set(.5 / PQ.w, .5 / PQ.h); b.uUmbral.value = 1.05; paso(PQ.mBri, bl[0].a);
    for (let i = 1; i < bl.length; i++) { const u = PQ.mBaja.uniforms; u.tA.value = bl[i - 1].a.texture; u.uPx.value.set(1 / bl[i - 1].w, 1 / bl[i - 1].h); paso(PQ.mBaja, bl[i].a); }
    for (let i = bl.length - 1; i > 0; i--) { const u = PQ.mSube.uniforms, src = i === bl.length - 1 ? bl[i].a : bl[i].b; u.tA.value = src.texture; u.tB.value = bl[i - 1].a.texture; u.uPx.value.set(.5 / bl[i].w, .5 / bl[i].h); u.uMez.value = 1; paso(PQ.mSube, bl[i - 1].b); }
    /* Exposición automática: como una cámara, mide la luz media cada pocos fotogramas */
    if (++PQ.cuenta % 12 === 0) { const l = PQ.mLum.uniforms; l.tA.value = PQ.hdr.texture; paso(PQ.mLum, PQ.lum); renderer.readRenderTargetPixels(PQ.lum, 0, 0, 1, 1, PQ.buf); const lm = Math.pow(2, PQ.buf[0] / 255 * 14 - 10); R.expMed = Math.max(.75, Math.min(1.9, Math.pow(.2 / Math.max(lm, 1e-4), .55))); }
    const f = PQ.mFin.uniforms; f.tHDR.value = PQ.hdr.texture; f.uPx.value.set(1 / PQ.w, 1 / PQ.h); f.uNit.value = tactil ? .38 : .28; f.tAO.value = PQ.ao1.texture; f.tBloom.value = bl[0].b.texture; f.uConAO.value = ao; f.uConBloom.value = true;
    f.tProf.value = PQ.hdr.depthTexture; f.uDof.value = R.dof || 0; f.uFoco.value = R.foco || 5; f.uFundido.value = R.fundido || 0; f.uCam.value.set(camera.near, camera.far);
    f.uExp.value = renderer.toneMappingExposure * R.exp * R.expAuto; f.uT.value = R.t; f.uBloom.value = .06 + U_R.uNoche.value * .025;
    paso(PQ.mFin, null);
  }
  /* Comparar dos estilos: mitad izquierda con uno y derecha con otro, separados por una línea movible */
  function pintaComparado() {
    const c = R.comparar, v = renderer.getSize(new THREE.Vector2()), x = Math.round(v.x * c.corte);
    if (renderer.toneMapping !== THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const e = renderer.toneMappingExposure; renderer.toneMappingExposure = e * R.exp * R.expAuto;
    renderer.setRenderTarget(null); renderer.setScissorTest(true);
    aplicaEstilo(c.a, true); renderer.setScissor(0, 0, x, v.y); renderer.setViewport(0, 0, v.x, v.y); renderer.render(scene, camera);
    aplicaEstilo(c.b, true); renderer.setScissor(x, 0, v.x - x, v.y); renderer.render(scene, camera);
    renderer.setScissorTest(false); renderer.toneMappingExposure = e;
  }
  /* Calidad: elige al empezar y baja sola si la imagen va a tirones */
  function nivelInicial() {
    if (Aj.efectos !== undefined && Aj.efectos !== null) { R.nivel = Aj.efectos; R.fijo = true; }
    else { const mem = navigator.deviceMemory || 8, nucleos = navigator.hardwareConcurrency || 8; R.nivel = tactil ? (mem >= 6 ? 1 : 0) : (mem < 4 || nucleos <= 2 ? 1 : 2); }
    if (R.nivel >= 1 && !preparaPost()) R.nivel = 0;
    sol.shadow.mapSize.set(R.nivel >= 2 ? 4096 : R.nivel ? 2048 : 1024, R.nivel >= 2 ? 4096 : R.nivel ? 2048 : 1024);
  }
  function ponNivel(n, fijo) {
    R.nivel = n; if (fijo) { R.fijo = true; Aj.efectos = n; guardaAj(); }
    if (n >= 1 && !preparaPost()) R.nivel = 0;
    const s = R.nivel >= 2 ? 4096 : R.nivel ? 2048 : 1024; if (sol.shadow.mapSize.x !== s) { sol.shadow.mapSize.set(s, s); if (sol.shadow.map) { sol.shadow.map.dispose(); sol.shadow.map = null; } renderer.shadowMap.needsUpdate = true; }
  }
  function vigilaRitmo(dt) {
    if (R.fijo || R.nivel === 0 || document.hidden) return;
    R.medidas.push(dt); if (R.medidas.length < 120) return;
    const o = R.medidas.slice().sort((a, b) => a - b), med = o[60]; R.medidas = [];
    if (med > 1 / 26) {
      /* Primero baja un poco la resolución interna; solo si no basta, los efectos */
      if (R.escala > .76) { R.escala = +(R.escala - .12).toFixed(2); medir(); console.info("Resolución interna al", Math.round(R.escala * 100), "%"); }
      else { ponNivel(R.nivel - 1); console.info("Calidad ajustada a", NIVELES[R.nivel]); }
    }
  }
  nivelInicial();
