  /* ---------- Estudio: hora del día, entrada, cursor, tema, modo foto, plano y estilos ---------- */
  const cargaScript = (() => { const hechos = {}; return url => hechos[url] || (hechos[url] = new Promise((ok, no) => { const s = document.createElement("script"); s.src = url; s.onload = ok; s.onerror = () => { delete hechos[url]; no(new Error("No se ha podido descargar un componente. Revisa la conexión.")); }; document.head.append(s); })); })();
  const JSPDF = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
  const mezcla = (a, b, t) => a + (b - a) * t, c01 = v => Math.max(0, Math.min(1, v));
  const mezclaHex = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();

  /* ---------- Hora del día: mueve el sol, cambia el cielo y enciende las lámparas al anochecer ---------- */
  function datosHora(h) {
    const f = (h - 6.6) / 12.6, el = 62 * Math.sin(Math.PI * f), elR = el * Math.PI / 180, az = Math.PI * c01(f);
    const noche = c01((3 - el) / 9), oro = c01(1 - el / 24) * (1 - noche), manana = h < 13;
    const d = noche > .95 ? [.3, .85, .45] : [-Math.cos(az) * Math.cos(Math.max(elR, .05)), Math.sin(Math.max(elR, .05)), .55 * Math.cos(Math.max(elR, .05)) + .2];
    const L = { c: noche > .5 ? 0x8fa8d8 : mezclaHex(0xfff1de, manana ? 0xffc994 : 0xffa060, oro), i: mezcla(mezcla(2.2, 1.9, oro), .25, noche), h: mezcla(mezcla(.6, .32, oro), .08, noche), e: mezcla(mezcla(.8, .45, oro), .12, noche), d, cielo: mezclaHex(mezclaHex(0xcfe3f1, 0xe9a36f, oro), 0x0a0f1c, noche) };
    const C = { hdr: noche > .6 ? "moonless_golf" : oro > .55 ? (manana ? "kiara_1_dawn" : "venice_sunset") : "rooitou_park", turb: mezcla(2.4, 6, oro), ray: mezcla(mezcla(1.1, 2.8, oro), .4, noche), mie: mezcla(.004, .008, oro), g: mezcla(.82, .9, oro), exp: mezcla(mezcla(1.02, 1.05, oro), 1, noche), niebla: mezclaHex(mezclaHex(0xb9cad8, 0xc98a62, oro), 0x060a12, noche), dens: mezcla(.0026, .0034, oro), env: mezcla(mezcla(.55, .5, oro), .6, noche), noche: c01(noche + oro * .35), gan: mezcla(mezcla(.32, .3, oro), .03, noche), sol: mezcla(mezcla(1.5, 1.6, oro), 1, noche) };
    return { L, C };
  }
  LUCES.Hora = Object.assign({}, LUCES.Natural); AMB.Hora = "";
  function ponHora(h) {
    h = Math.max(0, Math.min(23.99, +h)); Aj.hora = h; guardaAj();
    const { L, C } = datosHora(h); Object.assign(LUCES.Hora, L); CIELOS.Hora = C;
    if (T.modo === "portada") { Aj.amb = "Hora"; aplicaAj(); } else { D.amb = "Hora"; guardaD(); aplicaAmb(); }
  }
  const horaTxt = h => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60) % 60).padStart(2, "0")}`;
  { const { L, C } = datosHora(Aj.hora ?? 12); Object.assign(LUCES.Hora, L); CIELOS.Hora = C; }

  /* ---------- Entrada cinematográfica: de la vista aérea a la puerta en un solo vuelo ---------- */
  const comenzarBase = comenzar;
  comenzar = function (extra) {
    const p0 = camera.position.clone(), q0 = camera.quaternion.clone(), desdePortada = T.modo === "portada" && pf.listo;
    comenzarBase(extra);
    if (!desdePortada || calmo || !R.activo || T.nubes) return;
    const destino = new THREE.Vector3(T.x, T.py + T.eye, T.z), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(T.pitch, T.yaw, 0, "YXZ")), dur = 2.8;
    camera.position.copy(p0); camera.quaternion.copy(q0);
    volar(destino, q, 1000, () => { T.modo = "andar"; T.clip = 1000; hudSala(); }, dur);
    const v = $("velo"); v.style.transition = "opacity .45s ease";
    setTimeout(() => v.style.opacity = 1, dur * 560); setTimeout(() => v.style.opacity = 0, dur * 860);
  };

  /* ---------- Cursor, botones magnéticos y sonido suave opcional ---------- */
  if (matchMedia("(pointer: fine)").matches && !calmo) {
    const pun = document.createElement("div"), ani = document.createElement("div"); pun.id = "cursor"; ani.id = "cursorAni"; document.body.append(pun, ani);
    let mx = innerWidth / 2, my = innerHeight / 2, ax = mx, ay = my, vis = false;
    addEventListener("pointermove", e => { mx = e.clientX; my = e.clientY; if (!vis) { vis = true; document.documentElement.classList.add("con-cursor"); } }, { passive: true });
    document.addEventListener("pointerleave", () => { vis = false; document.documentElement.classList.remove("con-cursor"); });
    const ACT = "button, a, label[for], [role='button'], [role='switch'], input[type='range'], .seg button, summary";
    document.addEventListener("pointerover", e => { const s = e.target.closest && e.target.closest(ACT); ani.classList.toggle("sobre", !!s); pun.classList.toggle("sobre", !!s); });
    /* El cursor solo se anima mientras se mueve: en reposo no consume nada */
    let vivo = false; const mueve = () => { ax += (mx - ax) * .2; ay += (my - ay) * .2; const oculto = document.pointerLockElement; pun.style.transform = `translate(${mx}px,${my}px)`; ani.style.transform = `translate(${ax}px,${ay}px)`; pun.style.opacity = ani.style.opacity = oculto ? 0 : ""; if (Math.abs(mx - ax) + Math.abs(my - ay) > .3) requestAnimationFrame(mueve); else vivo = false; };
    addEventListener("pointermove", () => { if (!vivo) { vivo = true; requestAnimationFrame(mueve); } }, { passive: true });
    const IMAN = "#muestra, #cargar, .azul, .btn-luz, .fantasma, #acceso .principal";
    document.addEventListener("pointermove", e => { const b = e.target.closest && e.target.closest(IMAN); document.querySelectorAll(".iman").forEach(x => { if (x !== b) { x.classList.remove("iman"); x.style.translate = ""; } }); if (!b) return; const q = b.getBoundingClientRect(), dx = e.clientX - (q.left + q.width / 2), dy = e.clientY - (q.top + q.height / 2); b.classList.add("iman"); b.style.translate = `${(dx * .18).toFixed(1)}px ${(dy * .28).toFixed(1)}px`; }, { passive: true });
  }
  let sonCtx = null;
  function sonido(f = 880) {
    if (!Aj.sonido) return;
    try { sonCtx = sonCtx || new (window.AudioContext || window.webkitAudioContext)(); const o = sonCtx.createOscillator(), g = sonCtx.createGain(), t = sonCtx.currentTime; o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .72, t + .06); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.03, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + .09); o.connect(g).connect(sonCtx.destination); o.start(t); o.stop(t + .1); } catch (e) {}
  }
  document.addEventListener("click", e => { if (e.target.closest && e.target.closest("button, label.azul, label#cargar")) sonido(e.target.closest("[aria-expanded]") ? 660 : 880); }, true);

  /* ---------- Tema claro u oscuro ---------- */
  function ponTema(t) { Aj.tema = t; guardaAj(); const claro = t === "claro" || (t === "auto" && matchMedia("(prefers-color-scheme: light)").matches); document.documentElement.classList.toggle("claro", claro); document.querySelector('meta[name="theme-color"]').content = claro ? "#f3f2ee" : "#050505"; }
  ponTema(Aj.tema || "oscuro");

  /* ---------- Modo foto: rejilla, nivel, desenfoque por distancia y captura en 4K con marca ---------- */
  const FOTO = { on: false, nivel0: 0 };
  function modoFoto(on = !FOTO.on) {
    if (on === FOTO.on) return; FOTO.on = on; const ui = $("fotoUI");
    if (on) {
      if (document.pointerLockElement) document.exitPointerLock();
      FOTO.nivel0 = R.nivel; if (R.nivel < 1 && preparaPost()) ponNivel(1);
      $("app").classList.add("limpio", "foto"); ui.hidden = false; R.dof = +$("fDof").value; aviso("Modo foto. Arrastra para encuadrar y pulsa Capturar.");
    } else { $("app").classList.remove("limpio", "foto"); ui.hidden = true; R.dof = 0; if (FOTO.nivel0 !== R.nivel && !R.fijo) ponNivel(FOTO.nivel0); }
  }
  R.antes.push(() => {
    if (!FOTO.on) return;
    const d = new THREE.Vector3(); camera.getWorldDirection(d); const t = rayo(camera.position.x, camera.position.y, camera.position.z, d.x, d.y, d.z, 200);
    if ($("fAuto").getAttribute("aria-checked") === "true") R.foco += ((isFinite(t) ? t : 60) - (R.foco || 5)) * .15;
    const g = T.pitch * 57.3, n = $("fNivel"); n.style.transform = `translate(-50%,-50%) rotate(${(-g * .6).toFixed(2)}deg)`; n.classList.toggle("ok", Math.abs(g) < .8); $("fGrados").textContent = (g >= 0 ? "+" : "") + g.toFixed(1) + "°";
  });
  async function captura4K() {
    const btn = $("fCap"); btn.disabled = true; btn.innerHTML = PUNTOS + "Capturando";
    await new Promise(r => setTimeout(r, 30));
    const pr0 = renderer.getPixelRatio(), ancho = tactil ? 2560 : 3840;
    try {
      R.capturando = true; renderer.setPixelRatio(ancho / vista.clientWidth); renderer.setSize(vista.clientWidth, vista.clientHeight, false); PQ.w = 0;
      corte.constant = T.clip; pintar();
      const c = document.createElement("canvas"); c.width = vista.width; c.height = vista.height; const g = c.getContext("2d"); g.drawImage(vista, 0, 0);
      const k = c.width / 1600; g.font = `300 ${Math.round(22 * k)}px Geist, Arial`; g.textAlign = "right"; g.fillStyle = "rgba(255,255,255,.82)"; g.shadowColor = "rgba(0,0,0,.4)"; g.shadowBlur = 12 * k;
      g.letterSpacing = `${Math.round(6 * k)}px`; g.fillText("INNRA3D", c.width - 44 * k, c.height - 40 * k);
      c.toBlob(b => guardar(b, `${T.nombre || "foto"}-${c.width}px.png`), "image/png");
    } catch (e) { aviso("No se ha podido capturar a esa resolución."); }
    R.capturando = false; renderer.setPixelRatio(pr0); medir(); PQ.w = 0; btn.disabled = false; btn.textContent = "Capturar en 4K";
  }
  function montaFotoUI() {
    const u = document.createElement("div"); u.id = "fotoUI"; u.hidden = true;
    u.innerHTML = `<div class="tercios" id="fRej"><i></i><i></i><i></i><i></i></div><div class="nivel" id="fNivel"></div><span class="grados" id="fGrados">0°</span>
      <div class="barraF"><label class="ajuste"><span>Desenfoque</span><input id="fDof" type="range" min="0" max="1" step=".01" value=".45"></label>
      <button class="linea conm" type="button" role="switch" id="fAuto" aria-checked="true"><span>Enfoque automático</span><i></i></button>
      <button class="linea conm" type="button" role="switch" id="fRejB" aria-checked="true"><span>Rejilla</span><i></i></button>
      <button class="btn-luz" type="button" id="fCap">Capturar en 4K</button><button class="btn-sec" type="button" id="fSal">Salir</button></div>`;
    $("app").append(u);
    $("fDof").oninput = e => R.dof = +e.target.value;
    [["fAuto"], ["fRejB", v => $("fRej").hidden = !v]].forEach(([id, f]) => $(id).onclick = () => { const b = $(id), v = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", String(v)); if (f) f(v); });
    $("fCap").onclick = captura4K; $("fSal").onclick = () => modoFoto(false);
    addEventListener("keydown", e => { if (e.key === "Escape" && FOTO.on) modoFoto(false); });
  }
  montaFotoUI();

  /* ---------- Plano de arquitecto: muros, cotas, norte, escala y cajetín. PNG o PDF con todas las plantas ---------- */
  function cajaPlano(q) { let xa = 1e9, xb = -1e9, za = 1e9, zb = -1e9; for (let k = 0; k < q.w * q.h; k++) if (q.walk[k] || q.block[k]) { const x = q.ox + ((k % q.w) + .5) * q.cell, z = q.oz + (Math.floor(k / q.w) + .5) * q.cell; xa = Math.min(xa, x); xb = Math.max(xb, x); za = Math.min(za, z); zb = Math.max(zb, z); } return { xa, xb, za, zb }; }
  function dibujaPlano(q, ni) {
    const W = 3508, H = 2480, m = 150, cw = 760, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    /* Encuadre en las estancias (sin el jardín) cuando el modelo trae sus rectángulos */
    let b = cajaPlano(q); const rs = salas.filter(r => r.nivel === ni && r.rects);
    if (rs.length) { const k = { xa: 1e9, xb: -1e9, za: 1e9, zb: -1e9 }; rs.forEach(r => r.rects.forEach(([x0, x1, z0, z1]) => { k.xa = Math.min(k.xa, x0); k.xb = Math.max(k.xb, x1); k.za = Math.min(k.za, z0); k.zb = Math.max(k.zb, z1); })); b = { xa: k.xa - .6, xb: k.xb + .6, za: k.za - .6, zb: k.zb + .6 }; }
    const aw = W - m * 2 - cw - 80, ah = H - m * 2 - 120, s = Math.min(aw / (b.xb - b.xa), ah / (b.zb - b.za)), ox = m + 60 + (aw - (b.xb - b.xa) * s) / 2, oz = m + 90 + (ah - (b.zb - b.za) * s) / 2;
    const X = x => ox + (x - b.xa) * s, Z = z => oz + (z - b.za) * s, cs = q.cell * s + .6;
    g.save(); g.beginPath(); g.rect(X(b.xa), Z(b.za), (b.xb - b.xa) * s, (b.zb - b.za) * s); g.clip();
    g.fillStyle = "#ece9e2"; for (let k = 0; k < q.w * q.h; k++) if (q.walk[k] && !q.block[k]) g.fillRect(X(q.ox + (k % q.w) * q.cell), Z(q.oz + Math.floor(k / q.w) * q.cell), cs, cs);
    g.fillStyle = "#c9c5bc"; for (let k = 0; k < q.w * q.h; k++) if (q.block[k] === 1) g.fillRect(X(q.ox + (k % q.w) * q.cell), Z(q.oz + Math.floor(k / q.w) * q.cell), cs, cs);
    g.fillStyle = "#151515"; for (let k = 0; k < q.w * q.h; k++) if (q.block[k] === 2) g.fillRect(X(q.ox + (k % q.w) * q.cell), Z(q.oz + Math.floor(k / q.w) * q.cell), cs, cs);
    g.restore(); g.textAlign = "center"; g.fillStyle = "#151515";
    /* Rótulos ajustados al ancho de cada estancia: se reducen y, si hace falta, se parten en dos líneas */
    salas.filter(r => r.nivel === ni).forEach(r => {
      const ancho = r.rects ? Math.max(...r.rects.map(([x0, x1]) => (x1 - x0) * s)) * .86 : 9e9, cx = r.rects ? X((r.rects[0][0] + r.rects[0][1]) / 2) : X(r.x), cy = r.rects ? Z((r.rects[0][2] + r.rects[0][3]) / 2) : Z(r.z);
      let t = 30, lineas = [r.nombre.toUpperCase()]; g.letterSpacing = "2px";
      const mide = () => Math.max(...lineas.map(l => { g.font = `500 ${t}px Geist, Arial`; return g.measureText(l).width; }));
      while (mide() > ancho && t > 20) t -= 2;
      if (mide() > ancho && lineas[0].includes(" ")) { const w = lineas[0].split(" "), m = Math.ceil(w.length / 2); lineas = [w.slice(0, m).join(" "), w.slice(m).join(" ")]; t = 26; while (mide() > ancho && t > 15) t -= 1; }
      while (mide() > ancho && t > 13) t -= 1;
      g.font = `500 ${t}px Geist, Arial`; g.fillStyle = "#151515"; const y0 = cy - (lineas.length - 1) * t * .6;
      g.lineJoin = "round"; g.strokeStyle = "rgba(255,255,255,.92)"; g.lineWidth = Math.max(5, t * .32); lineas.forEach((l, i) => { g.strokeText(l, cx, y0 + i * t * 1.15); g.fillText(l, cx, y0 + i * t * 1.15); }); g.letterSpacing = "0px";
      g.font = `400 ${Math.max(14, Math.round(t * .85))}px Geist Mono, monospace`; g.fillStyle = "#6b6760"; g.strokeText(fmt(r.area, 1) + " m²", cx, y0 + lineas.length * t * 1.15 + 4); g.fillText(fmt(r.area, 1) + " m²", cx, y0 + lineas.length * t * 1.15 + 4); g.fillStyle = "#151515";
    });
    /* Cotas generales */
    const cota = (x1, y1, x2, y2, txt, vert) => { g.strokeStyle = "#151515"; g.lineWidth = 2; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); [[x1, y1], [x2, y2]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 12, y + 12); g.lineTo(x + 12, y - 12); g.stroke(); g.beginPath(); vert ? (g.moveTo(x - 22, y), g.lineTo(x + 22, y)) : (g.moveTo(x, y - 22), g.lineTo(x, y + 22)); g.stroke(); }); g.save(); g.translate((x1 + x2) / 2, (y1 + y2) / 2); if (vert) g.rotate(-Math.PI / 2); g.font = "400 28px Geist Mono, monospace"; g.fillText(txt, 0, -14); g.restore(); };
    cota(X(b.xa), Z(b.za) - 70, X(b.xb), Z(b.za) - 70, fmt(b.xb - b.xa) + " m"); cota(X(b.xa) - 70, Z(b.za), X(b.xa) - 70, Z(b.zb), fmt(b.zb - b.za) + " m", true);
    /* Norte y escala gráfica */
    const nx = m + 40, ny = m + 40; g.strokeStyle = "#151515"; g.lineWidth = 2; g.beginPath(); g.arc(nx, ny, 34, 0, 7); g.stroke(); g.beginPath(); g.moveTo(nx, ny - 30); g.lineTo(nx + 13, ny + 18); g.lineTo(nx, ny + 8); g.lineTo(nx - 13, ny + 18); g.closePath(); g.fill(); g.font = "500 26px Geist, Arial"; g.fillText("N", nx, ny - 46);
    const ex = m + 60, ey = H - m; [0, 1, 2, 5].forEach((v, i, a) => { if (i < a.length - 1) { g.fillStyle = i % 2 ? "#fff" : "#151515"; g.fillRect(ex + v * s, ey - 14, (a[i + 1] - v) * s, 14); g.strokeRect(ex + v * s, ey - 14, (a[i + 1] - v) * s, 14); } g.fillStyle = "#151515"; g.font = "400 24px Geist Mono, monospace"; g.fillText(v + (i === a.length - 1 ? " m" : ""), ex + v * s, ey + 34); });
    /* Cajetín */
    const kx = W - m - cw, ky = m, kh = H - m * 2; g.lineWidth = 3; g.strokeRect(kx, ky, cw, kh); g.textAlign = "left";
    g.font = "300 54px Geist, Arial"; g.letterSpacing = "14px"; g.fillText("INNRA", kx + 50, ky + 110); const wI = g.measureText("INNRA").width; g.font = "600 54px Geist, Arial"; g.letterSpacing = "4px"; g.fillStyle = "#8b8a84"; g.fillText("3D", kx + 50 + wI, ky + 110); g.letterSpacing = "0px"; g.fillStyle = "#151515";
    const linea = (y, et, val) => { g.strokeStyle = "#d8d5ce"; g.lineWidth = 2; g.beginPath(); g.moveTo(kx + 40, y - 54); g.lineTo(kx + cw - 40, y - 54); g.stroke(); g.font = "400 22px Geist Mono, monospace"; g.fillStyle = "#8b8a84"; g.fillText(et.toUpperCase(), kx + 50, y - 18); g.font = "500 34px Geist, Arial"; g.fillStyle = "#151515"; g.fillText(val, kx + 50, y + 26); };
    const sup = salas.filter(r => r.nivel === ni).reduce((a, r) => a + r.area, 0);
    linea(ky + 290, "Proyecto", (T.nombre || "Modelo").slice(0, 30)); linea(ky + 430, "Planta", `${ni + 1} de ${planos.length}`); linea(ky + 570, "Superficie", fmt(sup, 1) + " m²"); linea(ky + 710, "Estancias", String(salas.filter(r => r.nivel === ni).length)); linea(ky + 850, "Altura libre", fmt(q.ceilH) + " m"); linea(ky + 990, "Fecha", new Date().toLocaleDateString("es-ES"));
    g.font = "400 22px Geist, Arial"; g.fillStyle = "#6b6760"; ["Plano orientativo generado por INNRA3D", "a partir del modelo 3D. No apto para obra."].forEach((t, i) => g.fillText(t, kx + 50, ky + kh - 80 + i * 32));
    return c;
  }
  async function planoPro(formato) {
    if (!planos.length) { aviso("Este modelo no tiene plano."); return; }
    hoja(null); aviso("Dibujando el plano…");
    try {
      if (formato === "png") { dibujaPlano(planos[T.nivel], T.nivel).toBlob(b => guardar(b, `plano-${T.nombre || "modelo"}-planta${T.nivel + 1}.png`), "image/png"); return; }
      await cargaScript(JSPDF); const pdf = new jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      planos.forEach((q, i) => { if (i) pdf.addPage(); pdf.addImage(dibujaPlano(q, i).toDataURL("image/jpeg", .92), "JPEG", 0, 0, 297, 210); });
      guardar(pdf.output("blob"), `planos-${T.nombre || "modelo"}.pdf`);
    } catch (e) { aviso(e.message); }
  }

  /* ---------- Estilos de decoración: cambian suelos, paredes, maderas, telas y metales de toda la casa ---------- */
  const GRUPOS = { suelo: ["madera_suelo", "porcelanico_gris", "marmol_blanco", "marmol_crema"], paredes: ["estuco_blanco", "pintura_crema"], techo: ["techo_blanco"], madera: ["nogal", "madera_calida", "lacado_arena"], telaA: ["tela_crema", "tela_arena", "alfombra", "panel_tapizado"], telaB: ["tela_gris", "tela_acento", "alfombra_oscura"], metal: ["laton", "metal_negro", "acero"] };
  const TIPOS_SUELO = { madera: { t: "madera", e: 2.6, rm: 1 / .363, r: .42 }, marmol: { t: "marmol", e: 3.4, rm: 1 / .086, r: .09 }, porcelanico: { t: "porcelanico", e: 1.2, r: .16 }, hormigon: { t: "hormigon", e: 3, rm: 1 / .829, r: .3 }, piedra: { t: "piedra", e: 1.2, r: .7 } };
  const METALES = { laton: [0xd7ae6a, .26], negro: [0x1b1c1e, .42], acero: [0xc9cdd2, .32] };
  const ESTILOS = {
    "Original": null,
    "Nórdico": { suelo: { tipo: "madera", color: "#d8c3a2" }, paredes: "#f3f0ea", madera: "#caa77c", telaA: "#e6e0d4", telaB: "#a9aaa6", metal: "negro" },
    "Mediterráneo": { suelo: { tipo: "porcelanico", color: "#d9b79a" }, paredes: "#f7f2e8", madera: "#9c7550", telaA: "#efe8da", telaB: "#4f6f8f", metal: "laton" },
    "Industrial": { suelo: { tipo: "hormigon", color: "#9a9893" }, paredes: "#bdbab4", madera: "#5a3e2b", telaA: "#8a8479", telaB: "#3b3b3a", metal: "negro" },
    "Japandi": { suelo: { tipo: "madera", color: "#c9b293" }, paredes: "#ece7dd", madera: "#86674a", telaA: "#d6cdbd", telaB: "#6e695e", metal: "negro" },
    "Oscuro": { suelo: { tipo: "marmol", color: "#2a2827" }, paredes: "#2e2d2b", techo: "#1d1c1b", madera: "#3a2a1f", telaA: "#3b3936", telaB: "#1c1c1c", metal: "negro" },
    "Lujo clásico": { suelo: { tipo: "marmol", color: "#f2efe9" }, paredes: "#efe6d6", madera: "#4b3122", telaA: "#ece3d2", telaB: "#2f4a3c", metal: "laton" }
  };
  const ORIG = new Map();
  function guardaOriginal(n, m) { if (ORIG.has(n)) return; const u = m.userData.un || {}; ORIG.set(n, { color: m.color.clone(), r: m.roughness, mt: m.metalness, tC: u.tC && u.tC.value, tN: u.tN && u.tN.value, tR: u.tR && u.tR.value, esc: u.uEsc && u.uEsc.value.clone(), media: u.uMedia && u.uMedia.value.clone(), rm: u.uRM && u.uRM.value }); }
  function restaura(n, m) { const o = ORIG.get(n); if (!o) return; const u = m.userData.un || {}; m.color.copy(o.color); m.roughness = o.r; m.metalness = o.mt; if (u.tC) { u.tC.value = o.tC; u.tN.value = o.tN; if (u.tR) u.tR.value = o.tR; u.uEsc.value.copy(o.esc); u.uMedia.value.copy(o.media); u.uRM.value = o.rm; } }
  function aplicaEstilo(est, rapido) {
    R.sucio = true;
    const e = typeof est === "string" ? ESTILOS[est] : est;
    Object.values(GRUPOS).flat().forEach(n => { const m = R.mats.get(n); if (m) { guardaOriginal(n, m); restaura(n, m); } });
    if (!e) { if (!rapido) R.estilo = "Original"; return; }
    const tinta = (n, hex, t) => { const m = R.mats.get(n); if (!m || !hex) return; const md = MEDIAS[t || (m.userData.real && m.userData.real.t)] || 1; m.color.set(hex).multiplyScalar(1 / md); };
    if (e.suelo) GRUPOS.suelo.forEach(n => { const m = R.mats.get(n), ts = TIPOS_SUELO[e.suelo.tipo], u = m && m.userData.un; if (!m) return; if (ts && u && u.tC) { u.tC.value = cargaTex(ts.t + "_c", true); u.tN.value = cargaTex(ts.t.replace("_negro", "") + "_n"); if (u.tR && ts.rm) { u.tR.value = cargaTex(ts.t + "_r"); u.uRM.value = ts.rm; } u.uEsc.value.set(ts.e, ts.e * (ts.t === "madera" ? .5 : 1)); u.uMedia.value.setScalar(MEDIAS[ts.t] || 1); m.roughness = ts.r; } tinta(n, e.suelo.color, ts && ts.t); });
    ["paredes", "techo", "madera", "telaA", "telaB"].forEach(k => e[k] && GRUPOS[k].forEach(n => tinta(n, e[k])));
    const mt = METALES[e.metal]; if (mt) GRUPOS.metal.forEach(n => { const m = R.mats.get(n); if (m) { m.color.setHex(mt[0]); m.roughness = mt[1]; m.metalness = 1; } });
    if (!rapido) R.estilo = typeof est === "string" ? est : (e.nombre || "Personalizado");
  }
  function eligeEstilo(nombre, guardarlo = true) { aplicaEstilo(nombre); if (guardarlo && T.modo !== "portada") { D.estilo = typeof nombre === "string" ? nombre : null; D.estiloIA = typeof nombre === "string" ? null : nombre; guardaD(); } aviso(`Estilo ${typeof nombre === "string" ? nombre : (nombre.nombre || "personalizado")} aplicado.`); }
  const ESQ_ESTILO = { type: "object", properties: { nombre: { type: "string" }, explicacion: { type: "string" }, suelo: { type: "object", properties: { tipo: { type: "string", enum: Object.keys(TIPOS_SUELO) }, color: { type: "string" } }, required: ["tipo", "color"] }, paredes: { type: "string" }, madera: { type: "string" }, telaA: { type: "string" }, telaB: { type: "string" }, metal: { type: "string", enum: Object.keys(METALES) } }, required: ["nombre", "explicacion", "suelo", "paredes", "madera", "telaA", "telaB", "metal"] };
  async function estiloIA(peticion) {
    if (peticion === undefined) { const f = $("ficha"); f.hidden = false; f.innerHTML = '<h3>Diseñar con IA</h3><label class="ajuste">Describe el estilo<input id="eiT" type="text" maxlength="160" placeholder="Cálido, con madera clara, lino y toques de verde" autocomplete="off"></label><p class="nota2">La IA elige suelos, paredes, maderas, telas y metales para toda la casa.</p><div class="fila"><button id="eiIr" class="tool" type="button">Diseñar</button><button id="eiX" class="tool" type="button">Cerrar</button></div>'; $("eiX").onclick = () => f.hidden = true; const ir = () => { const v = $("eiT").value.trim(); if (v) estiloIA(v); }; $("eiIr").onclick = ir; $("eiT").onkeydown = e => { e.stopPropagation(); if (e.key === "Enter") ir(); }; $("eiT").focus(); return; }
    aviso("Diseñando la casa…");
    try {
      const r = await gemini([{ role: "user", parts: [{ text: `Eres interiorista. Diseña un estilo para toda una vivienda a partir de esta petición: "${peticion}". Devuelve colores en hexadecimal (#rrggbb) realistas y armónicos: suelo (tipo y color), paredes, madera de muebles y carpintería, telaA (tapicerías claras), telaB (acentos) y metal. Explica la idea en una frase en español.` }] }], ESQ_ESTILO);
      eligeEstilo(r); muestraTexto(r.nombre || "Estilo", String(r.explicacion));
    } catch (e) { aviso(e.message); }
  }
  /* Comparar dos estilos lado a lado con una línea que se arrastra */
  function comparar(a, b) {
    if (!R.activo) { aviso("Comparar estilos necesita un modelo con materiales reales."); return; }
    hoja(null); R.comparar = { a, b, corte: .5 };
    const lin = document.createElement("div"); lin.id = "comparaLin"; lin.innerHTML = `<span class="et et-a"></span><span class="et et-b"></span><i></i><button type="button" class="x" aria-label="Salir de la comparación">${ico("x")}</button>`;
    lin.querySelector(".et-a").textContent = a; lin.querySelector(".et-b").textContent = b; $("app").append(lin);
    const pon = () => lin.style.setProperty("--x", R.comparar.corte * 100 + "%"); pon();
    let arr = false; lin.querySelector("i").onpointerdown = e => { arr = true; e.preventDefault(); };
    const mov = e => { if (!arr || !R.comparar) return; R.comparar.corte = c01(e.clientX / innerWidth); pon(); }, fin = () => arr = false;
    addEventListener("pointermove", mov); addEventListener("pointerup", fin);
    lin.querySelector(".x").onclick = () => { R.comparar = null; lin.remove(); removeEventListener("pointermove", mov); removeEventListener("pointerup", fin); aplicaEstilo(R.estilo || "Original"); };
  }
  function hojaEstilos() {
    hojaLista("Estilo de la casa", [...Object.keys(ESTILOS).map(k => [k, () => { hoja(null); eligeEstilo(k); }, (R.estilo || "Original") === k]), ["Diseñar con IA…", () => { hoja(null); estiloIA(); }], ["Comparar dos estilos…", () => hojaLista("Comparar con", Object.keys(ESTILOS).filter(k => k !== (R.estilo || "Original")).map(k => [k, () => comparar(R.estilo || "Original", k)]))]]);
  }
  /* Al entrar en un modelo, recupera su estilo */
  const prepBase = prepararHerramientas;
  prepararHerramientas = function (extra) { prepBase(extra); R.comparar = null; const l = $("comparaLin"); if (l) l.remove(); aplicaEstilo(D.estiloIA || D.estilo || "Original"); };
