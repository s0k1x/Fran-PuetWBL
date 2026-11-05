const fs = require("fs"), path = require("path");
const f = n => fs.readFileSync(path.join(__dirname, n), "utf8");
const out = f("web.html")
  .replace("/*__CASA__*/", () => f("casa.js"))
  .replace("/*__ESTILO__*/", () => f("estilo.css"))
  .replace("/*__ANALISIS__*/", () => f("analisis.js"))
  .replace("/*__INTERFAZ__*/", () => f("interfaz.js"))
  .replace("/*__SITIO__*/", () => f("sitio.js"))
  .replace("/*__ESTUDIO__*/", () => f("estudio.js"))
  .replace("/*__IA3__*/", () => f("ia3.js"))
  .replace("/*__SOCIAL__*/", () => f("social.js"))
  .replace("/*__INTEGRA__*/", () => f("integra.js"))
  .replace("/*__REAL__*/", () => f("realismo.js"))
  .replace("/*__OPTIMIZA__*/", () => f("optimiza.js"))
  .replace("/*__HERR__*/", () => f("herramientas.js"))
  .replace("/*__IA__*/", () => f("ia.js"))
  .replace("/*__NUBE__*/", () => f("nube.js"))
  .replace("/*__PORTADA__*/", () => f("portada.js"))
  .replace("/*__PANEL__*/", () => f("panel.js"))
  .replace("/*__UNION__*/", () => f("union.js"))
  .replace("/*__LUZ__*/", () => "const LUZ = " + f("luz.json") + ";");
const raiz = path.join(__dirname, "..");
fs.writeFileSync(path.join(raiz, "planta-caminable.html"), out);
fs.writeFileSync(path.join(raiz, "index.html"), '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="icon" href="logo.svg" type="image/svg+xml"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icono-192.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta property="og:title" content="INNRA3D"><meta property="og:description" content="Recorre cualquier casa en 3D desde el navegador, con luz real e inteligencia artificial."></head><body>' + out + "</body></html>");
console.log("ok", out.length);