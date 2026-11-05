  /* ---------- Sitio: cookies, textos legales, opiniones y accesibilidad ---------- */
  $("anio").textContent = new Date().getFullYear();
  const ESTRELLA = '<svg viewBox="0 0 576 512" aria-hidden="true"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>';
  const PUNTOS = '<span class="puntos peq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>';
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const casilla = (id, txt, on, dis) => `<label class="casilla"><input type="checkbox" id="${id}" ${on ? "checked" : ""} ${dis ? "disabled" : ""}><span class="tick"></span><span>${txt}</span></label>`;

  /* Accesibilidad: guardada en este navegador */
  const ACC = Object.assign({ mov: false, con: false, txt: false }, guarda.leer("innra:acc") || {});
  function aplicaAcc() { const h = document.documentElement; h.classList.toggle("sin-mov", ACC.mov); h.classList.toggle("contraste", ACC.con); h.classList.toggle("texto-grande", ACC.txt); guarda.poner("innra:acc", ACC); }
  aplicaAcc();

  /* ---------- Cookies ---------- */
  const COOK = guarda.leer("innra:cookies");
  function galletas(conf) {
    const g = $("galletas"); g.hidden = false;
    const c = guarda.leer("innra:cookies") || { analisis: false, pref: true };
    g.innerHTML = `<p><b>Tu privacidad, primero.</b> INNRA3D usa almacenamiento técnico necesario para funcionar (sesión, ajustes y tus modelos en este navegador). Con tu permiso, también guardamos preferencias y datos de uso anónimos para mejorar la experiencia. <button type="button" class="lnk" data-legal="cookies" style="text-decoration:underline;color:var(--texto)">Más información</button></p>
      <div class="prefs" ${conf ? "" : "hidden"}>${casilla("ckNec", "<b>Necesarias.</b> Sesión, seguridad y funcionamiento. Siempre activas.", true, true)}${casilla("ckPref", "<b>Preferencias.</b> Recordar ambiente, calidad y accesibilidad.", c.pref)}${casilla("ckAna", "<b>Análisis.</b> Estadísticas anónimas de visitas por estancia.", c.analisis)}</div>
      <div class="bot"><button type="button" class="conf">${conf ? "Guardar selección" : "Configurar"}</button><button type="button" class="no">Rechazar</button><button type="button" class="si">Aceptar todo</button></div>`;
    const cierra = v => { guarda.poner("innra:cookies", Object.assign(v, { fecha: Date.now() })); g.hidden = true; };
    g.querySelector(".si").onclick = () => cierra({ analisis: true, pref: true });
    g.querySelector(".no").onclick = () => cierra({ analisis: false, pref: false });
    g.querySelector(".conf").onclick = () => conf ? cierra({ analisis: $("ckAna").checked, pref: $("ckPref").checked }) : galletas(true);
    g.querySelector("[data-legal]").onclick = () => legal("cookies");
  }
  if (!COOK) setTimeout(() => galletas(false), 2600);
  $("cfgGalletas").onclick = () => galletas(true);

  /* ---------- Textos legales ---------- */
  const HOY = "noviembre de 2026", CONTACTO = () => CONFIG.contacto ? esc(CONFIG.contacto) : "el formulario de contacto de la web";
  const LEGAL = {
    terminos: () => `<h2>Términos y condiciones</h2><p class="fecha">Última actualización: ${HOY}</p>
      <p>Estas condiciones regulan el uso de INNRA3D, un servicio web para cargar, recorrer, analizar y compartir modelos 3D de espacios. Al usarlo aceptas estas condiciones.</p>
      <h3>1. Cuenta</h3><p>Algunas funciones, como publicar modelos, recibir visitas o escribir opiniones, requieren una cuenta. Eres responsable de mantener tu contraseña segura y de la actividad realizada con tu cuenta.</p>
      <h3>2. Tu contenido</h3><p>Los modelos, imágenes y textos que subes siguen siendo tuyos. Nos concedes el permiso necesario para almacenarlos, procesarlos y mostrarlos a quien tenga el enlace cuando decides publicarlos. Solo debes subir contenido sobre el que tengas derechos y que no vulnere la intimidad de terceros.</p>
      <h3>3. Inteligencia artificial</h3><p>Las funciones de IA generan textos e imágenes orientativos. No son tasaciones, peritajes, mediciones oficiales ni proyectos técnicos. Revisa siempre el resultado antes de usarlo.</p>
      <h3>4. Uso aceptable</h3><p>No está permitido usar el servicio para actividades ilícitas, para sobrecargarlo, para acceder a datos de otras personas ni para publicar contenido ofensivo o engañoso. Podemos retirar contenido o suspender cuentas que incumplan estas normas.</p>
      <h3>5. Disponibilidad</h3><p>Trabajamos para que el servicio esté disponible y funcione bien, pero se ofrece tal cual, sin garantía de disponibilidad continua. Los límites de uso de la IA pueden cambiar.</p>
      <h3>6. Responsabilidad</h3><p>En la medida permitida por la ley, INNRA3D no responde de daños indirectos derivados del uso del servicio ni de decisiones tomadas a partir de sus resultados.</p>
      <h3>7. Cambios</h3><p>Podemos actualizar estas condiciones. Si el cambio es importante, lo avisaremos en la web.</p>
      <h3>8. Contacto</h3><p>Para cualquier consulta, escríbenos a través de ${CONTACTO()}.</p>`,
    privacidad: () => `<h2>Política de privacidad</h2><p class="fecha">Última actualización: ${HOY}</p>
      <h3>Qué datos tratamos</h3><ul><li><b>Cuenta:</b> correo electrónico y, si inicias sesión con un proveedor externo, el nombre y la imagen que este comparta.</li><li><b>Contenido:</b> los modelos, anotaciones, opiniones y mensajes que decides guardar o publicar.</li><li><b>Uso:</b> visitas por estancia de los modelos publicados, de forma agregada, si lo aceptas.</li><li><b>IA:</b> las vistas o textos que envías a la IA se procesan para darte la respuesta y no se usan para identificarte.</li></ul>
      <h3>Para qué</h3><p>Para prestarte el servicio, mantener tu sesión, mostrar lo que publicas a quien tenga el enlace, responder a solicitudes de visita y mejorar la web.</p>
      <h3>Dónde</h3><p>Los datos se alojan en Supabase (región de la Unión Europea). La IA se procesa a través de Google Gemini.</p>
      <h3>Cuánto tiempo</h3><p>Mientras mantengas tu cuenta. Puedes borrar tus proyectos y opiniones en cualquier momento y pedir la eliminación de la cuenta.</p>
      <h3>Tus derechos</h3><p>Puedes acceder, rectificar, suprimir, oponerte, limitar el tratamiento y pedir la portabilidad de tus datos escribiéndonos a través de ${CONTACTO()}. También puedes reclamar ante la autoridad de protección de datos de tu país.</p>`,
    cookies: () => `<h2>Política de cookies</h2><p class="fecha">Última actualización: ${HOY}</p>
      <p>INNRA3D no usa cookies publicitarias. Utiliza almacenamiento local del navegador, que funciona de forma parecida a las cookies:</p>
      <ul><li><b>Necesario:</b> mantener la sesión iniciada, recordar tu decisión sobre cookies y guardar los modelos y anotaciones que trabajas en este navegador.</li><li><b>Preferencias:</b> ambiente, calidad gráfica, velocidad al caminar y opciones de accesibilidad.</li><li><b>Análisis:</b> tiempo por estancia en los modelos publicados, de forma anónima y agregada.</li></ul>
      <p>Puedes cambiar tu elección cuando quieras en <b>Preferencias de cookies</b>, al pie de la página, o borrar los datos desde los ajustes de tu navegador.</p>`
  };
  function legal(cual = "terminos") {
    const L = $("legal"); L.hidden = false;
    L.innerHTML = `<div class="hojaL"><header><div class="seg" role="tablist">${[["terminos", "Términos"], ["privacidad", "Privacidad"], ["cookies", "Cookies"]].map(([k, n]) => `<button type="button" data-k="${k}" aria-pressed="${k === cual}">${n}</button>`).join("")}</div><button class="x" type="button" aria-label="Cerrar">${ico("x")}</button></header><article tabindex="0">${LEGAL[cual]()}</article></div>`;
    const cierra = () => { L.hidden = true; L.textContent = ""; document.removeEventListener("keydown", tecla); }, tecla = e => { if (e.key === "Escape") cierra(); };
    document.addEventListener("keydown", tecla);
    L.querySelector(".x").onclick = cierra; L.onpointerdown = e => { if (e.target === L) cierra(); };
    L.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { L.querySelectorAll("[data-k]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); L.querySelector("article").innerHTML = LEGAL[b.dataset.k](); L.querySelector("article").scrollTop = 0; });
  }
  document.addEventListener("click", e => { const b = e.target.closest("[data-legal]"); if (b && !b.closest("#galletas")) { e.preventDefault(); legal(b.dataset.legal); } });

  /* ---------- Opiniones ---------- */
  const estrellasDe = n => Array.from({ length: 5 }, (_, i) => ESTRELLA.replace("<svg", `<svg class="${i < Math.round(n) ? "on" : ""}"`)).join("");
  async function cargaResenas() {
    const caja = $("resenas"); if (!nube) { caja.innerHTML = '<div class="resena vacia">Las opiniones no están disponibles en esta copia de la web.</div>'; $("resAbre").hidden = true; return; }
    const { data, error } = await nube.from("resenas").select("nombre, estrellas, texto, creado").order("creado", { ascending: false }).limit(24);
    if (error) { caja.innerHTML = '<div class="resena vacia">No se han podido cargar las opiniones.</div>'; return; }
    if (!data.length) { caja.innerHTML = '<div class="resena vacia">Aún no hay opiniones. Sé la primera persona en contar su experiencia.</div>'; $("resMedia").hidden = true; return; }
    const media = data.reduce((a, r) => a + r.estrellas, 0) / data.length;
    $("resNota").textContent = media.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 }); $("resEst").innerHTML = estrellasDe(media); $("resCuenta").textContent = data.length === 1 ? "1 opinión" : data.length + " opiniones"; $("resMedia").hidden = false;
    caja.innerHTML = data.map((r, i) => `<article class="resena" style="animation-delay:${Math.min(i, 8) * .05}s"><span class="ver-estrellas" aria-label="${r.estrellas} de 5">${estrellasDe(r.estrellas)}</span><p>${esc(r.texto)}</p><div class="quien"><i>${esc((r.nombre || "?")[0].toUpperCase())}</i>${esc(r.nombre)}<time datetime="${r.creado}">${new Date(r.creado).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}</time></div></article>`).join("");
  }
  /* Estrellas de 5 a 1 en el orden del DOM, como el componente original */
  const est = $("nuevaRes").querySelector(".estrellas"), NOMBRES = ["Mala", "Regular", "Buena", "Muy buena", "Excelente"];
  est.innerHTML = [5, 4, 3, 2, 1].map(n => `<input type="radio" id="est${n}" name="est" value="${n}"><label for="est${n}" title="${NOMBRES[n - 1]}">${ESTRELLA}</label>`).join("");
  $("resAbre").onclick = async () => {
    if (!nube) return;
    if (!usuario) { cuenta2(() => $("resAbre").click()); return; }
    const f = $("nuevaRes"); f.hidden = false; $("resAbre").hidden = true;
    const { data } = await nube.from("resenas").select("estrellas, texto").eq("user_id", usuario.id).maybeSingle();
    if (data) { const r = $("est" + data.estrellas); if (r) r.checked = true; $("resTxt").value = data.texto; $("resIr").textContent = "Actualizar opinión"; }
    $("resTxt").focus();
  };
  $("nuevaRes").onsubmit = async e => {
    e.preventDefault(); const n = +((est.querySelector("input:checked") || {}).value || 0), t = $("resTxt").value.trim(), m = $("resMsg");
    if (!n) { m.textContent = "Elige de una a cinco estrellas."; return; }
    if (t.length < 3) { m.textContent = "Escribe al menos unas palabras."; return; }
    const b = $("resIr"), txt = b.textContent; b.disabled = true; b.innerHTML = PUNTOS + "Publicando";
    const nombre = (usuario.user_metadata && (usuario.user_metadata.full_name || usuario.user_metadata.name)) || usuario.email.split("@")[0];
    const { error } = await nube.from("resenas").upsert({ user_id: usuario.id, nombre: String(nombre).slice(0, 40), estrellas: n, texto: t.slice(0, 500) }, { onConflict: "user_id" });
    b.disabled = false; b.textContent = txt;
    if (error) { m.textContent = "No se ha podido publicar. Inténtalo de nuevo."; return; }
    $("nuevaRes").hidden = true; $("resAbre").hidden = false; $("resAbre").textContent = "Editar mi opinión"; aviso("¡Gracias por tu opinión!"); cargaResenas();
  };
  /* Se cargan cuando el pie se acerca a la vista */
  const obs = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { obs.disconnect(); cargaResenas(); } }, { root: portada, rootMargin: "600px" });
  obs.observe($("pie"));
