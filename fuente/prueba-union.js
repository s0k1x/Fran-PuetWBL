/* Trocea la casa en zonas solapadas, las gira al azar y mide si la unión recupera la posición. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const { unirEscaneos } = require("./union.js");
const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, "casa.js"), "utf8") + ";this.crearCasa=crearCasa", ctx);
const casa = ctx.crearCasa();
const semilla = +process.argv[2] || 7; let s = semilla; const az = () => (s = s * 16807 % 2147483647) / 2147483647;
const solape = +process.argv[3] || 1.2, rui = +process.argv[4] || .01;
const zonas = [[-1, -1, 6.7, 9], [5.4, -1, 11, 5], [9.6, -1, 17, 9], [-1, 7.6, 8, 14], [6.4, 7.6, 17, 14]].map(z => z);
function caraTris(a, b) {
  const v = (x, y, z) => [x ? b[0] : a[0], y ? b[1] : a[1], z ? b[2] : a[2]], q = [[[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]]], o = [];
  for (const f of q) { const [p, r, t, u] = f.map(e => v(...e)); o.push(...p, ...r, ...t, ...p, ...t, ...u); }
  return o;
}
const reales = [];
const listas = zonas.map(z => {
  const t = [];
  for (const p of casa.cajas) {
    if (p.suelo || p.oculto) continue;
    const a = [Math.max(p.a[0], z[0]), p.a[1], Math.max(p.a[2], z[1])], b = [Math.min(p.b[0], z[2]), p.b[1], Math.min(p.b[2], z[3])];
    if (a[0] >= b[0] || a[2] >= b[2]) continue;
    t.push(...caraTris(a, b));
  }
  const th = az() * 6.283, c = Math.cos(th), n = Math.sin(th), tx = (az() - .5) * 40, tz = (az() - .5) * 40, dy = (az() - .5) * 2;
  reales.push({ th, c, n, tx, tz });
  const o = new Float32Array(t.length);
  for (let i = 0; i < t.length; i += 3) { const x = t[i], z2 = t[i + 2]; o[i] = c * x - n * z2 + tx + (az() - .5) * rui; o[i + 1] = t[i + 1] + dy; o[i + 2] = n * x + c * z2 + tz + (az() - .5) * rui; }
  return o;
});
const BASE = 4; const t0 = Date.now(), r = unirEscaneos(listas, { progreso: m => {}, verdad: process.env.DBG ? i => { const B = reales[BASE], R = reales[i], th = B.th - R.th, c = Math.cos(th), n = Math.sin(th); return { th, tx: B.tx - (c * R.tx - n * R.tz), tz: B.tz - (n * R.tx + c * R.tz) }; } : null });
console.log("tiempo", ((Date.now() - t0) / 1000).toFixed(1) + "s");
/* Error: lleva puntos de control de cada zona al marco del escaneo base y compara con el real */
const base = r.findIndex(x => x.nota === 9);
const adelante = (i, x, z) => { const R = reales[i]; return [R.c * x - R.n * z + R.tx, R.n * x + R.c * z + R.tz]; };
let peor = 0;
r.forEach((q, i) => {
  const z = zonas[i], cps = [[z[0] + 1, z[1] + 1], [z[2] - 1, z[1] + 1], [z[0] + 1, z[3] - 1], [z[2] - 1, z[3] - 1]]; let e = 0;
  for (const [x, y] of cps) {
    const [a, b] = adelante(i, x, y), c = Math.cos(q.th), n = Math.sin(q.th), ua = c * a - n * b + q.tx, ub = n * a + c * b + q.tz, [ra, rb] = adelante(base, x, y);
    e = Math.max(e, Math.hypot(ua - ra, ub - rb));
  }
  peor = Math.max(peor, q.encajado ? e : 99);
  console.log(`zona ${i} nota ${q.nota} ${q.encajado ? "encajada" : "SIN ENCAJE"} error ${e.toFixed(3)} m puntos ${q.puntos}`);
});
console.log("PEOR ERROR", peor.toFixed(3));
