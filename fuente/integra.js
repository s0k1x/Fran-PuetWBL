  /* ---------- Integración: herramientas, paneles, dock y cuenta ---------- */
  Object.assign(ICO, {
    micro: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    compartir: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/>',
    galeria: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="m3.5 16 5-5 4 4 3-3 5 5"/><circle cx="15.5" cy="8.5" r="1.5"/>',
    grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', pincel: '<path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L11 15.8 8.2 13z"/><path d="M8 14c-2.5 0-4 1.6-4 4 0 1-.6 2-1.5 2.5C4 21 6 21 7.5 20.2 9.4 19.2 10 17.4 10 16z"/>'
  });
  /* Botón de voz en el dock */
  $("bLuz").insertAdjacentHTML("beforebegin", `<button id="bVoz" class="tool" type="button" aria-pressed="false" aria-label="Hablar con la IA">${ico("micro")}<span>Voz</span></button>`);
  $("bVoz").onclick = escucha;
  addEventListener("keydown", e => { if (e.code === "KeyV" && T.modo === "andar" && !/^(text|textarea|search|password)$/.test(e.target.type) && !e.repeat) escucha(); });

  /* Herramientas nuevas en el menú */
  const AGRUPA0 = AGRUPA;
  AGRUPA = function () {
    const it = AGRUPA0(), add = (g, n, d, f, k) => it.push({ g, n, d, f, k });
    it.forEach(i => { if (i.n === "Borrar medidas") i.f = borraMedidasTodo; });
    if (C) { add("Medir y anotar", "Medir superficie", "Marca el contorno y calcula m² y perímetro", medirArea, "7"); add("Medir y anotar", "Medir altura", "Del suelo al techo en un punto", () => modoH("altura", "Pulsa el suelo donde quieras medir la altura")); }
    if ((D.medidas || []).length) add("Medir y anotar", "Exportar medidas", "Tabla CSV con todas las cotas", medidasCSV);
    if (R.activo) { add("Diseñar", "Estilo de la casa", "Nórdico, mediterráneo, industrial, japandi o lujo", hojaEstilos, "8"); add("Diseñar", "Comparar estilos", "Dos estilos a la vez, separados por una línea", () => hojaLista("Comparar con", Object.keys(ESTILOS).filter(k => k !== (R.estilo || "Original")).map(k => [k, () => comparar(R.estilo || "Original", k)]))); add("Diseñar", "Hora del día", "Mueve el sol y enciende las luces al anochecer", hojaHora); }
    add("Capturar", "Modo foto", "Rejilla, desenfoque y captura en 4K con marca", () => modoFoto(true), "9");
    if (planos.length) { add("Capturar", "Plano de arquitecto (PDF)", "Todas las plantas con cotas, norte y cajetín", () => planoPro("pdf")); add("Capturar", "Plano de arquitecto (PNG)", "La planta actual a alta resolución", () => planoPro("png")); }
    add("Compartir", "Compartir y QR", "Enlace, código QR e inserción en tu web", compartirPro, "0");
    if (nube) add("Compartir", "Visita en directo", VIVO.canal ? `En curso · código ${VIVO.codigo}` : "Guía a un cliente en remoto en tiempo real", visitaDirecto);
    if (iaLista()) {
      const G = "Inteligencia artificial";
      add(G, "Asistente de voz", "Habla y lo hace: ir, luces, hora, estilo… (V)", escucha);
      if (R.activo) add(G, "Diseñar con IA", "Describe un estilo y cambia toda la casa", () => estiloIA());
      if (salas.length) { add(G, "Ficha comercial en PDF", "Portada, texto de venta, plano y estancias", fichaPDF); add(G, "Vídeo promocional", "30 segundos con música, títulos y fundidos", videoPromo); }
      add(G, "Presupuesto de reforma", "Partidas con coste orientativo de esta vista", reformaPresupuesto);
    }
    if (nube && usuario) add("Datos", "Panel del propietario", "Visitas, tiempo por estancia y solicitudes", panelDueno);
    const orden = ["Inteligencia artificial", "Diseñar", "Medir y anotar", "Capturar", "Compartir", "Datos", "Nube", "Archivo"];
    return it.sort((a, b) => (orden.indexOf(a.g) + 99) % 99 - (orden.indexOf(b.g) + 99) % 99);
  };
  function hojaHora() {
    const f = $("ficha"); f.hidden = false; f.textContent = ""; const h = texto("h3"); h.textContent = "Hora del día"; f.append(h);
    deslizador(f, "hHora", "Hora", 6, 23.75, .25, Aj.hora ?? 12, horaTxt, ponHora);
    f.append(fila(["Ahora", () => { const d = new Date(); ponHora(d.getHours() + d.getMinutes() / 60); $("hHora").value = Aj.hora; $("hHora").dispatchEvent(new Event("input")); }], ["Cerrar", () => f.hidden = true]));
  }

  /* Paneles de la cabecera */
  BOTONES.amb = function (p) {
    titulo(p, "Ambiente");
    const GR = { Natural: "linear-gradient(160deg,#9cc3e6,#e9eef2 70%)", Amanecer: "linear-gradient(160deg,#7d8fb8,#f2b98c 75%)", Atardecer: "linear-gradient(160deg,#3d3a5c,#e8875a 70%)", Noche: "linear-gradient(160deg,#04060d,#1b2340 80%)", Blanco: "linear-gradient(160deg,#ffffff,#d9d9d6)" }, NOM = { Natural: "Día", Amanecer: "Amanecer", Atardecer: "Atardecer", Noche: "Noche", Blanco: "Estudio" };
    const m = texto("div", "muestras"); Object.keys(GR).forEach(k => { const b = texto("button"); b.type = "button"; b.innerHTML = `<i style="background:${GR[k]}"></i>${NOM[k]}`; b.setAttribute("aria-pressed", String(k === Aj.amb)); b.onclick = () => { m.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); Aj.amb = k; aplicaAj(); }; m.append(b); }); p.append(m);
    deslizador(p, "pHora", "Hora del día", 6, 23.75, .25, Aj.hora ?? 12, horaTxt, v => { m.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false")); ponHora(v); });
    interruptor(p, "Luces de la casa", U_R.uLuz.value > .5, v => ponLuces(v));
    if (R.activo) opciones(p, "Estilo", Object.keys(ESTILOS).map(k => [k, k]), R.estilo || "Original", v => eligeEstilo(v, false));
    deslizador(p, "pBri", "Brillo", .5, 1.8, .01, Aj.brillo, v => fmt(v), v => { Aj.brillo = v; aplicaAj(); });
  };
  const vista0 = BOTONES.vista;
  BOTONES.vista = function (p) { vista0(p); const b = texto("button", "linea"); b.type = "button"; b.innerHTML = ico("galeria") + "<div>Galería de proyectos<small>Casas publicadas para recorrer</small></div>"; b.onclick = galeria; p.append(b); };
  const aju0 = BOTONES.aju;
  BOTONES.aju = function (p) {
    aju0(p);
    opciones(p, "Tema", [["oscuro", "Oscuro"], ["claro", "Claro"], ["auto", "Automático"]], Aj.tema || "oscuro", ponTema);
    interruptor(p, "Modo rendimiento", !!Aj.modoRend, v => { Aj.modoRend = R.modoRend = v; guardaAj(); if (v) ponNivel(0, true); else { Aj.efectos = null; R.fijo = false; ponNivel(gamaGPU() ?? 1); } R.escala = 1; medir(); aviso(v ? "Modo rendimiento: máxima fluidez en equipos modestos." : "Calidad automática según tu equipo."); });
    interruptor(p, "Sonidos de la interfaz", !!Aj.sonido, v => { Aj.sonido = v; guardaAj(); if (v) sonido(); });
    const b = texto("button", "linea"); b.type = "button"; b.innerHTML = ico("subir") + "<div>Instalar la app<small>Ábrela desde la pantalla de inicio, también sin conexión</small></div>"; b.onclick = instalaApp; p.append(b);
  };
  /* Pie: enlace a la galería */
  $("pie").querySelector(".base nav").insertAdjacentHTML("afterbegin", '<button type="button" id="pieGal">Galería</button>'); $("pieGal").onclick = galeria;
