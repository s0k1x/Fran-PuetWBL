  /* ---------- Interfaz: iconos, cabecera, menú móvil, carga, índice y animaciones ---------- */
  const ICO = {
    logo: '<path d="M3 11.2 12 4l9 7.2"/><path d="M5.5 9.4V20h13V9.4"/><path d="M10 20v-5.2a2 2 0 0 1 4 0V20"/>',
    flecha: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', abajo: '<path d="m6 9 6 6 6-6"/>',
    subir: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    menu: '<path d="M4 8h16M4 16h16"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    plano: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
    maqueta: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    rejilla: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
    bombilla: '<path d="M9 18h6M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.7V16h6v-.1c0-.6.3-1.2.8-1.6A6.5 6.5 0 0 0 12 2.5z"/>',
    casa: '<path d="M3 11 12 4l9 7"/><path d="M5 9.5V20h14V9.5"/>', techo: '<path d="M2.5 8.5 12 3l9.5 5.5"/><path d="M5 12.5V20h14v-7.5"/><path d="M8 12.5h8"/>',
    puerta: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M3 21h18"/><path d="M14.5 12h.01"/>',
    sofa: '<path d="M4.5 11V8a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><path d="M2.5 13a2 2 0 0 1 4 0v2h11v-2a2 2 0 0 1 4 0v5h-19z"/><path d="M5 18v2M19 18v2"/>',
    capas: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    olas: '<path d="M2 8.5c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 13.5c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 18.5c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>',
    luna: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    correo: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>', ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    carpeta: '<path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    chispa: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',
    unir: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="M11 7h3a3 3 0 0 1 3 3v3"/>', ver: '<path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
    reproducir: '<path d="M7 4.5v15l12-7.5z"/>', camara: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'
  };
  const ico = (n, c = "i") => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${ICO[n] || ""}</svg>`;
  document.querySelectorAll("[data-i]").forEach(e => e.insertAdjacentHTML("afterbegin", ico(e.dataset.i, e.dataset.i === "logo" ? "i logo" : "i")));
  /* Primario: recorrer la villa. Secundario: subir el escaneo propio */
  $("cargar").insertAdjacentHTML("afterbegin", ico("subir"));

  /* Cabecera sólida al bajar y aviso de desliza */
  const barra = $("barraP");
  portada.addEventListener("scroll", () => { const y = portada.scrollTop; barra.classList.toggle("solida", y > 30); $("desliza").style.opacity = y > 80 ? 0 : 1; marcaIndice(); }, { passive: true });

  /* Menú móvil: la misma navegación en una hoja */
  $("bMenu").addEventListener("click", () => { const on = !barra.classList.contains("menu"); barra.classList.toggle("menu", on); $("bMenu").setAttribute("aria-expanded", String(on)); $("bMenu").innerHTML = ico(on ? "x" : "menu"); if (on) cierraPanel(); });
  barra.querySelectorAll("nav [data-p]").forEach(b => b.addEventListener("click", () => { if (barra.classList.contains("menu")) { barra.classList.remove("menu"); $("bMenu").innerHTML = ico("menu"); $("bMenu").setAttribute("aria-expanded", "false"); } }));

  /* Índice lateral de secciones */
  const indice = $("indice");
  secs.forEach((s, i) => { const e = s.querySelector(".eti"), b = texto("button"); b.type = "button"; b.setAttribute("aria-label", "Ir a " + (e ? e.textContent.replace(/^\d+/, "") : "inicio")); b.innerHTML = `<span>${i ? (e ? e.textContent.replace(/^\d+/, "") : "") : "Inicio"}</span><i></i>`; b.onclick = () => irSeccion(i); indice.append(b); });
  let idxAct = -1;
  function marcaIndice() { const y = portada.scrollTop + portada.clientHeight * .5; let k = 0; secs.forEach((s, i) => { if (s.offsetTop <= y) k = i; }); if (k === idxAct) return; idxAct = k; [...indice.children].forEach((b, i) => b.classList.toggle("act", i === k)); }
  marcaIndice();

  /* Pantalla de carga: avanza con el modelo y las texturas, y se va al estar lista la vista */
  const carga = { v: 0, fin: false };
  (function avanzaCarga() {
    if (carga.fin) return;
    const listo = vista.classList.contains("lista"), meta = listo ? 100 : Math.min(92, carga.v + (R.pend > 0 ? .6 : .25) + (pf.capas || pf.eti.length ? 2 : 0));
    carga.v += (meta - carga.v) * .08; $("carBar").style.width = carga.v.toFixed(1) + "%"; $("carPct").textContent = Math.round(carga.v) + " %";
    if (listo && carga.v > 99) { carga.fin = true; $("cargador").classList.add("fuera"); arrancaPortada(); setTimeout(() => $("cargador").remove(), 1300); return; }
    requestAnimationFrame(avanzaCarga);
  })();
  setTimeout(() => { if (!carga.fin) { carga.fin = true; $("cargador").classList.add("fuera"); arrancaPortada(); } }, 25000);
  /* Titular y cifras: entran cuando se va la pantalla de carga */
  function arrancaPortada() {
    document.querySelectorAll(".revela .l, .aparece").forEach(e => { e.style.animationPlayState = "running"; });
    document.querySelectorAll(".cifras b[data-n]").forEach(b => {
      const n = +b.dataset.n, suf = b.dataset.suf || "", t0 = performance.now() + 500, d = 1600;
      const paso = now => { const t = Math.max(0, Math.min(1, (now - t0) / d)), e = 1 - Math.pow(1 - t, 4); b.textContent = Math.round(n * e).toLocaleString("es-ES") + suf; if (t < 1) requestAnimationFrame(paso); };
      if (calmo) b.textContent = n.toLocaleString("es-ES") + suf; else requestAnimationFrame(paso);
    });
  }
  document.querySelectorAll(".revela .l, .aparece").forEach(e => e.style.animationPlayState = "paused");

  /* Botón de luces del recorrido */
  const bLuz = $("bLuz");
  bLuz.addEventListener("click", () => { const on = ponLuces("alternar"); bLuz.setAttribute("aria-pressed", String(on)); aviso(on ? "Luces encendidas." : "Luces apagadas."); });
  setInterval(() => { const ver = R.activo && T.modo !== "portada"; if (bLuz.hidden === ver) bLuz.hidden = !ver; if (ver) bLuz.setAttribute("aria-pressed", String(U_R.uLuz.value > .5)); }, 400);

  /* Botón de cuenta: muestra la inicial cuando hay sesión */
  function pintaCuenta() {
    const b = $("bpCuenta"); if (!b) return;
    if (usuario && usuario.email) b.innerHTML = `<span class="ini">${usuario.email[0].toUpperCase()}</span><span class="txtC">Mi cuenta</span>`;
    else b.innerHTML = ico("usuario") + '<span class="txtC">Iniciar sesión</span>';
  }
  if (nube) nube.auth.onAuthStateChange(() => setTimeout(pintaCuenta, 0));
  pintaCuenta();
