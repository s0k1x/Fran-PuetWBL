const fs = require("fs"), path = require("path");
const f = n => fs.readFileSync(path.join(__dirname, n), "utf8");
const out = f("web.html")
  .replace("/*__CASA__*/", () => f("casa.js"))
  .replace("/*__ANALISIS__*/", () => f("analisis.js"))
  .replace("/*__HERR__*/", () => f("herramientas.js"))
  .replace("/*__IA__*/", () => f("ia.js"))
  .replace("/*__NUBE__*/", () => f("nube.js"))
  .replace("/*__PORTADA__*/", () => f("portada.js"))
  .replace("/*__PANEL__*/", () => f("panel.js"))
  .replace("/*__UNION__*/", () => f("union.js"))
  .replace("/*__LUZ__*/", () => "const LUZ = " + f("luz.json") + ";");
const raiz = path.join(__dirname, "..");
fs.writeFileSync(path.join(raiz, "planta-caminable.html"), out);
fs.writeFileSync(path.join(raiz, "index.html"), '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + out + "</body></html>");
console.log("ok", out.length);