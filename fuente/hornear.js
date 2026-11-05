/* Horneado de luz: trazador de rayos con rebotes sobre las cajas de casa.js.
   Salida: ../luz.png (atlas) y luz.json (posición de cada cara en el atlas). */
const fs = require("fs"), path = require("path"), zlib = require("zlib"), vm = require("vm");
const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, "casa.js"), "utf8") + ";this.crearCasa=crearCasa", ctx);
const casa = ctx.crearCasa(), MATS = casa.MATS, B = casa.cajas;
const S = +process.argv[2] || 2048, RL = +process.argv[3] || 12, REBOTES = 4, K = +process.argv[4] || 1;
const R = RL * RL, SUN_RAYS = 48, SUN_RAD = .011, MAXL = 8;
const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
const sol = norm(casa.sol), SOL_L = [11.5, 9.6, 7.3], CIE = { h: [1.5, 1.46, 1.38], z: [.8, .98, 1.32] };

/* BVH */
const nb = []; (function hazNodo(ids) {
  const n = { a: [1e9, 1e9, 1e9], b: [-1e9, -1e9, -1e9] }; nb.push(n);
  for (const i of ids) for (let k = 0; k < 3; k++) { n.a[k] = Math.min(n.a[k], B[i].a[k]); n.b[k] = Math.max(n.b[k], B[i].b[k]); }
  if (ids.length <= 3) { n.ids = ids; return nb.length - 1; }
  const e = [0, 1, 2].map(k => n.b[k] - n.a[k]), ax = e.indexOf(Math.max(...e));
  ids.sort((p, q) => (B[p].a[ax] + B[p].b[ax]) - (B[q].a[ax] + B[q].b[ax]));
  const m = ids.length >> 1;
  const yo = n; yo.l = nb.length; hazNodo(ids.slice(0, m)); yo.r = nb.length; hazNodo(ids.slice(m));
})(B.map((_, i) => i));
const pila = new Int32Array(128);
function caja(a, b, ox, oy, oz, ix, iy, iz, tmax) {
  let t0 = (a[0] - ox) * ix, t1 = (b[0] - ox) * ix; if (t0 > t1) { const t = t0; t0 = t1; t1 = t; }
  let s0 = (a[1] - oy) * iy, s1 = (b[1] - oy) * iy; if (s0 > s1) { const t = s0; s0 = s1; s1 = t; }
  if (s0 > t0) t0 = s0; if (s1 < t1) t1 = s1;
  s0 = (a[2] - oz) * iz; s1 = (b[2] - oz) * iz; if (s0 > s1) { const t = s0; s0 = s1; s1 = t; }
  if (s0 > t0) t0 = s0; if (s1 < t1) t1 = s1;
  if (t0 > t1 || t1 < 0 || t0 > tmax) return -1;
  return t0 < 0 ? 0 : t0;
}
let hitBox = -1, hitT = 0;
function traza(ox, oy, oz, dx, dy, dz, cualquiera) {
  const ix = 1 / dx, iy = 1 / dy, iz = 1 / dz; let sp = 0, mej = 1e9; hitBox = -1; pila[sp++] = 0;
  while (sp) {
    const n = nb[pila[--sp]];
    if (caja(n.a, n.b, ox, oy, oz, ix, iy, iz, mej) < 0) continue;
    if (n.ids) {
      for (const i of n.ids) { const t = caja(B[i].a, B[i].b, ox, oy, oz, ix, iy, iz, mej); if (t >= 0 && t < mej) { mej = t; hitBox = i; if (cualquiera) return true; } }
    } else { pila[sp++] = n.l; pila[sp++] = n.r; }
  }
  hitT = mej; return hitBox >= 0;
}
function dentro(x, y, z) {
  let sp = 0; pila[sp++] = 0;
  while (sp) {
    const n = nb[pila[--sp]];
    if (x < n.a[0] || x > n.b[0] || y < n.a[1] || y > n.b[1] || z < n.a[2] || z > n.b[2]) continue;
    if (n.ids) { for (const i of n.ids) { const p = B[i]; if (x > p.a[0] && x < p.b[0] && y > p.a[1] && y < p.b[1] && z > p.a[2] && z < p.b[2]) return true; } }
    else { pila[sp++] = n.l; pila[sp++] = n.r; }
  }
  return false;
}

/* Caras y texeles */
const UV = [[2, 1], [2, 1], [0, 2], [0, 2], [0, 1], [0, 1]];
const caras = [], porCaja = B.map(() => []);
let N = 0;
B.forEach((p, i) => {
  if (p.oculto) return;
  const m = MATS[p.m];
  for (let f = 0; f < 6; f++) {
    const ax = f >> 1, s = f & 1 ? -1 : 1, [u, v] = UV[f];
    const w = Math.max(2, Math.min(700, Math.ceil((p.b[u] - p.a[u]) * m.d * K))), h = Math.max(2, Math.min(700, Math.ceil((p.b[v] - p.a[v]) * m.d * K)));
    const val = new Uint8Array(w * h); let n = 0;
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) {
      const q = [0, 0, 0]; q[ax] = (s > 0 ? p.b : p.a)[ax] + s * .004;
      q[u] = p.a[u] + (k + .5) / w * (p.b[u] - p.a[u]); q[v] = p.a[v] + (j + .5) / h * (p.b[v] - p.a[v]);
      if (!dentro(q[0], q[1], q[2])) { val[k + j * w] = 1; n++; }
    }
    if (!n) continue;
    const c = { caja: i, f, ax, s, u, v, w, h, val, off: N, m }; caras.push(c); porCaja[i][f] = c; N += w * h;
  }
});
console.log("caras", caras.length, "texeles", N);
const orden = [...caras].sort((a, b) => b.h - a.h);
let x = 0, y = 0, fh = 0; const PAD = 2;
for (const c of orden) {
  if (x + c.w + PAD * 2 > S) { x = 0; y += fh; fh = 0; }
  c.x = x + PAD; c.y = y + PAD; x += c.w + PAD * 2; fh = Math.max(fh, c.h + PAD * 2);
}
if (y + fh > S) { console.log("NO CABE: alto", y + fh, "usa K menor"); process.exit(2); }
console.log("alto usado", y + fh, "de", S);

/* Rayos */
let semilla = 88172645463325252n;
let sA = 123456789, sB = 362436069;
const azar = () => { sA = (36969 * (sA & 65535) + (sA >>> 16)) >>> 0; sB = (18000 * (sB & 65535) + (sB >>> 16)) >>> 0; return (((sA << 16) + sB) >>> 0) / 4294967296; };
const hits = new Int32Array(N * R), Dir = new Float32Array(N * 3), Cielo = new Float32Array(N * 3);
const t0 = Date.now(); let hecho = 0;
for (const c of caras) {
  const p = B[c.caja], e = [0, 0, 0], tu = [0, 0, 0], tv = [0, 0, 0], nrm = [0, 0, 0];
  nrm[c.ax] = c.s; tu[c.u] = 1; tv[c.v] = 1;
  for (let j = 0; j < c.h; j++) for (let k = 0; k < c.w; k++) {
    const t = c.off + k + j * c.w; hecho++;
    if (!c.val[k + j * c.w]) { hits.fill(-2, t * R, (t + 1) * R); continue; }
    const q = [0, 0, 0]; q[c.ax] = (c.s > 0 ? p.b : p.a)[c.ax] + c.s * .006;
    q[c.u] = p.a[c.u] + (k + .5) / c.w * (p.b[c.u] - p.a[c.u]); q[c.v] = p.a[c.v] + (j + .5) / c.h * (p.b[c.v] - p.a[c.v]);
    /* Sol */
    const cos = nrm[0] * sol[0] + nrm[1] * sol[1] + nrm[2] * sol[2];
    if (cos > 0) {
      let vis = 0;
      for (let i = 0; i < SUN_RAYS; i++) {
        const a = azar() * 6.283, r = Math.sqrt(azar()) * SUN_RAD, dx = sol[0] + Math.cos(a) * r, dy = sol[1] + (Math.sin(a) * r), dz = sol[2] + Math.sin(a) * r * .7;
        if (!traza(q[0], q[1], q[2], dx, dy, dz, true)) vis++;
      }
      for (let i = 0; i < 3; i++) Dir[t * 3 + i] = SOL_L[i] * cos * vis / SUN_RAYS;
    }
    /* Hemisferio */
    let sr = 0, sg = 0, sb = 0, ri = 0;
    for (let a = 0; a < RL; a++) for (let b = 0; b < RL; b++) {
      const u1 = (a + azar()) / RL, u2 = (b + azar()) / RL, r = Math.sqrt(u1), ph = 6.283185 * u2, lx = r * Math.cos(ph), ly = r * Math.sin(ph), lz = Math.sqrt(Math.max(0, 1 - u1));
      const dx = tu[0] * lx + tv[0] * ly + nrm[0] * lz, dy = tu[1] * lx + tv[1] * ly + nrm[1] * lz, dz = tu[2] * lx + tv[2] * ly + nrm[2] * lz;
      let v = -1;
      if (traza(q[0], q[1], q[2], dx, dy, dz, false)) {
        const b2 = B[hitBox], hp = [q[0] + dx * hitT, q[1] + dy * hitT, q[2] + dz * hitT];
        let cf = null, d = 1e9;
        for (let i = 0; i < 6; i++) { const ax = i >> 1, val = (i & 1 ? b2.a : b2.b)[ax], g = Math.abs(hp[ax] - val); if (g < d && (i & 1 ? 1 : -1) * [dx, dy, dz][ax] > 0) { d = g; cf = porCaja[hitBox][i]; } }
        if (cf) {
          const k2 = Math.min(cf.w - 1, Math.max(0, Math.floor((hp[cf.u] - b2.a[cf.u]) / (b2.b[cf.u] - b2.a[cf.u]) * cf.w))), j2 = Math.min(cf.h - 1, Math.max(0, Math.floor((hp[cf.v] - b2.a[cf.v]) / (b2.b[cf.v] - b2.a[cf.v]) * cf.h)));
          v = cf.off + k2 + j2 * cf.w;
          if (!cf.val[k2 + j2 * cf.w]) v = -2;
        } else v = -2;
      } else {
        const m = Math.max(0, dy), f = Math.pow(m, .55);
        sr += CIE.h[0] + (CIE.z[0] - CIE.h[0]) * f; sg += CIE.h[1] + (CIE.z[1] - CIE.h[1]) * f; sb += CIE.h[2] + (CIE.z[2] - CIE.h[2]) * f;
      }
      hits[t * R + ri++] = v;
    }
    Cielo[t * 3] = sr / R; Cielo[t * 3 + 1] = sg / R; Cielo[t * 3 + 2] = sb / R;
  }
  if ((caras.indexOf(c) % 150) === 0) console.log(Math.round(hecho / N * 100) + "%", ((Date.now() - t0) / 1000 | 0) + "s");
}
/* Rebotes */
const al = new Float32Array(N * 3), em = new Float32Array(N * 3);
for (const c of caras) for (let t = c.off; t < c.off + c.w * c.h; t++) for (let i = 0; i < 3; i++) { al[t * 3 + i] = c.m.al[i]; em[t * 3 + i] = c.m.em ? c.m.em[i] : 0; }
let A = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) A[i] = Dir[i] + Cielo[i];
let Ind = new Float32Array(N * 3);
for (let it = 0; it < REBOTES; it++) {
  const nx = new Float32Array(N * 3);
  for (let t = 0; t < N; t++) {
    let r = 0, g = 0, b = 0;
    for (let i = t * R, e = i + R; i < e; i++) {
      const h = hits[i]; if (h < 0) continue;
      const h3 = h * 3; r += al[h3] * A[h3] + em[h3]; g += al[h3 + 1] * A[h3 + 1] + em[h3 + 1]; b += al[h3 + 2] * A[h3 + 2] + em[h3 + 2];
    }
    nx[t * 3] = r / R + Cielo[t * 3]; nx[t * 3 + 1] = g / R + Cielo[t * 3 + 1]; nx[t * 3 + 2] = b / R + Cielo[t * 3 + 2];
  }
  Ind = nx; for (let i = 0; i < N * 3; i++) A[i] = Dir[i] + Ind[i];
  console.log("rebote", it + 1);
}
/* Atlas: la luz indirecta se suaviza sin cruzar zonas inválidas; el sol queda nítido */
const P = new Uint8Array(S * S * 3); const enc = v => v <= 0 ? 0 : v < .0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - .055;
for (const c of caras) {
  const { w, h, val, off } = c; let I = new Float32Array(w * h * 3), D = new Float32Array(w * h * 3), ok = val.slice();
  for (let t = 0; t < w * h; t++) for (let i = 0; i < 3; i++) { I[t * 3 + i] = Ind[(off + t) * 3 + i]; D[t * 3 + i] = Dir[(off + t) * 3 + i]; }
  /* relleno de inválidos */
  for (let it = 0; it < 30; it++) {
    let queda = 0; const n = ok.slice();
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) {
      if (ok[k + j * w]) continue;
      let cu = 0, s = [0, 0, 0, 0, 0, 0];
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const q = k + a, r = j + b; if (q < 0 || r < 0 || q >= w || r >= h || !ok[q + r * w]) continue; cu++; for (let i = 0; i < 3; i++) { s[i] += I[(q + r * w) * 3 + i]; s[i + 3] += D[(q + r * w) * 3 + i]; } }
      if (cu) { for (let i = 0; i < 3; i++) { I[(k + j * w) * 3 + i] = s[i] / cu; D[(k + j * w) * 3 + i] = s[i + 3] / cu; } n[k + j * w] = 1; } else queda++;
    }
    ok = n; if (!queda) break;
  }
  /* suavizado */
  const rad = Math.min(3, Math.ceil(c.m.d / 7));
  for (let p = 0; p < 3; p++) {
    const J = new Float32Array(I.length);
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) {
      let s = [0, 0, 0], cu = 0;
      for (let a = -rad; a <= rad; a++) for (let b = -rad; b <= rad; b++) { const q = k + a, r = j + b; if (q < 0 || r < 0 || q >= w || r >= h) continue; cu++; for (let i = 0; i < 3; i++) s[i] += I[(q + r * w) * 3 + i]; }
      for (let i = 0; i < 3; i++) J[(k + j * w) * 3 + i] = s[i] / cu;
    }
    I = J;
  }
  { const J = new Float32Array(D.length);
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) { let s = [0, 0, 0], cu = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const q = k + a, r = j + b; if (q < 0 || r < 0 || q >= w || r >= h) continue; const pe = (a ? 1 : 2) * (b ? 1 : 2); cu += pe; for (let i = 0; i < 3; i++) s[i] += pe * D[(q + r * w) * 3 + i]; } for (let i = 0; i < 3; i++) J[(k + j * w) * 3 + i] = s[i] / cu; }
    D = J; }
  for (let j = -PAD; j < h + PAD; j++) for (let k = -PAD; k < w + PAD; k++) {
    const q = Math.max(0, Math.min(w - 1, k)), r = Math.max(0, Math.min(h - 1, j)), o = ((c.x + k) + (c.y + j) * S) * 3, tt = (q + r * w) * 3;
    for (let i = 0; i < 3; i++) P[o + i] = Math.max(0, Math.min(255, enc((I[tt + i] + D[tt + i]) / MAXL) * 255 + (azar() - .5)));
  }
}
/* PNG */
function crc(buf) { let c, r = -1; for (let n = 0; n < buf.length; n++) { c = (r ^ buf[n]) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; r = (r >>> 8) ^ c; } return (r ^ -1) >>> 0; }
function bloque(t, d) { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, "latin1"); d.copy(b, 8); b.writeUInt32BE(crc(b.slice(4, 8 + d.length)), 8 + d.length); return b; }
const raw = Buffer.alloc((S * 3 + 1) * S);
for (let y2 = 0; y2 < S; y2++) { const o = y2 * (S * 3 + 1); raw[o] = 1; for (let i = 0; i < S * 3; i++) raw[o + 1 + i] = P[y2 * S * 3 + i] - (i >= 3 ? P[y2 * S * 3 + i - 3] : 0); }
const ih = Buffer.alloc(13); ih.writeUInt32BE(S, 0); ih.writeUInt32BE(S, 4); ih[8] = 8; ih[9] = 2;
fs.writeFileSync(path.join(__dirname, "..", "luz.png"), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloque("IHDR", ih), bloque("IDAT", zlib.deflateSync(raw, { level: 9 })), bloque("IEND", Buffer.alloc(0))]));
fs.writeFileSync(path.join(__dirname, "luz.json"), JSON.stringify({ S, MAXL, c: caras.flatMap(c => [c.caja, c.f, c.x, c.y, c.w, c.h]) }));
console.log("listo", ((Date.now() - t0) / 1000 | 0) + "s", fs.statSync(path.join(__dirname, "..", "luz.png")).size / 1048576 | 0, "MB");
