const fs = require("fs"), path = require("path");
const f = n => fs.readFileSync(path.join(__dirname, n), "utf8");
const out = f("web.html")
  .replace("/*__CASA__*/", () => f("casa.js"))
  .replace("/*__ANALISIS__*/", () => f("analisis.js"))
  .replace("/*__LUZ__*/", () => "const LUZ = " + f("luz.json") + ";");
fs.writeFileSync(path.join(__dirname, "..", "planta-caminable.html"), out);
fs.writeFileSync(path.join(__dirname, "..", "_t.html"), '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + out + "</body></html>");
console.log("ok", out.length);
