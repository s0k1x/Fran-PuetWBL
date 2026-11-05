/* Parte la casa en 5 piezas sin solape, las gira al azar y las encaja contra un plano dibujado con ruido y escala mal estimada. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const { unirEscaneos } = require("./union.js");
const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, "casa.js"), "utf8") + ";this.crearCasa=crearCasa", ctx);
const casa = ctx.crearCasa(); let s = +process.argv[2] || 7; const az = () => (s = s * 16807 % 2147483647) / 2147483647;
const errEsc = +process.argv[3] || 1.2, ppm = 40, M = 2, w = Math.ceil((16 + M * 2) * ppm), h = Math.ceil((13 + M * 2) * ppm), ink = new Uint8Array(w * h);
const pinta = (x0, z0, x1, z1) => { for (let z = Math.floor((z0 + M) * ppm); z < (z1 + M) * ppm; z++) for (let x = Math.floor((x0 + M) * ppm); x < (x1 + M) * ppm; x++) if (x >= 0 && z >= 0 && x < w && z < h) ink[x + z * w] = 1; };
for (const p of casa.cajas) if (!p.suelo && !p.oculto && p.b[1] >= 2.6 && p.a[1] < 1 && p.b[0] - p.a[0] < 8.5 + 9 && (p.m === "yeso")) pinta(p.a[0], p.a[2], p.b[0], p.b[2]);
for (let i = 0; i < 60; i++) { const x = az() * 16, z = az() * 13; pinta(x, z, x + .4, z + .03); } // texto y cotas
const zonas = [[-1, -1, 6, 8.9], [6, -1, 11, 5], [11, -1, 17, 8.9], [-1, 8.9, 8, 14], [8, 8.9, 17, 14]], reales = [];
function caraTris(a, b) { const v = (x, y, z) => [x ? b[0] : a[0], y ? b[1] : a[1], z ? b[2] : a[2]], q = [[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],[[0,0,0],[0,1,0],[0,1,1],[0,0,1]],[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],[[0,1,0],[1,1,0],[1,1,1],[0,1,1]]], o = []; for (const f of q) { const [p, r, t, u] = f.map(e => v(...e)); o.push(...p, ...r, ...t, ...p, ...t, ...u); } return o; }
const listas = zonas.map(z => { const t = []; for (const p of casa.cajas) { if (p.suelo || p.oculto) continue; const a = [Math.max(p.a[0], z[0]), p.a[1], Math.max(p.a[2], z[1])], b = [Math.min(p.b[0], z[2]), p.b[1], Math.min(p.b[2], z[3])]; if (a[0] >= b[0] || a[2] >= b[2]) continue; t.push(...caraTris(a, b)); }
  const th = az() * 6.283, c = Math.cos(th), n = Math.sin(th), tx = (az() - .5) * 40, tz = (az() - .5) * 40; reales.push({ c, n, tx, tz }); const o = new Float32Array(t.length); for (let i = 0; i < t.length; i += 3) { const x = t[i], y = t[i + 2]; o[i] = c * x - n * y + tx + (az() - .5) * .02; o[i + 1] = t[i + 1]; o[i + 2] = n * x + c * y + tz + (az() - .5) * .02; } return o; });
const t0 = Date.now(), r = unirEscaneos(listas, { plano: { ink, w, h, mpp: errEsc / ppm } });
console.log("tiempo", ((Date.now() - t0) / 1000).toFixed(1) + "s", "escala real", 1 / ppm, "hallada", r.mpp.toFixed(5));
let peor = 0; r.piezas.forEach((q, i) => { const z = zonas[i], R = reales[i]; let e = 0; for (const [x, y] of [[z[0] + 1, z[1] + 1], [z[2] - 1, z[1] + 1], [z[0] + 1, z[3] - 1], [z[2] - 1, z[3] - 1]]) { const a = R.c * x - R.n * y + R.tx, b = R.n * x + R.c * y + R.tz, c = Math.cos(q.th), n = Math.sin(q.th), ua = c * a - n * b + q.tx, ub = n * a + c * b + q.tz; e = Math.max(e, Math.hypot(ua - (x + M), ub - (y + M))); } peor = Math.max(peor, e); console.log(`pieza ${i} nota ${q.nota} error ${e.toFixed(3)} m`); });
console.log("PEOR ERROR", peor.toFixed(3));
