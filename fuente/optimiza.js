  /* ---------- Optimización: une piezas por material y cambia los coches por superdeportivos ----------
     La villa trae 123 objetos partidos en casi 500 piezas, es decir, cientos de llamadas de dibujo
     por fotograma. Aquí se juntan las que comparten material (y capa: cubierta, planta alta o resto),
     así se dibuja lo mismo con unas setenta llamadas. Los coches se reconocen por la pintura. */
  function optimizaModelo(grupo) {
    grupo.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(grupo.matrixWorld).invert(), piezas = [], viejos = [];
    grupo.traverse(o => {
      if (!o.isMesh || o.isSkinnedMesh || o.morphTargetInfluences || !o.geometry.attributes.position) return;
      const g = o.geometry, ms = [].concat(o.material), capa = /^CUB_/.test(o.name) ? "CUB" : /^PA_/.test(o.name) ? "PA" : "X", n = g.index ? g.index.count : g.attributes.position.count;
      const m4 = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), n3 = new THREE.Matrix3().getNormalMatrix(m4);
      (g.groups.length ? g.groups : [{ start: 0, count: n, materialIndex: 0 }]).forEach(gr => { const mat = ms[gr.materialIndex] || ms[0]; if (mat) piezas.push({ o, g, mat, ini: gr.start, fin: Math.min(n, gr.start + gr.count), capa, m4, n3 }); });
      viejos.push(o);
    });
    if (piezas.length < 30 || !piezas.some(p => p.mat.userData.real)) return [];
    const v = new THREE.Vector3(), w = new THREE.Vector3(), u = new THREE.Vector3();
    const vert = (p, i, out) => { const a = p.g.index ? p.g.index.getX(i) : i; return out.fromBufferAttribute(p.g.attributes.position, a).applyMatrix4(p.m4); };
    const centro = (p, t, out) => { vert(p, t, out); vert(p, t + 1, w); vert(p, t + 2, u); return out.add(w).add(u).multiplyScalar(1 / 3); };
    /* Coches: celdas de 40 cm ocupadas por triángulos de pintura y agrupadas por vecindad */
    const celdas = new Map(), C = .4, esPintura = n => /^coche_/.test(n || "");
    piezas.forEach(p => { if (!esPintura(p.mat.name)) return; for (let t = p.ini; t + 2 < p.fin; t += 3) { centro(p, t, v); const k = Math.floor(v.x / C) + "," + Math.floor(v.z / C); let c = celdas.get(k); if (!c) celdas.set(k, c = new THREE.Box3()); for (let j = 0; j < 3; j++) c.expandByPoint(vert(p, t + j, w)); } });
    let grupos = [], visto = new Set();
    for (const k of celdas.keys()) {
      if (visto.has(k)) continue; const caja = new THREE.Box3(), pila = [k]; visto.add(k);
      while (pila.length) { const q = pila.pop(), [i, j] = q.split(",").map(Number); caja.union(celdas.get(q)); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const r = (i + a) + "," + (j + b); if (celdas.has(r) && !visto.has(r)) { visto.add(r); pila.push(r); } } }
      grupos.push(caja);
    }
    /* Los laterales y el techo de un mismo coche salen separados: se unen las cajas que se tocan */
    for (let cambio = true; cambio;) { cambio = false; for (let i = 0; i < grupos.length && !cambio; i++) for (let j = i + 1; j < grupos.length; j++) { const a = grupos[i].clone().expandByScalar(.04); if (a.intersectsBox(grupos[j])) { grupos[i].union(grupos[j]); grupos.splice(j, 1); cambio = true; break; } } }
    const coches = grupos.filter(c => { const s = c.getSize(new THREE.Vector3()); return Math.max(s.x, s.z) > 2.5 && Math.max(s.x, s.z) < 7 && Math.min(s.x, s.z) > 1.2; }).map(caja => ({ caja, faros: new THREE.Vector3(), nf: 0, suelo: Infinity }));
    const QUITA = /^(coche_|neumatico|luz_roja|acero|vidrio_oscuro|luz_calida)/;
    const enCoche = c => { for (const k of coches) { const b = k.caja; if (c.x > b.min.x - .3 && c.x < b.max.x + .3 && c.z > b.min.z - .3 && c.z < b.max.z + .3 && c.y > b.min.y - .45 && c.y < b.max.y + .15) return k; } return null; };
    /* Une por capa y material, quitando lo que era de los coches */
    const cubos = new Map();
    piezas.forEach(p => {
      const nom = p.mat.name || "", filtra = coches.length && QUITA.test(nom), lampara = /^(luz_|cristal_lampara)/.test(nom) && p.capa !== "CUB";
      const cubo = capa => { const clave = capa + "|" + p.mat.uuid; let c = cubos.get(clave); if (!c) cubos.set(clave, c = { mat: p.mat, capa, pos: [], nor: [], uv: [] }); return c; };
      const cX = cubo(p.capa), cT = lampara ? cubo("LT") : null;
      const at = p.g.attributes, uvA = at.uv, noA = at.normal;
      for (let t = p.ini; t + 2 < p.fin; t += 3) {
        if (filtra) { centro(p, t, v); const k = enCoche(v); if (k) { if (/^luz_calida/.test(nom)) { k.faros.add(v); k.nf++; } if (/^neumatico/.test(nom)) for (let j = 0; j < 3; j++) k.suelo = Math.min(k.suelo, vert(p, t + j, w).y); continue; } }
        /* Lámparas de techo y tiras de los aleros: capa propia que se oculta al abrir la casa, para que no floten */
        let c = cX; if (cT) { centro(p, t, v); if (v.y > 3.3) c = cT; }
        for (let j = 0; j < 3; j++) {
          const i = p.g.index ? p.g.index.getX(t + j) : t + j;
          w.fromBufferAttribute(at.position, i).applyMatrix4(p.m4); c.pos.push(w.x, w.y, w.z);
          if (noA) { u.fromBufferAttribute(noA, i).applyMatrix3(p.n3).normalize(); c.nor.push(u.x, u.y, u.z); } else c.nor.push(0, 1, 0);
          if (uvA) c.uv.push(uvA.getX(i), uvA.getY(i)); else c.uv.push(0, 0);
        }
      }
    });
    viejos.forEach(o => { o.parent && o.parent.remove(o); o.geometry.dispose(); });
    for (const c of cubos.values()) {
      if (!c.pos.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(c.pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(c.nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(c.uv, 2)); g.computeBoundingSphere(); g.computeBoundingBox();
      const e = new THREE.Mesh(g, c.mat); e.name = (c.capa === "X" ? "" : c.capa + "_") + "M_" + (c.mat.name || "m"); e.castShadow = !c.mat.transparent; e.receiveShadow = true; grupo.add(e);
    }
    /* El más visible (el de fuera, el más alejado del centro de la casa) va en rojo */
    coches.sort((a, b) => b.caja.getCenter(v).z - a.caja.getCenter(w).z).forEach((k, i) => grupo.add(supercoche(k, i)));
    return coches;
  }

  /* Junta todas las mallas de un grupo por material, en el espacio del grupo */
  function fusiona(q) {
    q.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(q.matrixWorld).invert(), por = new Map(), fuera = [];
    q.traverse(o => { if (!o.isMesh) return; const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); g.deleteAttribute("uv"); (por.get(o.material) || por.set(o.material, []).get(o.material)).push(g); fuera.push(o); });
    fuera.forEach(o => { o.parent.remove(o); o.geometry.dispose(); }); [...q.children].forEach(c => q.remove(c));
    por.forEach((gs, m) => {
      let n = 0; gs.forEach(g => n += g.attributes.position.count); const P = new Float32Array(n * 3), N = new Float32Array(n * 3); let k = 0;
      gs.forEach(g => { P.set(g.attributes.position.array, k * 3); N.set(g.attributes.normal.array, k * 3); k += g.attributes.position.count; g.dispose(); });
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.BufferAttribute(N, 3));
      const e = new THREE.Mesh(g, m); e.castShadow = e.receiveShadow = true; q.add(e);
    });
  }
  /* ---------- Superdeportivo procedural: perfil lateral extruido, estrechado hacia el techo ---------- */
  const PINTURAS = [0xa30d12, 0xe0a812, 0x62676c, 0xf1f1ee, 0x0e3b2b];
  let matsCoche = null;
  function materialesCoche() {
    if (matsCoche) return matsCoche;
    const fis = o => new THREE.MeshPhysicalMaterial(Object.assign({ side: THREE.FrontSide }, o));
    matsCoche = {
      pintura: PINTURAS.map(c => fis({ color: c, metalness: .55, roughness: .3, clearcoat: 1, clearcoatRoughness: .025, envMapIntensity: 1.25 })),
      cristal: fis({ color: 0x07090b, metalness: .1, roughness: .04, clearcoat: 1, clearcoatRoughness: .01, envMapIntensity: 1.6 }),
      negro: new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: .55, metalness: .2 }),
      carbono: fis({ color: 0x151618, roughness: .35, metalness: .3, clearcoat: .8, clearcoatRoughness: .1 }),
      goma: new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: .9, side: THREE.DoubleSide }),
      llanta: new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: .28, metalness: 1 }),
      freno: new THREE.MeshStandardMaterial({ color: 0xc8a13a, roughness: .4, metalness: .3 }),
      faro: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaf2ff, emissiveIntensity: 2.2 }),
      piloto: new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff1a12, emissiveIntensity: 2.4 })
    };
    return matsCoche;
  }
  function perfilCoche() {
    const s = new THREE.Shape(), rr = .44;
    s.moveTo(2.26, .27);
    s.bezierCurveTo(2.34, .38, 2.33, .5, 2.2, .56);
    s.bezierCurveTo(1.75, .7, 1.15, .78, .74, .84);
    s.bezierCurveTo(.38, 1.0, .06, 1.12, -.28, 1.13);
    s.bezierCurveTo(-.78, 1.12, -1.26, 1.01, -1.72, .92);
    s.lineTo(-2.18, .89); s.lineTo(-2.33, .97); s.lineTo(-2.36, .88);
    s.bezierCurveTo(-2.38, .62, -2.36, .42, -2.26, .27);
    s.lineTo(-1.38 - rr, .27); s.absarc(-1.38, .36, rr, Math.PI + .2, -.2, true);
    s.lineTo(1.42 - rr, .27); s.absarc(1.42, .36, rr, Math.PI + .2, -.2, true);
    s.lineTo(2.26, .27);
    return s;
  }
  function estrecha(g, k, nariz) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) * (1 - k * Math.max(0, y - .45)) * (1 - nariz * Math.pow(Math.abs(x) / 2.35, 6))); }
    g.computeVertexNormals();
  }
  function supercoche(k, i) {
    const M = materialesCoche(), q = new THREE.Group(), W = 1.98, b = .09;
    const cuerpo = new THREE.ExtrudeGeometry(perfilCoche(), { depth: W - b * 2, bevelEnabled: true, bevelThickness: .16, bevelSize: b, bevelSegments: 6, curveSegments: 28 });
    cuerpo.translate(0, 0, -(W - b * 2) / 2); estrecha(cuerpo, .3, .18);
    const e = new THREE.Mesh(cuerpo, M.pintura[i % M.pintura.length]); q.add(e);
    /* Habitáculo de cristal: un poco más ancho que la carrocería a media altura, por debajo del techo */
    const vs = new THREE.Shape(); vs.moveTo(.8, .83); vs.bezierCurveTo(.42, .99, .08, 1.1, -.28, 1.11); vs.bezierCurveTo(-.74, 1.1, -1.16, 1.01, -1.5, .93); vs.lineTo(-1.32, .84); vs.lineTo(.8, .83);
    const vg = new THREE.ExtrudeGeometry(vs, { depth: 1.56, bevelEnabled: true, bevelThickness: .06, bevelSize: .03, bevelSegments: 3, curveSegments: 20 }); vg.translate(0, .006, -.78); estrecha(vg, .3, 0);
    q.add(new THREE.Mesh(vg, M.cristal));
    const caja = (w, h, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; q.add(o); return o; };
    [-1, 1].forEach(s => {
      caja(.34, .035, .36, M.faro, 2.12, .58, s * .58, s * .25);
      caja(.6, .2, .05, M.negro, -.55, .62, s * .93);
      caja(.16, .07, .12, M.carbono, .55, .96, s * .86);
    });
    caja(.05, .045, 1.62, M.piloto, -2.33, .79, 0);
    caja(.3, .07, 1.7, M.carbono, 2.18, .27, 0);
    caja(.36, .12, 1.5, M.carbono, -2.2, .33, 0);
    caja(.04, .05, 1.84, M.carbono, -2.3, .97, 0);
    /* Ruedas: neumático, llanta de radios y pinza de freno */
    const neu = new THREE.CylinderGeometry(.36, .36, .3, 40), lla = new THREE.CylinderGeometry(.255, .255, .305, 40), radio = new THREE.BoxGeometry(.05, .44, .02);
    [[1.42, 1], [1.42, -1], [-1.38, 1], [-1.38, -1]].forEach(([x, s]) => {
      const r = new THREE.Group(); r.position.set(x, .36, s * (W / 2 - .2));
      const a = new THREE.Mesh(neu, M.goma); a.rotation.x = Math.PI / 2; r.add(a);
      const l = new THREE.Mesh(lla, M.llanta); l.rotation.x = Math.PI / 2; r.add(l);
      for (let n = 0; n < 5; n++) { const o = new THREE.Mesh(radio, M.llanta); o.position.z = s * .16; o.rotation.z = n / 5 * Math.PI; r.add(o); }
      const f = new THREE.Mesh(new THREE.BoxGeometry(.16, .1, .08), M.freno); f.position.set(.1, .14, s * .1); r.add(f);
      q.add(r);
    });
    fusiona(q);
    /* Colocar: el frente apunta hacia los faros que tenía el coche original */
    const c = k.caja.getCenter(new THREE.Vector3()), t = k.caja.getSize(new THREE.Vector3()), largoX = t.x > t.z;
    let fr = 1; if (k.nf) { const f = k.faros.multiplyScalar(1 / k.nf); fr = largoX ? Math.sign(f.x - c.x) || 1 : Math.sign(f.z - c.z) || 1; }
    q.rotation.y = largoX ? (fr > 0 ? 0 : Math.PI) : (fr > 0 ? -Math.PI / 2 : Math.PI / 2);
    q.position.set(c.x, isFinite(k.suelo) ? k.suelo : k.caja.min.y - .28, c.z);
    q.scale.setScalar(Math.max(.85, Math.min(1.08, Math.max(t.x, t.z) / 4.7)));
    q.name = "Superdeportivo";
    return q;
  }
