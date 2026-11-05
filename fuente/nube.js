  /* ---------- Supabase: cuentas, publicación, salas, contacto y visitas ----------
     Las claves de aquí son públicas por diseño: la seguridad la ponen las reglas de la base de datos. */
  const nube = CONFIG.supabaseUrl && window.supabase ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey) : null;
  const MAX_MB = 50; let usuario = null;
  if (nube) { nube.auth.getSession().then(r => usuario = r.data.session ? r.data.session.user : null); nube.auth.onAuthStateChange((_, s) => usuario = s ? s.user : null); }
  const esDueno = () => !!(usuario && H.proyecto && H.proyecto.owner === usuario.id);
  const enlaceDe = slug => { const u = new URL(location.href); u.search = "?p=" + slug; u.hash = ""; return u.href; };
  const cierraFicha = () => $("ficha").hidden = true;
  function fila(...bs) { const f = texto("div", "fila"); bs.forEach(([t, fn]) => { const b = texto("button", "tool"); b.type = "button"; b.textContent = t; b.onclick = fn; f.append(b); }); return f; }

  /* Acceso: entrar, crear cuenta, Google y GitHub, enlace por correo y recuperar contraseña */
  const G_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.318 13.714v5.484h9.078c-0.37 2.354-2.745 6.901-9.078 6.901-5.458 0-9.917-4.521-9.917-10.099s4.458-10.099 9.917-10.099c3.109 0 5.193 1.318 6.38 2.464l4.339-4.182c-2.786-2.599-6.396-4.182-10.719-4.182-8.844 0-16 7.151-16 16s7.156 16 16 16c9.234 0 15.365-6.49 15.365-15.635 0-1.052-0.115-1.854-0.255-2.651z"/></svg>';
  const GH_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 0.396c-8.839 0-16 7.167-16 16 0 7.073 4.584 13.068 10.937 15.183 0.803 0.151 1.093-0.344 1.093-0.772 0-0.38-0.009-1.385-0.015-2.719-4.453 0.964-5.391-2.151-5.391-2.151-0.729-1.844-1.781-2.339-1.781-2.339-1.448-0.989 0.115-0.968 0.115-0.968 1.604 0.109 2.448 1.645 2.448 1.645 1.427 2.448 3.744 1.74 4.661 1.328 0.14-1.031 0.557-1.74 1.011-2.135-3.552-0.401-7.287-1.776-7.287-7.907 0-1.751 0.62-3.177 1.645-4.297-0.177-0.401-0.719-2.031 0.141-4.235 0 0 1.339-0.427 4.4 1.641 1.281-0.355 2.641-0.532 4-0.541 1.36 0.009 2.719 0.187 4 0.541 3.043-2.068 4.381-1.641 4.381-1.641 0.859 2.204 0.317 3.833 0.161 4.235 1.015 1.12 1.635 2.547 1.635 4.297 0 6.145-3.74 7.5-7.296 7.891 0.556 0.479 1.077 1.464 1.077 2.959 0 2.14-0.020 3.864-0.020 4.385 0 0.416 0.28 0.916 1.104 0.755 6.4-2.093 10.979-8.093 10.979-15.156 0-8.833-7.161-16-16-16z"/></svg>';
  let proveedores = null;
  async function miraProveedores() {
    if (proveedores) return proveedores;
    try { const r = await fetch(CONFIG.supabaseUrl + "/auth/v1/settings", { headers: { apikey: CONFIG.supabaseKey } }); const d = await r.json(); proveedores = d.external || {}; } catch (e) { proveedores = {}; }
    return proveedores;
  }
  function cuenta2(tras, modoIni = "entrar") {
    const A = $("acceso"); cierraFicha(); A.hidden = false; A.dataset.modo = modoIni;
    const obligatorio = CONFIG.accesoObligatorio && !usuario;
    const cerrar = () => { if (CONFIG.accesoObligatorio && !usuario) return; A.hidden = true; A.textContent = ""; document.removeEventListener("keydown", esc); };
    const esc = e => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", esc);
    A.onpointerdown = e => { if (e.target === A) cerrar(); };
    if (usuario) {
      const ini = (usuario.email || "?")[0].toUpperCase(), md = usuario.user_metadata || {}, nom = md.full_name || md.name || usuario.email.split("@")[0];
      A.innerHTML = `<div class="tarjeta"><button class="x" type="button" aria-label="Cerrar">${ico("x")}</button>${ico("logo", "i logo")}<h2 id="accTit">Tu <em>cuenta</em></h2>
        <div class="perfil"><span class="avatar">${ini}</span><div><b></b><span></span></div></div>
        <div class="menuL">
          <button type="button" data-a="pro">${ico("carpeta")}Mis proyectos<small>Publicados</small></button>
          <button type="button" data-a="pan">${ico("grafico")}Panel del propietario<small>Visitas</small></button>
          <button type="button" data-a="gal">${ico("galeria")}Galería</button>
          <button type="button" data-a="pub">${ico("subir")}Publicar este modelo<small>Enlace</small></button>
          <button type="button" data-a="sol">${ico("correo")}Notificaciones<small>Visitas</small></button>
          <button type="button" data-a="apa">${ico("sol")}Apariencia<small>Luz y calidad</small></button>
          <button type="button" data-a="acc">${ico("ojo")}Accesibilidad</button>
          <button type="button" data-a="sal">${ico("salir")}Cerrar sesión</button>
        </div><div class="accP" hidden style="margin-top:12px"></div></div>`;
      A.querySelector(".perfil b").textContent = nom; A.querySelector(".perfil span span").textContent = usuario.email;
      A.querySelector(".x").onclick = cerrar;
      const ir = (k, f) => A.querySelector(`[data-a="${k}"]`).onclick = f;
      ir("pro", () => { cerrar(); misProyectos(); });
      ir("pan", () => { cerrar(); panelDueno(); }); ir("gal", () => { cerrar(); galeria(); });
      ir("pub", () => { cerrar(); if (T.modo === "portada") aviso("Abre un modelo para publicarlo."); else publicar(); });
      ir("sol", () => { cerrar(); solicitudesNube(); });
      ir("apa", () => { cerrar(); if (T.modo === "portada") abrePanel("aju", BOTONES.aju); else { const f = $("ficha"); f.hidden = false; f.textContent = ""; panelAjustes(f); } });
      ir("acc", () => { const q = A.querySelector(".accP"); q.hidden = !q.hidden; q.textContent = ""; if (q.hidden) return; interruptor(q, "Reducir el movimiento", ACC.mov, v => { ACC.mov = v; aplicaAcc(); }); interruptor(q, "Más contraste", ACC.con, v => { ACC.con = v; aplicaAcc(); }); interruptor(q, "Texto más grande", ACC.txt, v => { ACC.txt = v; aplicaAcc(); }); });
      ir("sal", async () => { await nube.auth.signOut(); A.hidden = true; A.textContent = ""; aviso("Sesión cerrada."); if (CONFIG.accesoObligatorio) cuenta2(); });
      return;
    }
    A.innerHTML = `<div class="tarjeta">${obligatorio ? "" : `<button class="x" type="button" aria-label="Cerrar">${ico("x")}</button>`}${ico("logo", "i logo")}
      <h2 id="accTit">Bienvenido a <em>INNRA3D</em></h2><p class="sub">Guarda tus modelos, publícalos con un enlace y recibe visitas.</p>
      <div class="pestanas" role="tablist"><b></b><button type="button" role="tab" aria-selected="true" data-m="entrar">Entrar</button><button type="button" role="tab" aria-selected="false" data-m="alta">Crear cuenta</button></div>
      <form novalidate>
        <label class="campo"><input id="nCorreo" type="email" inputmode="email" autocomplete="email" placeholder=" " required><span>Correo electrónico</span></label>
        <label class="campo"><input id="nClave" type="password" autocomplete="current-password" placeholder=" " minlength="8"><span>Contraseña</span><button class="ojo" type="button" aria-label="Mostrar contraseña">${ico("ojo")}</button></label>
        <div class="fuerza" hidden><i></i><i></i><i></i><i></i></div>
        <button class="olvido" type="button">¿Has olvidado la contraseña?</button>
        <label class="casilla terminos" hidden><input type="checkbox" id="nAcepto"><span class="tick"></span><span>Acepto los <a href="#" data-legal="terminos">Términos y condiciones</a> y la <a href="#" data-legal="privacidad">Política de privacidad</a>.</span></label>
        <button class="principal" type="submit">Entrar</button>
      </form>
      <div class="o">o continúa con</div>
      <div class="redes"><button class="red" type="button" data-p="google">${G_SVG}Google</button><button class="red" type="button" data-p="github">${GH_SVG}GitHub</button></div>
      <button class="secundario" type="button" data-a="magia" style="margin-top:8px">${ico("correo")}Recibir un enlace para entrar</button>
      <p class="msg" role="status" id="nMsg"></p>
      <p class="alta-pie"><span class="pAlta">¿No tienes cuenta? <button type="button" data-ir="alta">Créala gratis</button></span><span class="pEntrar" hidden>¿Ya tienes cuenta? <button type="button" data-ir="entrar">Entra</button></span></p></div>`;
    const T2 = A.querySelector(".tarjeta"), F = A.querySelector("form"), correo = $("nCorreo"), clave = $("nClave"), boton = A.querySelector(".principal"), fuerza = A.querySelector(".fuerza"), acepto = A.querySelector(".terminos");
    const msg = (t, c = "") => { const m = $("nMsg"); m.textContent = t; m.className = "msg " + c; };
    const mal = (t, campo) => { msg(t, "mal"); if (campo && campo.closest(".campo")) { campo.closest(".campo").classList.add("mal"); campo.focus(); } T2.classList.remove("tiembla"); void T2.offsetWidth; T2.classList.add("tiembla"); };
    const ocupa = (on, txt) => { boton.disabled = on; boton.innerHTML = on ? `<span class="puntos peq"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>${txt}` : txt; };
    const modo = m => { A.dataset.modo = m; A.querySelectorAll(".pestanas button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.m === m))); const alta = m === "alta"; boton.textContent = alta ? "Crear cuenta" : "Entrar"; clave.autocomplete = alta ? "new-password" : "current-password"; fuerza.hidden = !alta; acepto.hidden = !alta; A.querySelector(".olvido").hidden = alta; A.querySelector(".pAlta").hidden = alta; A.querySelector(".pEntrar").hidden = !alta; msg(""); };
    A.querySelectorAll(".pestanas button").forEach(b => b.onclick = () => modo(b.dataset.m));
    A.querySelectorAll("[data-ir]").forEach(b => b.onclick = () => modo(b.dataset.ir));
    modo(modoIni);
    A.querySelectorAll("input").forEach(i => i.addEventListener("input", () => i.closest(".campo") && i.closest(".campo").classList.remove("mal")));
    clave.addEventListener("input", () => { const v = clave.value, n = (v.length >= 8) + (/[A-Z]/.test(v) && /[a-z]/.test(v)) + /\d/.test(v) + (/[^\w]/.test(v) || v.length >= 14); fuerza.querySelectorAll("i").forEach((e, k) => e.style.background = k < n ? ["#f08a72", "#e0b26a", "#c9d27a", "#8fd6a8"][n - 1] : ""); });
    A.querySelector(".ojo").onclick = () => { clave.type = clave.type === "password" ? "text" : "password"; };
    if (A.querySelector(".x")) A.querySelector(".x").onclick = cerrar;
    const volver = location.origin + location.pathname;
    /* Google y GitHub: solo se activan si están habilitados en Supabase */
    miraProveedores().then(pv => A.querySelectorAll(".red").forEach(b => { const on = !!pv[b.dataset.p]; b.disabled = !on; if (!on) { b.insertAdjacentHTML("beforeend", '<span class="pronto">Próximamente</span>'); b.title = "Disponible muy pronto"; } }));
    A.querySelectorAll(".red").forEach(b => b.onclick = async () => { b.disabled = true; const { error } = await nube.auth.signInWithOAuth({ provider: b.dataset.p, options: { redirectTo: volver } }); if (error) { b.disabled = false; mal("No se ha podido abrir el inicio de sesión con " + b.textContent.replace("Próximamente", "").trim() + "."); } });
    const correoOk = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim());
    F.onsubmit = async e => {
      e.preventDefault(); const d = { email: correo.value.trim(), password: clave.value };
      if (!correoOk()) return mal("Escribe un correo válido.", correo);
      if (A.dataset.modo === "alta") {
        if (d.password.length < 8) return mal("La contraseña necesita al menos 8 caracteres.", clave);
        if (!$("nAcepto").checked) return mal("Para crear la cuenta acepta los términos y la privacidad.");
        ocupa(true, "Creando la cuenta");
        const { data, error } = await nube.auth.signUp({ ...d, options: { emailRedirectTo: volver } }); ocupa(false, "Crear cuenta");
        if (error) return mal(/rate|limit/i.test(error.message) ? "Demasiados intentos. Espera unos minutos." : /registered|exists/i.test(error.message) ? "Ese correo ya tiene cuenta. Entra con él." : "No se ha podido crear la cuenta.");
        if (data.session) { A.hidden = true; A.textContent = ""; aviso("Cuenta creada. ¡Bienvenido!"); if (tras) tras(); } else msg("Te hemos enviado un correo. Confírmalo para entrar.", "bien");
        return;
      }
      if (!d.password) return mal("Escribe tu contraseña.", clave);
      ocupa(true, "Entrando");
      const { error } = await nube.auth.signInWithPassword(d); ocupa(false, "Entrar");
      if (error) return mal(/confirm/i.test(error.message) ? "Confirma tu cuenta desde el correo que te enviamos." : "Correo o contraseña incorrectos.", clave);
      A.hidden = true; A.textContent = ""; aviso("Sesión iniciada."); if (tras) tras();
    };
    A.querySelector(".olvido").onclick = async () => {
      if (!correoOk()) return mal("Escribe tu correo y te enviaremos un enlace para cambiarla.", correo);
      const { error } = await nube.auth.resetPasswordForEmail(correo.value.trim(), { redirectTo: volver });
      if (error) mal("No se ha podido enviar el correo. Inténtalo en unos minutos."); else msg("Revisa tu correo para elegir una contraseña nueva.", "bien");
    };
    A.querySelector('[data-a="magia"]').onclick = async () => {
      if (!correoOk()) return mal("Escribe tu correo para enviarte el enlace.", correo);
      const b = A.querySelector('[data-a="magia"]'); b.disabled = true;
      const { error } = await nube.auth.signInWithOtp({ email: correo.value.trim(), options: { emailRedirectTo: volver } }); b.disabled = false;
      if (error) mal(/rate|limit/i.test(error.message) ? "Demasiados intentos. Espera unos minutos." : "No se ha podido enviar el enlace."); else msg("Enlace enviado. Ábrelo desde este dispositivo para entrar.", "bien");
    };
    setTimeout(() => correo.focus(), 60);
  }
  /* Acceso obligatorio: listo para activarlo en CONFIG cuando estén Google y GitHub */
  if (nube && CONFIG.accesoObligatorio) nube.auth.getSession().then(r => { if (!r.data.session) setTimeout(() => cuenta2(), 400); });
  const datosProyecto = () => ({ v: 1, nombre: T.nombre, datos: D, nombres: [...(cfg.rooms || []), ...(guarda.leer("pc:nombres:" + cfg.name) || [])], scale: T.muestra ? 1 : T.auto * T.scale, eye: T.eye });
  async function paquete() {
    await pide("libs/fflate.min.js");
    const e = {};
    if (H.fuentes) {
      for (const f of H.fuentes) { const b = new Uint8Array(await f.arrayBuffer()); if (ext(f.name) === "zip") { const z = fflate.unzipSync(b); for (const k in z) if (!k.endsWith("/") && !/planta\.json$/.test(k)) e[k] = z[k]; } else e[f.name] = b; }
    } else {
      await pide("exporters/GLTFExporter.js");
      const r = await new Promise((ok, no) => new THREE.GLTFExporter().parse(T.modelo, ok, no, { binary: true, maxTextureSize: 2048 }));
      e[(T.nombre || "modelo") + ".glb"] = new Uint8Array(r);
    }
    e["planta.json"] = new TextEncoder().encode(JSON.stringify(datosProyecto()));
    return new Blob([fflate.zipSync(e, { level: 6 })], { type: "application/zip" });
  }
  /* Portada del proyecto para la galería: la vista actual en pequeño */
  const miniatura = () => { try { return vistaJPEG(560); } catch (e) { return null; } };
  async function publicar() {
    if (!usuario) { cuenta2(publicar); return; }
    aviso("Preparando el modelo…");
    try {
      const b = await paquete(); if (b.size > MAX_MB * 1048576) { aviso(`El proyecto pesa ${fmt(b.size / 1048576, 1)} MB y el máximo es ${MAX_MB} MB.`); return; }
      aviso("Subiendo el modelo…");
      if (esDueno()) {
        const { error } = await nube.storage.from("modelos").upload(H.proyecto.ruta, b, { upsert: true, contentType: "application/zip" }); if (error) throw error;
        const u = await nube.from("proyectos").update({ tamano: b.size, datos: D, miniatura: miniatura(), actualizado: new Date().toISOString() }).eq("id", H.proyecto.id); if (u.error) throw u.error;
        copia(enlaceDe(H.proyecto.slug), "Publicación actualizada. Enlace copiado."); return;
      }
      const slug = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(v => "abcdefghijkmnpqrstuvwxyz23456789"[v % 32]).join(""), ruta = `${usuario.id}/${slug}.zip`;
      const s = await nube.storage.from("modelos").upload(ruta, b, { contentType: "application/zip" }); if (s.error) throw s.error;
      const r = await nube.from("proyectos").insert({ nombre: (T.nombre || "Modelo").slice(0, 120), slug, ruta, tamano: b.size, datos: D, publico: true, miniatura: miniatura() }).select().single();
      if (r.error) { await nube.storage.from("modelos").remove([ruta]); throw r.error; }
      H.proyecto = r.data; try { history.replaceState(null, "", enlaceDe(slug)); } catch (e) {}
      copia(enlaceDe(slug), "Publicado. Enlace copiado.");
    } catch (e) { console.error(e); aviso("No se ha podido publicar. " + (/exceeded|size/i.test(e.message || "") ? "El archivo es demasiado grande." : "Inténtalo de nuevo.")); }
  }
  let tGuarda = 0;
  function nubeGuarda() { if (!nube || !esDueno()) return; clearTimeout(tGuarda); tGuarda = setTimeout(async () => { const { error } = await nube.from("proyectos").update({ datos: D }).eq("id", H.proyecto.id); if (error) aviso("No se han podido guardar los cambios en la nube."); }, 1500); }
  async function abreProyecto(slug) {
    if (!nube) { fallo("Este enlace necesita la conexión con Supabase."); return; }
    ocupado(true); await estado("Abriendo el modelo publicado");
    try {
      const { data: p, error } = await nube.from("proyectos").select("*").eq("slug", slug).maybeSingle();
      if (error || !p) throw new Error("No encuentro ese modelo. Puede que sea privado o se haya borrado.");
      const d = await nube.storage.from("modelos").download(p.ruta); if (d.error) throw new Error("No se ha podido descargar el modelo.");
      await cargar([new File([d.data], p.nombre.replace(/[^\w-]/g, "_") + ".zip")], null);
      if (T.modo === "portada") return;
      H.proyecto = p;
      if (p.datos && p.datos.puntos) { D = Object.assign(vacioD(), p.datos); pintaPuntos(); pintaMuebles(); aplicaAmb(); }
    } catch (e) { fallo(motivo(e)); }
  }
  async function misProyectos() {
    if (!usuario) { cuenta2(misProyectos); return; }
    const { data, error } = await nube.from("proyectos").select("id,nombre,slug,publico,en_galeria,ruta,tamano,creado").eq("owner", usuario.id).order("creado", { ascending: false }).limit(50);
    if (error) { aviso("No se han podido cargar tus proyectos."); return; }
    const f = $("ficha"); f.textContent = ""; f.hidden = false; const h = texto("h3"); h.textContent = "Mis proyectos"; f.append(h);
    if (!data.length) { const p = texto("p"); p.textContent = "Aún no has publicado ningún modelo."; f.append(p); }
    data.forEach(p => {
      const d = texto("div", "ajuste"), n = texto("span"), e = texto("span", "dato"); n.textContent = p.nombre; e.textContent = `${fmt(p.tamano / 1048576, 1)} MB · ${p.publico ? "público" : "privado"}`; d.append(n, e);
      const fi = fila(["Abrir", () => { cierraFicha(); try { history.replaceState(null, "", enlaceDe(p.slug)); } catch (x) {} irPortada(); abreProyecto(p.slug); }], ["Copiar enlace", () => copia(enlaceDe(p.slug), "Enlace copiado.")], [p.en_galeria ? "Quitar de la galería" : "Mostrar en la galería", async () => { const { error } = await nube.from("proyectos").update({ en_galeria: !p.en_galeria, publico: true }).eq("id", p.id); if (error) aviso("No se ha podido cambiar."); else misProyectos(); }], [p.publico ? "Hacer privado" : "Hacer público", async () => { const { error } = await nube.from("proyectos").update({ publico: !p.publico }).eq("id", p.id); if (error) aviso("No se ha podido cambiar."); else misProyectos(); }], ["Borrar", null]);
      const b = fi.lastChild; b.onclick = async () => { if (b.dataset.seguro !== "1") { b.dataset.seguro = "1"; b.textContent = "Confirmar borrado"; return; } const r1 = await nube.storage.from("modelos").remove([p.ruta]), r2 = await nube.from("proyectos").delete().eq("id", p.id); if (r1.error || r2.error) aviso("No se ha podido borrar."); else { aviso("Proyecto borrado."); misProyectos(); } };
      d.append(fi); f.append(d);
    });
    f.append(fila(["Cerrar", cierraFicha]));
  }
  function contactoNube() {
    const f = $("ficha"); f.hidden = false;
    f.innerHTML = '<h3>Pedir visita</h3><label class="ajuste">Nombre<input id="cN" type="text" maxlength="80" autocomplete="name"></label><label class="ajuste">Correo o teléfono<input id="cC" type="text" maxlength="120"></label><label class="ajuste">Mensaje<textarea id="cM" rows="3" maxlength="600"></textarea></label>';
    f.append(fila(["Enviar", async () => { const n = $("cN").value.trim(), c = $("cC").value.trim(); if (!n || c.length < 3) { aviso("Escribe tu nombre y cómo contactarte."); return; } const { error } = await nube.from("contactos").insert({ proyecto_id: H.proyecto.id, nombre: n, contacto: c, mensaje: $("cM").value.trim() }); if (error) aviso("No se ha podido enviar."); else { cierraFicha(); aviso("Solicitud enviada."); } }], ["Cerrar", cierraFicha]));
  }
  async function solicitudesNube() {
    const { data, error } = await nube.from("contactos").select("*").eq("proyecto_id", H.proyecto.id).order("creado", { ascending: false }).limit(50);
    if (error) { aviso("No se han podido cargar las solicitudes."); return; }
    const f = $("ficha"); f.textContent = ""; f.hidden = false; const h = texto("h3"); h.textContent = "Solicitudes"; f.append(h);
    if (!data.length) { const p = texto("p"); p.textContent = "Aún no hay solicitudes."; f.append(p); }
    data.forEach(v => { const d = texto("div", "ajuste"), n = texto("span"), m = texto("span", "dato"); n.textContent = `${v.nombre} · ${v.contacto}`; n.style.userSelect = "text"; m.textContent = v.mensaje || ""; d.append(n, m); f.append(d); });
    f.append(fila(["Cerrar", cierraFicha]));
  }
  async function estadisticasNube() {
    const { data, error } = await nube.from("visitas").select("sesion,estancia,segundos,metros").eq("proyecto_id", H.proyecto.id).limit(5000);
    if (error) { aviso("No se han podido cargar las estadísticas."); return; }
    const por = {}, ses = new Set(); let tot = 0, met = 0; data.forEach(v => { ses.add(v.sesion); tot += v.segundos; met += v.metros; if (v.estancia) por[v.estancia] = (por[v.estancia] || 0) + v.segundos; });
    const h = $("hoja"), fil = Object.entries(por).sort((a, b) => b[1] - a[1]), max = Math.max(1, ...fil.map(f => f[1])); h.textContent = ""; h.hidden = false; h.dataset.tipo = "informe";
    const r = texto("div", "ajuste"); r.innerHTML = `<span>Visitas<span class="dato">${ses.size}</span></span><span>Tiempo total<span class="dato">${reloj(tot * 1000)}</span></span><span>Distancia<span class="dato">${fmt(met, 0)} m</span></span>`; h.append(r);
    fil.forEach(([n0, v]) => { const d = texto("div", "barraE"), n = texto("span"), e = texto("span", "dato"), b = texto("i"); n.textContent = n0; e.textContent = reloj(v * 1000); b.style.width = v / max * 100 + "%"; d.append(n, e, b); h.append(d); });
  }
  /* Registro de la visita al salir, sin datos personales */
  const sesion = crypto.randomUUID ? crypto.randomUUID() : "00000000-0000-4000-8000-" + Date.now().toString(16).padStart(12, "0").slice(-12);
  const enviado = {}; let metrosEnv = 0;
  function enviaVisita() {
    if (!nube || !H.proyecto || esDueno()) return;
    const met = T.andado - metrosEnv, filas = [];
    for (const i in H.stats) { const seg = Math.round(H.stats[i] - (enviado[i] || 0)); if (seg < 1 || !salas[i]) continue; filas.push({ proyecto_id: H.proyecto.id, sesion, estancia: salas[i].nombre.slice(0, 60), segundos: Math.min(seg, 86400), metros: 0 }); enviado[i] = H.stats[i]; }
    if (!filas.length) return; filas[0].metros = Math.min(100000, Math.max(0, +met.toFixed(1))); metrosEnv = T.andado;
    fetch(CONFIG.supabaseUrl + "/rest/v1/visitas", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json", apikey: CONFIG.supabaseKey, Prefer: "return=minimal" }, body: JSON.stringify(filas) }).catch(() => {});
  }
  addEventListener("pagehide", enviaVisita);
  document.addEventListener("visibilitychange", () => { if (document.hidden) enviaVisita(); });

  /* Multijugador con un canal de Realtime por modelo */
  const yo = Math.random().toString(36).slice(2, 12), otros = new Map(); let canal = null, tPos = 0, ultPos = "";
  function quitaOtro(id) { const e = otros.get(id); if (e) { capaGente.remove(e); otros.delete(id); } }
  async function alternaSalaNube() {
    if (canal) { await nube.removeChannel(canal); canal = null; [...otros.keys()].forEach(quitaOtro); $("nGente").hidden = true; aviso("Has salido de la sala."); return; }
    canal = nube.channel("sala:" + H.proyecto.slug, { config: { broadcast: { self: false }, presence: { key: yo } } });
    canal.on("broadcast", { event: "p" }, ({ payload: q }) => {
      if (!q || typeof q.id !== "string" || !isFinite(q.x) || !isFinite(q.y) || !isFinite(q.z)) return;
      let e = otros.get(q.id); if (!e) { if (otros.size > 30) return; e = new THREE.Mesh(new THREE.CapsuleGeometry(.16, 1.1, 6, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .4 })); e.position.set(q.x, q.y + .85, q.z); capaGente.add(e); otros.set(q.id, e); }
      e.userData.o = new THREE.Vector3(q.x, q.y + .85, q.z);
    }).on("presence", { event: "sync" }, () => { const n = Object.keys(canal.presenceState()).length; $("nGente").textContent = n === 1 ? "Solo tú en la sala" : `${n} personas en la sala`; $("nGente").hidden = false; })
      .on("presence", { event: "leave" }, ({ key }) => quitaOtro(key))
      .subscribe(async s => { if (s === "SUBSCRIBED") { await canal.track({ en: Date.now() }); aviso("Dentro de la sala. Comparte el enlace para que te encuentren."); } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") aviso("No se ha podido conectar con la sala."); });
  }
  function frameNube(dt, now) {
    otros.forEach(e => { if (e.userData.o) e.position.lerp(e.userData.o, 1 - Math.exp(-dt * 10)); });
    if (canal && T.modo === "andar" && now - tPos > 120) { tPos = now; const s = `${T.x.toFixed(2)},${T.py.toFixed(2)},${T.z.toFixed(2)}`; if (s !== ultPos) { ultPos = s; canal.send({ type: "broadcast", event: "p", payload: { id: yo, x: +T.x.toFixed(2), y: +T.py.toFixed(2), z: +T.z.toFixed(2) } }); } }
  }
  function agregaNube(add) {
    if (!nube) return;
    add("Nube", usuario ? "Mi cuenta" : "Iniciar sesión", usuario ? usuario.email : "Publica y guarda tus modelos", () => cuenta2());
    add("Nube", "Mis proyectos", "Abre, comparte o borra lo publicado", misProyectos);
    if (!T.muestra) add("Nube", esDueno() ? "Actualizar publicación" : "Publicar y compartir", `Crea un enlace, hasta ${MAX_MB} MB`, publicar);
    if (H.proyecto) {
      add("Nube", canal ? "Salir de la sala" : "Sala multijugador", "Camina con quien abra este enlace", alternaSalaNube);
      add("Nube", "Copiar enlace", "Enlace público de este modelo", () => copia(enlaceDe(H.proyecto.slug), "Enlace copiado."));
      if (esDueno()) { add("Nube", "Solicitudes", "Mensajes de quienes piden visita", solicitudesNube); add("Nube", "Visitas reales", "Tiempo por estancia de todos los visitantes", estadisticasNube); }
    }
  }
  $("bCuenta").addEventListener("click", () => { if (!nube) { $("error").textContent = "Las cuentas no están disponibles en esta copia de la web."; $("error").hidden = false; return; } if (usuario) misProyectos(); else cuenta2(misProyectos); });

