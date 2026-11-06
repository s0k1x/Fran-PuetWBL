const fs = require("fs"), path = require("path");
const f = n => fs.readFileSync(path.join(__dirname, n), "utf8");
let out = f("web.html")
  .replace("/*__CASA__*/", () => f("casa.js"))
  .replace("/*__ESTILO__*/", () => f("estilo.css"))
  .replace("/*__ANALISIS__*/", () => f("analisis.js"))
  .replace("/*__INTERFAZ__*/", () => f("interfaz.js"))
  .replace("/*__SITIO__*/", () => f("sitio.js"))
  .replace("/*__ESTUDIO__*/", () => f("estudio.js"))
  .replace("/*__IA3__*/", () => f("ia3.js"))
  .replace("/*__SOCIAL__*/", () => f("social.js"))
  .replace("/*__INTEGRA__*/", () => f("integra.js"))
  .replace("/*__MUESTRAS__*/", () => f("muestras.js"))
  .replace("/*__PANO__*/", () => f("pano360.js"))
  .replace("/*__REAL__*/", () => f("realismo.js"))
  .replace("/*__OPTIMIZA__*/", () => f("optimiza.js"))
  .replace("/*__HERR__*/", () => f("herramientas.js"))
  .replace("/*__IA__*/", () => f("ia.js"))
  .replace("/*__NUBE__*/", () => f("nube.js"))
  .replace("/*__PORTADA__*/", () => f("portada.js"))
  .replace("/*__PANEL__*/", () => f("panel.js"))
  .replace("/*__UNION__*/", () => f("union.js"))
  .replace("/*__LUZ__*/", () => "const LUZ = " + f("luz.json") + ";");
/* Minificado: menos bytes que descargar y menos que analizar (si terser está disponible) */
try {
  const { execFileSync } = require("child_process"), os = require("os"), tmp = path.join(os.tmpdir(), "innra-min");
  fs.mkdirSync(tmp, { recursive: true });
  out = out.replace(/<script>([\s\S]*?)<\/script>/g, (m, js) => {
    if (js.length < 2000) return m;
    const a = path.join(tmp, "in.js"), b = path.join(tmp, "out.js"); fs.writeFileSync(a, js);
    execFileSync("npx", ["--yes", "terser", a, "-c", "passes=1", "-m", "-o", b], { stdio: "ignore" });
    return "<script>" + fs.readFileSync(b, "utf8") + "</script>";
  });
  out = out.replace(/<style>([\s\S]*?)<\/style>/g, (m, css) => "<style>" + css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ") + "</style>");
} catch (e) { console.warn("Sin minificar:", e.message); }
const raiz = path.join(__dirname, "..");
fs.writeFileSync(path.join(raiz, "planta-caminable.html"), out);
fs.writeFileSync(path.join(raiz, "index.html"), '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><link rel="icon" href="logo.svg" type="image/svg+xml"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icono-192.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta property="og:title" content="INNRA3D"><meta property="og:description" content="Recorre cualquier casa en 3D desde el navegador, con luz real e inteligencia artificial."></head><body>' + out + "</body></html>");
console.log("ok", out.length);