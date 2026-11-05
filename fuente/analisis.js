/* Análisis del modelo. Corre en un Worker: no puede usar nada de fuera.
   Devuelve un árbol de colisión (BVH) y un plano con habitaciones por cada planta. */
function analizar(t, pisos) {
  const n = t.length / 9;
  /* ---------- BVH ---------- */
  const idx = new Int32Array(n), cen = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { idx[i] = i; const p = i * 9; cen[i * 3] = (t[p] + t[p + 3] + t[p + 6]) / 3; cen[i * 3 + 1] = (t[p + 1] + t[p + 4] + t[p + 7]) / 3; cen[i * 3 + 2] = (t[p + 2] + t[p + 5] + t[p + 8]) / 3; }
  const cap = Math.max(16, Math.ceil(n / 2) + 16);
  let cajas = new Float32Array(cap * 6), der = new Int32Array(cap), ini = new Int32Array(cap), cue = new Int32Array(cap), nn = 0;
  const pila = [[0, n, -1]];
  while (pila.length) {
    const [a, b, padre] = pila.pop(), yo = nn++;
    if (padre >= 0) der[padre] = yo;
    let x0 = 1e18, y0 = 1e18, z0 = 1e18, x1 = -1e18, y1 = -1e18, z1 = -1e18, cx0 = 1e18, cy0 = 1e18, cz0 = 1e18, cx1 = -1e18, cy1 = -1e18, cz1 = -1e18;
    for (let i = a; i < b; i++) {
      const q = idx[i], p = q * 9;
      for (let v = 0; v < 9; v += 3) { const x = t[p + v], y = t[p + v + 1], z = t[p + v + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      const cx = cen[q * 3], cy = cen[q * 3 + 1], cz = cen[q * 3 + 2]; if (cx < cx0) cx0 = cx; if (cx > cx1) cx1 = cx; if (cy < cy0) cy0 = cy; if (cy > cy1) cy1 = cy; if (cz < cz0) cz0 = cz; if (cz > cz1) cz1 = cz;
    }
    const o = yo * 6; cajas[o] = x0; cajas[o + 1] = y0; cajas[o + 2] = z0; cajas[o + 3] = x1; cajas[o + 4] = y1; cajas[o + 5] = z1;
    const ex = cx1 - cx0, ey = cy1 - cy0, ez = cz1 - cz0, ax = ex >= ey && ex >= ez ? 0 : ey >= ez ? 1 : 2, mid = ax === 0 ? (cx0 + cx1) / 2 : ax === 1 ? (cy0 + cy1) / 2 : (cz0 + cz1) / 2;
    let m = a;
    if (b - a > 8 && Math.max(ex, ey, ez) > 1e-7) { let j = b - 1; while (m <= j) { if (cen[idx[m] * 3 + ax] < mid) m++; else { const w = idx[m]; idx[m] = idx[j]; idx[j] = w; j--; } } if (m === a || m === b) m = (a + b) >> 1; }
    if (b - a <= 8 || Math.max(ex, ey, ez) <= 1e-7 && b - a <= 64) { ini[yo] = a; cue[yo] = b - a; der[yo] = -1; }
    else {
      if (m <= a || m >= b) m = (a + b) >> 1;
      ini[yo] = 0; cue[yo] = 0;
      pila.push([m, b, yo]); pila.push([a, m, -1]);
    }
    if (nn + 4 >= cajas.length / 6) { const c = cajas.length / 6 * 2, a2 = new Float32Array(c * 6), d2 = new Int32Array(c), i2 = new Int32Array(c), k2 = new Int32Array(c); a2.set(cajas); d2.set(der); i2.set(ini); k2.set(cue); cajas = a2; der = d2; ini = i2; cue = k2; }
  }
  const orden = new Float32Array(t.length);
  for (let i = 0; i < n; i++) { const p = idx[i] * 9; for (let j = 0; j < 9; j++) orden[i * 9 + j] = t[p + j]; }
  const bvh = { cajas: cajas.slice(0, nn * 6), der: der.slice(0, nn), ini: ini.slice(0, nn), cue: cue.slice(0, nn), tris: orden };

  /* ---------- Alturas ---------- */
  let x0 = 1e18, x1 = -1e18, y0 = 1e18, y1 = -1e18, z0 = 1e18, z1 = -1e18;
  for (let i = 0; i < t.length; i += 3) { const x = t[i], y = t[i + 1], z = t[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  const paso = n > 2500000 ? Math.ceil(n / 2500000) : 1;
  const bin = .05, nb = Math.min(40000, Math.max(2, Math.ceil((y1 - y0) / bin) + 1)), hor = new Float64Array(nb), ver = new Float64Array(nb), nyOf = new Float32Array(n);
  for (let i = 0; i < n; i += paso) {
    const p = i * 9, ax = t[p + 3] - t[p], ay = t[p + 4] - t[p + 1], az = t[p + 5] - t[p + 2], bx = t[p + 6] - t[p], by = t[p + 7] - t[p + 1], bz = t[p + 8] - t[p + 2];
    const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx, len = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1e-12, ny = Math.abs(cy) / len;
    nyOf[i] = ny;
    const b = Math.min(nb - 1, Math.floor(((t[p + 1] + t[p + 4] + t[p + 7]) / 3 - y0) / bin));
    if (ny > .85) hor[b] += len / 2; else if (ny < .4) ver[b] += len / 2;
  }
  const sm = new Float64Array(nb); let mx = 0;
  for (let i = 0; i < nb; i++) { for (let j = -1; j <= 1; j++) if (hor[i + j]) sm[i] += hor[i + j]; if (sm[i] > mx) mx = sm[i]; }
  const picos = [];
  for (let i = 0; i < nb; i++) if (sm[i] >= mx * .18 && (i === 0 || sm[i] >= sm[i - 1]) && (i === nb - 1 || sm[i] > sm[i + 1])) { const yy = y0 + (i + .5) * bin; if (!picos.length || yy - picos[picos.length - 1] > .4) picos.push(yy); }
  const verEntre = (a, b) => { let s = 0; for (let i = Math.max(0, Math.floor((a - y0) / bin)); i <= Math.min(nb - 1, Math.floor((b - y0) / bin)); i++) s += ver[i]; return s; };
  const plantas = [];
  if (picos.length) {
    const ref = Math.max(1e-9, ...picos.map(c => verEntre(c + .3, c + 1.9)));
    for (const c of picos) if (verEntre(c + .3, c + 1.9) >= ref * .15 && (!plantas.length || c - plantas[plantas.length - 1] >= 2)) plantas.push(c);
  }
  if (pisos && pisos.length) { plantas.length = 0; plantas.push(...pisos); }
  const planos = plantas.map((f, i) => {
    const sig = i + 1 < plantas.length ? plantas[i + 1] : y1 + 1;
    const techos = picos.filter(c => c > f + 1.8 && c <= sig + .1);
    return plano(t, n, nyOf, paso, { x0, x1, z0, z1, floorY: f, ceilH: techos.length ? techos[0] - f : 2.5, hasCeil: !!techos.length, bin });
  }).filter(p => p.rooms.length);
  return { bvh, planos, caja: [x0, y0, z0, x1, y1, z1], tris: n };
}

function plano(t, n, nyOf, paso, o) {
  const { x0, x1, z0, z1, floorY, ceilH } = o, top = Math.min(1.9, ceilH - .15);
  const cell = Math.max(.06, Math.max(x1 - x0, z1 - z0) / 900);
  const w = Math.ceil((x1 - x0) / cell) + 3, h = Math.ceil((z1 - z0) / cell) + 3, N = w * h, ox = x0 - cell, oz = z0 - cell;
  const walk = new Uint8Array(N), block = new Uint8Array(N), ground = new Float32Array(N);
  for (let i = 0; i < n; i += paso) {
    const p = i * 9, ay = t[p + 1] - floorY, by = t[p + 4] - floorY, cy = t[p + 7] - floorY;
    if (Math.min(ay, by, cy) > top || Math.max(ay, by, cy) < -.3) continue;
    const ax = t[p], az = t[p + 2], ux = t[p + 3] - ax, uz = t[p + 5] - az, uy = by - ay, vx = t[p + 6] - ax, vz = t[p + 8] - az, vy = cy - ay;
    const e = Math.sqrt(Math.max(ux * ux + uz * uz + uy * uy, vx * vx + vz * vz + vy * vy, (ux - vx) ** 2 + (uz - vz) ** 2 + (uy - vy) ** 2));
    const s = Math.min(400, Math.ceil(e / (cell * .6)) + 1), ny = nyOf[i];
    for (let a = 0; a <= s; a++) for (let b = 0; b <= s - a; b++) {
      const fa = a / s, fb = b / s, y = ay + uy * fa + vy * fb, k = Math.floor((ax + ux * fa + vx * fb - ox) / cell) + w * Math.floor((az + uz * fa + vz * fb - oz) / cell);
      if (ny > .7 && y > -.3 && y < .3) { if (!walk[k] || y > ground[k]) ground[k] = y; walk[k] = 1; }
      else if (y >= .3 && y <= top) block[k] = y > 1.25 ? 2 : Math.max(block[k], 1);
    }
  }
  for (let it = 0; it < 4; it++) {
    const add = [];
    for (let z = 1; z < h - 1; z++) for (let x = 1; x < w - 1; x++) {
      const k = x + z * w; if (walk[k] || block[k]) continue; let c = 0, g = 0;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const q = k + a + b * w; if (walk[q]) { c++; g += ground[q]; } }
      if (c >= 4) add.push(k, g / c);
    }
    for (let i = 0; i < add.length; i += 2) { walk[add[i]] = 1; ground[add[i]] = add[i + 1]; }
  }
  const clear = new Float32Array(N), D = cell * Math.SQRT2;
  for (let k = 0; k < N; k++) clear[k] = walk[k] && !block[k] ? 1e6 : 0;
  for (let z = 1; z < h - 1; z++) for (let x = 1; x < w - 1; x++) { const k = x + z * w; if (clear[k]) clear[k] = Math.min(clear[k], clear[k - 1] + cell, clear[k - w] + cell, clear[k - w - 1] + D, clear[k - w + 1] + D); }
  for (let z = h - 2; z > 0; z--) for (let x = w - 2; x > 0; x--) { const k = x + z * w; if (clear[k]) clear[k] = Math.min(clear[k], clear[k + 1] + cell, clear[k + w] + cell, clear[k + w + 1] + D, clear[k + w - 1] + D); }
  const R = .2, comp = new Int32Array(N).fill(-1), Q = new Int32Array(N), four = [1, -1, w, -w];
  let best = -1, bestN = 0, nc = 0;
  for (let k = 0; k < N; k++) {
    if (clear[k] < R || comp[k] >= 0) continue;
    let a = 0, b = 0; Q[b++] = k; comp[k] = nc;
    while (a < b) { const c = Q[a++]; for (const d of four) { const q = c + d; if (q >= 0 && q < N && comp[q] < 0 && clear[q] >= R) { comp[q] = nc; Q[b++] = q; } } }
    if (b > bestN) { bestN = b; best = nc; }
    nc++;
  }
  const free = new Uint8Array(N); let libres = 0;
  for (let k = 0; k < N; k++) if (comp[k] === best && best >= 0) { free[k] = 1; libres++; }
  const res = { w, h, cell, ox, oz, floorY, ceilH, hasCeil: o.hasCeil, block, walk, ground, clear, free, region: new Int16Array(N).fill(-1), rooms: [], libre: libres * cell * cell };
  if (res.libre < 3) return res;

  const region = res.region, seed = new Int32Array(N).fill(-1), rooms = [], minCells = .8 / (cell * cell), umbral = Math.max(.58, cell * 2);
  for (let k = 0; k < N; k++) {
    if (!free[k] || clear[k] < umbral || seed[k] >= 0) continue;
    let a = 0, b = 0, peak = k; Q[b++] = k; seed[k] = -2;
    while (a < b) { const c = Q[a++]; if (clear[c] > clear[peak]) peak = c; for (const d of four) { const q = c + d; if (free[q] && clear[q] >= umbral && seed[q] === -1) { seed[q] = -2; Q[b++] = q; } } }
    if (b >= minCells && rooms.length < 30000) { const id = rooms.length; for (let i = 0; i < b; i++) region[Q[i]] = id; rooms.push({ id, peak, cells: 0 }); }
  }
  if (!rooms.length) { let peak = -1; for (let k = 0; k < N; k++) if (free[k] && (peak < 0 || clear[k] > clear[peak])) peak = k; region[peak] = 0; rooms.push({ id: 0, peak, cells: 0 }); }
  const cubos = [], cab = new Int32Array(61), nivel = k => Math.min(60, Math.round(clear[k] / .04)), mete = k => { const l = nivel(k); (cubos[l] || (cubos[l] = [])).push(k); };
  for (let k = 0; k < N; k++) if (region[k] >= 0) mete(k);
  for (let l = 60; l >= 0;) {
    const c = cubos[l]; if (!c || cab[l] >= c.length) { l--; continue; }
    const k = c[cab[l]++];
    for (const d of four) { const q = k + d; if (q >= 0 && q < N && region[q] < 0 && (walk[q] || block[q])) { region[q] = region[k]; mete(q); const m = nivel(q); if (m > l) l = m; } }
  }
  const padre = rooms.map((_, i) => i), raiz = i => { while (padre[i] !== i) i = padre[i] = padre[padre[i]]; return i; }, contacto = new Map();
  for (let k = 0; k < N - w - 1; k++) {
    const r = region[k]; if (r < 0 || !walk[k] || block[k]) continue;
    for (const q of [k + 1, k + w]) { const s = region[q]; if (s >= 0 && s !== r && walk[q] && !block[q]) { const c = r < s ? r * 65536 + s : s * 65536 + r; contacto.set(c, (contacto.get(c) || 0) + 1); } }
  }
  contacto.forEach((v, c) => { if (v * cell > 1.6) padre[raiz(Math.floor(c / 65536))] = raiz(c % 65536); });
  const uno = [];
  rooms.forEach((r, i) => { const j = raiz(i); if (!uno[j]) uno[j] = { id: 0, peak: r.peak, cells: 0 }; else if (clear[r.peak] > clear[uno[j].peak]) uno[j].peak = r.peak; });
  const fin = uno.filter(Boolean); fin.forEach((r, i) => r.id = i);
  const mapa = rooms.map((_, i) => uno[raiz(i)].id);
  for (let k = 0; k < N; k++) if (region[k] >= 0) { region[k] = mapa[region[k]]; fin[region[k]].cells++; }
  for (const r of fin) { r.area = r.cells * cell * cell; r.x = ox + ((r.peak % w) + .5) * cell; r.z = oz + (Math.floor(r.peak / w) + .5) * cell; }
  res.rooms = fin;
  return res;
}
