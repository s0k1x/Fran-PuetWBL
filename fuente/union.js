/* Unión de escaneos. Corre en un Worker y en Node: no usa nada de fuera.
   Entrada: una lista de triángulos por escaneo, ya en metros y con Y hacia arriba.
   Salida: giro y desplazamiento de cada escaneo para encajarlos en un solo modelo. */
function unirEscaneos(listas, op) {
  op = op || {};
  const RES = op.res || .1, aviso = op.progreso || (() => {});

  function huella(t) {
    /* Suelo: la altura horizontal más baja con superficie suficiente */
    const n = t.length / 9; let y0 = 1e18, y1 = -1e18;
    for (let i = 1; i < t.length; i += 3) { if (t[i] < y0) y0 = t[i]; if (t[i] > y1) y1 = t[i]; }
    const bin = .05, nb = Math.max(2, Math.ceil((y1 - y0) / bin) + 1), hor = new Float64Array(nb), ori = new Float64Array(180);
    for (let i = 0; i < n; i++) {
      const p = i * 9, ax = t[p + 3] - t[p], ay = t[p + 4] - t[p + 1], az = t[p + 5] - t[p + 2], bx = t[p + 6] - t[p], by = t[p + 7] - t[p + 1], bz = t[p + 8] - t[p + 2];
      const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx, len = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1e-12, ny = Math.abs(cy) / len;
      if (ny > .85) hor[Math.min(nb - 1, Math.floor((t[p + 1] - y0) / bin))] += len;
    }
    let mx = 0; for (let i = 0; i < nb; i++) if (hor[i] > mx) mx = hor[i];
    let f = 0; while (f < nb - 1 && hor[f] < mx * .25) f++;
    const suelo = y0 + (f + .5) * bin;
    /* Muros: puntos entre rodilla y cabeza */
    const pts = new Map(), altos = new Map(), piso = new Set(), paso = .05, clave = (x, z) => Math.round(x / paso) * 200003 + Math.round(z / paso);
    for (let i = 0; i < n; i++) {
      const p = i * 9, a = [t[p], t[p + 1] - suelo, t[p + 2]], b = [t[p + 3], t[p + 4] - suelo, t[p + 5]], c = [t[p + 6], t[p + 7] - suelo, t[p + 8]];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0], l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1e-12, vert = Math.abs(ny) / l;
      const lo = Math.min(a[1], b[1], c[1]), hi = Math.max(a[1], b[1], c[1]);
      if (vert < .3 && hi > .5 && lo < 1.9) {
        const e = Math.max(Math.hypot(...u), Math.hypot(...v)), s = Math.min(300, Math.ceil(e / paso) + 1);
        if (Math.hypot(nx, nz) / l > .7) { const ang = ((Math.atan2(nz, nx) * 180 / Math.PI) % 90 + 90) % 90; ori[Math.floor(ang)] += l; }
        for (let i2 = 0; i2 <= s; i2++) for (let j = 0; j <= s - i2; j++) {
          const fa = i2 / s, fb = j / s, y = a[1] + u[1] * fa + v[1] * fb; if (y < .5 || y > 1.9) continue;
          const x = a[0] + u[0] * fa + v[0] * fb, z = a[2] + u[2] * fa + v[2] * fb, k = clave(x, z); if (!pts.has(k)) pts.set(k, [x, z]); if (y > 1.3 && !altos.has(k)) altos.set(k, [x, z]);
        }
      } else if (vert > .8 && Math.abs(lo) < .25 && Math.abs(hi) < .25) {
        const e = Math.max(Math.hypot(...u), Math.hypot(...v)), s = Math.min(300, Math.ceil(e / .1) + 1);
        for (let i2 = 0; i2 <= s; i2++) for (let j = 0; j <= s - i2; j++) { const fa = i2 / s, fb = j / s; piso.add(clave(a[0] + u[0] * fa + v[0] * fb, a[2] + u[2] * fa + v[2] * fb)); }
      }
    }
    const muro = new Float32Array(pts.size * 2); let m = 0; pts.forEach(q => { muro[m++] = q[0]; muro[m++] = q[1]; });
    const alto = new Float32Array(altos.size * 2); m = 0; altos.forEach(q => { alto[m++] = q[0]; alto[m++] = q[1]; });
    const pisoP = new Float32Array(piso.size * 2); m = 0; piso.forEach(k => { const zr = ((k % 200003) + 200003 + 100001) % 200003 - 100001, xr = Math.round((k - zr) / 200003); pisoP[m++] = xr * paso; pisoP[m++] = zr * paso; });
    /* Dirección dominante de las paredes */
    let bestA = 0, bestV = -1; for (let a = 0; a < 90; a++) { let s = 0; for (let d = -3; d <= 3; d++) s += ori[(a + d + 90) % 90]; if (s > bestV) { bestV = s; bestA = a; } }
    const unico = new Set(); for (let i = 0; i < pisoP.length; i += 2) unico.add(Math.round(pisoP[i] / .1) * 100003 + Math.round(pisoP[i + 1] / .1));
    return { muro, alto, piso: pisoP, suelo, dir: (bestA + .5) * Math.PI / 180, area: unico.size * .01 };
  }

  const resumen = P => { const paso = Math.max(1, Math.ceil(P.length / 2 / 2500)), o = new Float32Array(Math.ceil(P.length / 2 / paso) * 2); let m = 0; for (let i = 0; i < P.length; i += 2 * paso) { o[m++] = P[i]; o[m++] = P[i + 1]; } return o.slice(0, m); };
  const gira = (P, c, s, tx, tz) => { const o = new Float32Array(P.length); for (let i = 0; i < P.length; i += 2) { o[i] = c * P[i] - s * P[i + 1] + tx; o[i + 1] = s * P[i] + c * P[i + 1] + tz; } return o; };
  function caja(P) { let a = 1e18, b = 1e18, c = -1e18, d = -1e18; for (let i = 0; i < P.length; i += 2) { if (P[i] < a) a = P[i]; if (P[i] > c) c = P[i]; if (P[i + 1] < b) b = P[i + 1]; if (P[i + 1] > d) d = P[i + 1]; } return [a, b, c, d]; }

  function fft(re, im, N, inv) {
    for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let l = 2; l <= N; l <<= 1) {
      const an = (inv ? 2 : -2) * Math.PI / l, wr = Math.cos(an), wi = Math.sin(an);
      for (let i = 0; i < N; i += l) { let cr = 1, ci = 0; for (let k = 0; k < l / 2; k++) { const u = i + k, v = u + l / 2, xr = re[v] * cr - im[v] * ci, xi = re[v] * ci + im[v] * cr; re[v] = re[u] - xr; im[v] = im[u] - xi; re[u] += xr; im[u] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
    }
    if (inv) for (let i = 0; i < N; i++) { re[i] /= N; im[i] /= N; }
  }
  function fft2(re, im, N, inv) {
    const fr = new Float64Array(N), fi = new Float64Array(N);
    for (let y = 0; y < N; y++) { for (let x = 0; x < N; x++) { fr[x] = re[x + y * N]; fi[x] = im[x + y * N]; } fft(fr, fi, N, inv); for (let x = 0; x < N; x++) { re[x + y * N] = fr[x]; im[x + y * N] = fi[x]; } }
    for (let x = 0; x < N; x++) { for (let y = 0; y < N; y++) { fr[y] = re[x + y * N]; fi[y] = im[x + y * N]; } fft(fr, fi, N, inv); for (let y = 0; y < N; y++) { re[x + y * N] = fr[y]; im[x + y * N] = fi[y]; } }
  }
  function rejilla(P, q, N, ox, oz) {
    const g = new Float64Array(N * N);
    for (let i = 0; i < P.length; i += 2) {
      const x = Math.floor((P[i] - ox) / q), z = Math.floor((P[i + 1] - oz) / q);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const u = x + a, v = z + b; if (u >= 0 && v >= 0 && u < N && v < N) g[u + v * N] = Math.max(g[u + v * N], a || b ? .5 : 1); }
    }
    return g;
  }
  /* Campo de distancia del conjunto ya unido, para puntuar y refinar */
  function campo(P, Q) {
    const [a, b, c, d] = caja(P), m = 1, w = Math.ceil((c - a + m * 2) / RES), h = Math.ceil((d - b + m * 2) / RES), ox = a - m, oz = b - m;
    const D = new Float32Array(w * h).fill(1e3), S = new Uint8Array(w * h);
    for (let i = 0; i < P.length; i += 2) D[Math.floor((P[i] - ox) / RES) + Math.floor((P[i + 1] - oz) / RES) * w] = 0;
    for (let i = 0; i < Q.length; i += 2) { const x = Math.floor((Q[i] - ox) / RES), z = Math.floor((Q[i + 1] - oz) / RES); if (x >= 0 && z >= 0 && x < w && z < h) S[x + z * w] = 1; }
    const R2 = RES * Math.SQRT2;
    for (let z = 1; z < h - 1; z++) for (let x = 1; x < w - 1; x++) { const k = x + z * w; D[k] = Math.min(D[k], D[k - 1] + RES, D[k - w] + RES, D[k - w - 1] + R2, D[k - w + 1] + R2); }
    for (let z = h - 2; z > 0; z--) for (let x = w - 2; x > 0; x--) { const k = x + z * w; D[k] = Math.min(D[k], D[k + 1] + RES, D[k + w] + RES, D[k + w + 1] + R2, D[k + w - 1] + R2); }
    return { D, S, w, h, ox, oz };
  }
  function puntua(C, P, tx, tz, c, s) {
    let toca = 0, conflicto = 0, dentro = 0; const paso = Math.max(2, 2 * Math.floor(P.length / 2 / 4000));
    for (let i = 0; i < P.length; i += paso) {
      const x = c * P[i] - s * P[i + 1] + tx, z = s * P[i] + c * P[i + 1] + tz, u = Math.floor((x - C.ox) / RES), v = Math.floor((z - C.oz) / RES);
      if (u < 0 || v < 0 || u >= C.w || v >= C.h) continue;
      const k = u + v * C.w, d = C.D[k]; dentro++;
      if (d < .16) toca++; else if (C.S[k] && d > .35) conflicto++;
    }
    return { toca, conflicto, dentro, total: P.length / 2, muestra: P.length / paso };
  }
  /* Superficie de suelo compartida: sin ella, dos estancias vecinas parecen encajar pared con pared */
  function solapeSuelo(C, Q, tx, tz, c, s) {
    let si = 0, no = 0; const paso = Math.max(2, 2 * Math.floor(Q.length / 2 / 3000));
    for (let i = 0; i < Q.length; i += paso) { const x = c * Q[i] - s * Q[i + 1] + tx, z = s * Q[i] + c * Q[i + 1] + tz, u = Math.floor((x - C.ox) / RES), v = Math.floor((z - C.oz) / RES); if (u >= 0 && v >= 0 && u < C.w && v < C.h && C.S[u + v * C.w]) si++; else no++; }
    return si / Math.max(1, si + no);
  }
  const nota = (r) => r.toca - 2.5 * r.conflicto;
  /* Nota completa: coincidencia de muros, suelo compartido y ningún muro cruzando suelo libre en ninguno de los dos sentidos */
  function notaFinal(C, base, baseSuelo, otro, p) {
    const c = Math.cos(p.th), s = Math.sin(p.th), a = puntua(C, otro.muro, p.tx, p.tz, c, s), ov = solapeSuelo(C, otro.piso, p.tx, p.tz, c, s) * otro.area;
    if (ov < 1.2) return -1;
    const C2 = campo(gira(otro.muro, c, s, p.tx, p.tz), gira(otro.piso, c, s, p.tx, p.tz)), b = puntua(C2, base, 0, 0, 1, 0), cob = a.toca / Math.max(1, a.toca + a.conflicto), cob2 = b.toca / Math.max(1, b.toca + b.conflicto);
    const metros = (a.toca * a.total / Math.max(1, a.muestra) + b.toca * b.total / Math.max(1, b.muestra)) * .05 / 2;
    return metros * Math.pow(cob * cob2, 8) * (a.toca + b.toca) / Math.max(1, a.dentro + b.dentro);
  }

  function encaja(base, baseSuelo, otro) {
    const C = campo(base, baseSuelo), cb = caja(base);
    const prob = [];
    const dirs = []; const dif = op.dirBase - otro.dir;
    for (let k = 0; k < 4; k++) dirs.push(dif + k * Math.PI / 2);
    const prueba = lista => {
      for (const th of lista) {
        const c = Math.cos(th), s = Math.sin(th), P = gira(otro.muro, c, s, 0, 0), cp = caja(P);
        const q = RES * 2, lado = Math.max(cb[2] - cb[0], cb[3] - cb[1]) + Math.max(cp[2] - cp[0], cp[3] - cp[1]) + 2; let N = 64; while (N * q < lado) N *= 2;
        const A = rejilla(base, q, N, cb[0], cb[1]), B = rejilla(P, q, N, cp[0], cp[1]), Ai = new Float64Array(N * N), Bi = new Float64Array(N * N);
        fft2(A, Ai, N); fft2(B, Bi, N);
        for (let i = 0; i < N * N; i++) { const r = A[i] * B[i] + Ai[i] * Bi[i], m = Ai[i] * B[i] - A[i] * Bi[i]; A[i] = r; Ai[i] = m; }
        fft2(A, Ai, N, true);
        /* Varias cimas: paredes repetidas dan coincidencias falsas */
        const cimas = []; let vm = 0; for (let k = 0; k < N * N; k++) if (A[k] > vm) vm = A[k];
        for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
          const k = x + z * N, v = A[k]; if (v < vm * .12) continue;
          const l = A[((x + N - 1) % N) + z * N], r = A[((x + 1) % N) + z * N], u = A[x + ((z + N - 1) % N) * N], d = A[x + ((z + 1) % N) * N];
          if (v >= l && v >= r && v >= u && v >= d) cimas.push({ v, x, z });
        }
        cimas.sort((a, b) => b.v - a.v);
        for (const m of cimas.slice(0, 900)) {
          const dx = (m.x > N / 2 ? m.x - N : m.x) * q + cb[0] - cp[0], dz = (m.z > N / 2 ? m.z - N : m.z) * q + cb[1] - cp[1];
          if (solapeSuelo(C, otro.piso, dx, dz, c, s) * otro.area < 1.2) continue;
          const r = puntua(C, otro.muro, dx, dz, c, s);
          prob.push({ th, tx: dx, tz: dz, v: (r.toca - 2.5 * r.conflicto) / (r.dentro + 40), r });
        }
      }
    };
    prueba(dirs);
    prob.sort((a, b) => b.v - a.v);
    if (!prob.slice(0, 60).some(p => notaFinal(C, base, baseSuelo, otro, p) > 3)) { const l = []; for (let a = 0; a < 360; a += 10) l.push(a * Math.PI / 180); prueba(l); prob.sort((a, b) => b.v - a.v); }
    if (!prob.length) return { th: 0, tx: 0, tz: 0, v: -1 };
    /* Refinado de las mejores: gradiente sobre el campo de distancia */
    const fino = p => {
      let { th, tx, tz } = p, mej = -1e9, paso = .08, pa = .012;
      for (let it = 0; it < 26; it++) {
        const c0 = Math.cos(th), s0 = Math.sin(th); let mejora = false;
        for (const [a, b, d] of [[0, 0, 0], [paso, 0, 0], [-paso, 0, 0], [0, paso, 0], [0, -paso, 0], [0, 0, pa], [0, 0, -pa]]) {
          const t2 = th + d, c = d ? Math.cos(t2) : c0, s = d ? Math.sin(t2) : s0, r = puntua(C, otro.muro, tx + a, tz + b, c, s), v = nota(r, base.length / 2);
          if (v > mej + 1e-6) { mej = v; if (a || b || d) { tx += a; tz += b; th = t2; mejora = true; break; } }
        }
        if (!mejora) { paso *= .6; pa *= .6; }
      }
      return { th, tx, tz, v: mej };
    };
    if (op.verdad) { const v = op.verdad(otro.i); console.log("  verdad zona", otro.i, "nota", notaFinal(C, base, baseSuelo, otro, v).toFixed(2), "muros", JSON.stringify(puntua(C, otro.muro, v.tx, v.tz, Math.cos(v.th), Math.sin(v.th))), "ov", (solapeSuelo(C, otro.piso, v.tx, v.tz, Math.cos(v.th), Math.sin(v.th)) * otro.area).toFixed(1), "area", otro.area.toFixed(0)); }
    /* Todas las candidatas pasan por la nota completa y las mejores se refinan */
    const lista = prob.slice(0, 260).map(p => ({ ...p, f: notaFinal(C, base, baseSuelo, otro, p) })).sort((a, b) => b.f - a.f).slice(0, 8);
    const fin = lista.map(p => { const q = fino(p); q.v = notaFinal(C, base, baseSuelo, otro, q); return q; }).sort((a, b) => b.v - a.v);
    if (op.verdad) { const v = op.verdad(otro.i), dd = p => Math.hypot(p.tx - v.tx, p.tz - v.tz).toFixed(2) + "/" + Math.abs(Math.sin(p.th - v.th)).toFixed(2); const cerca = prob.filter(p => Math.hypot(p.tx - v.tx, p.tz - v.tz) < .5 && Math.abs(Math.sin(p.th - v.th)) < .05); const dbg = p => { const c0 = Math.cos(p.th), s0 = Math.sin(p.th), a = puntua(C, otro.muro, p.tx, p.tz, c0, s0), C2 = campo(gira(otro.muro, c0, s0, p.tx, p.tz), gira(otro.piso, c0, s0, p.tx, p.tz)), b = puntua(C2, base, 0, 0, 1, 0); return [a.toca, a.conflicto, a.dentro, b.toca, b.conflicto, b.dentro].join(","); }; console.log("   verdad", dbg(v), "elegida", fin[0] ? dbg(fin[0]) : ""); console.log("   cand", prob.length, "cerca verdad", cerca.length, cerca[0] ? "pos " + prob.indexOf(cerca[0]) : "", "elegida", (fin[0] || {}).v, dd(fin[0] || { tx: 0, tz: 0, th: 0 })); }
    return fin[0] || { th: 0, tx: 0, tz: 0, v: -1 };
  }

  /* Con plano: cada escaneo se encaja por separado contra los muros dibujados, sin necesitar solape */
  function conPlano(H, pl) {
    const { ink, w, h } = pl, D = new Float32Array(w * h), R2 = Math.SQRT2;
    for (let k = 0; k < w * h; k++) D[k] = ink[k] ? 0 : 1e6;
    for (let z = 1; z < h - 1; z++) for (let x = 1; x < w - 1; x++) { const k = x + z * w; if (D[k]) D[k] = Math.min(D[k], D[k - 1] + 1, D[k - w] + 1, D[k - w - 1] + R2, D[k - w + 1] + R2); }
    for (let z = h - 2; z > 0; z--) for (let x = w - 2; x > 0; x--) { const k = x + z * w; if (D[k]) D[k] = Math.min(D[k], D[k + 1] + 1, D[k + w] + 1, D[k + w + 1] + R2, D[k + w - 1] + R2); }
    const nota2 = (P, mpp, tx, tz, c, s) => {
      let si = 0, n = 0; const paso = Math.max(2, 2 * Math.floor(P.length / 2 / 3000));
      for (let i = 0; i < P.length; i += paso) { n++; const u = Math.floor((c * P[i] - s * P[i + 1] + tx) / mpp), v = Math.floor((s * P[i] + c * P[i + 1] + tz) / mpp); if (u < 0 || v < 0 || u >= w || v >= h) continue; if (D[u + v * w] * mpp < .14) si++; }
      return si / Math.max(1, n);
    };
    /* Distancia al borde del muro: los escaneos ven la cara de la pared, y eso afina posición y escala */
    const E = new Float32Array(w * h).fill(1e6);
    for (let z = 1; z < h - 1; z++) for (let x = 1; x < w - 1; x++) { const k = x + z * w; if (ink[k] !== ink[k + 1] || ink[k] !== ink[k + w]) E[k] = 0; }
    for (let z = 1; z < h - 1; z++) for (let x = 1; x < w - 1; x++) { const k = x + z * w; E[k] = Math.min(E[k], E[k - 1] + 1, E[k - w] + 1, E[k - w - 1] + R2, E[k - w + 1] + R2); }
    for (let z = h - 2; z > 0; z--) for (let x = w - 2; x > 0; x--) { const k = x + z * w; E[k] = Math.min(E[k], E[k + 1] + 1, E[k + w] + 1, E[k + w + 1] + R2, E[k + w - 1] + R2); }
    const borde = (P, mpp, tx, tz, c, s) => {
      let t = 0, n = 0; const paso = Math.max(2, 2 * Math.floor(P.length / 2 / 3000));
      for (let i = 0; i < P.length; i += paso) { n++; const u = Math.floor((c * P[i] - s * P[i + 1] + tx) / mpp), v = Math.floor((s * P[i] + c * P[i + 1] + tz) / mpp); if (u < 0 || v < 0 || u >= w || v >= h) continue; t += Math.exp(-((E[u + v * w] * mpp / .07) ** 2)); }
      return t / Math.max(1, n);
    };
    function afina(o, mpp, r) {
      const P = o.alto.length > 200 ? o.alto : o.muro; let { th, tx, tz } = r, v = borde(P, mpp, tx, tz, Math.cos(th), Math.sin(th)), pa = .06, pr = .008;
      for (let it = 0; it < 60; it++) { let mejora = false; for (const [a, b, d] of [[pa, 0, 0], [-pa, 0, 0], [0, pa, 0], [0, -pa, 0], [0, 0, pr], [0, 0, -pr]]) { const t2 = th + d, q = borde(P, mpp, tx + a, tz + b, Math.cos(t2), Math.sin(t2)); if (q > v + 1e-5) { v = q; tx += a; tz += b; th = t2; mejora = true; break; } } if (!mejora) { pa *= .6; pr *= .6; if (pa < .004) break; } }
      return { ...r, th, tx, tz, b: v };
    }
    function busca(o, mpp, top) {
      const q = .2, P0 = o.alto.length > 200 ? o.alto : o.muro, Lm = Math.max(w, h) * mpp, cand = []; let N = 64; while (N * q < Lm + 30) N *= 2;
      const A = new Float64Array(N * N), Ai0 = new Float64Array(N * N), paso = Math.max(1, Math.round(q / mpp / 2));
      for (let z = 0; z < h; z += paso) for (let x = 0; x < w; x += paso) if (ink[x + z * w]) { const u = Math.floor(x * mpp / q), v = Math.floor(z * mpp / q); if (u < N && v < N) A[u + v * N] = 1; }
      fft2(A, Ai0, N);
      for (let k = 0; k < 4; k++) {
        const th = -o.dir + k * Math.PI / 2, c = Math.cos(th), s = Math.sin(th), P = gira(P0, c, s, 0, 0), cp = caja(P), B = rejilla(P, q, N, cp[0], cp[1]), Bi = new Float64Array(N * N), Cr = new Float64Array(N * N), Ci = new Float64Array(N * N);
        fft2(B, Bi, N);
        for (let i = 0; i < N * N; i++) { Cr[i] = A[i] * B[i] + Ai0[i] * Bi[i]; Ci[i] = Ai0[i] * B[i] - A[i] * Bi[i]; }
        fft2(Cr, Ci, N, true);
        const cimas = []; let vm = 0; for (let i = 0; i < N * N; i++) if (Cr[i] > vm) vm = Cr[i];
        for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const v = Cr[x + z * N]; if (v < vm * .2) continue; if (v >= Cr[((x + N - 1) % N) + z * N] && v >= Cr[((x + 1) % N) + z * N] && v >= Cr[x + ((z + N - 1) % N) * N] && v >= Cr[x + ((z + 1) % N) * N]) cimas.push({ v, x, z }); }
        cimas.sort((a, b) => b.v - a.v);
        for (const m of cimas.slice(0, 400)) { const tx = (m.x > N / 2 ? m.x - N : m.x) * q - cp[0], tz = (m.z > N / 2 ? m.z - N : m.z) * q - cp[1]; cand.push({ th, tx, tz, v: nota2(P0, mpp, tx, tz, c, s) }); }
      }
      cand.sort((a, b) => b.v - a.v);
      return cand.slice(0, top).map(p => {
        let { th, tx, tz, v } = p, pa = .1, pr = .015;
        for (let it = 0; it < 40; it++) { let mejora = false; for (const [a, b, d] of [[pa, 0, 0], [-pa, 0, 0], [0, pa, 0], [0, -pa, 0], [0, 0, pr], [0, 0, -pr]]) { const t2 = th + d, r = nota2(P0, mpp, tx + a, tz + b, Math.cos(t2), Math.sin(t2)); if (r > v + 1e-5) { v = r; tx += a; tz += b; th = t2; mejora = true; break; } } if (!mejora) { pa *= .6; pr *= .6; if (pa < .01) break; } }
        return { th, tx, tz, v };
      }).sort((a, b) => b.v - a.v);
    }
    /* Escala: la que mejor mete los dos escaneos mayores dentro de los muros */
    const orden = H.map((o, i) => i).sort((a, b) => H[b].muro.length - H[a].muro.length), guia = orden.slice(0, 2);
    let mpp = pl.mpp;
    if (!pl.escalaSegura) {
      let mej = -1, sel = mpp;
      for (let f = .7; f <= 1.42; f *= 1.04) { aviso(`Buscando la escala del plano ${Math.round((f - .7) / .72 * 100)} %`); const m = pl.mpp * f; let t = 0; for (const i of guia) t += busca(H[i], m, 2)[0].v; if (t > mej) { mej = t; sel = m; } }
      mej = -1; const c0 = sel; for (let f = .97; f <= 1.031; f += .01) { const m = c0 * f; let t = 0; for (const i of guia) t += busca(H[i], m, 2)[0].v; if (t > mej) { mej = t; sel = m; } }
      mpp = sel;
      /* Último ajuste de escala con el borde de los muros */
      const ini = guia.map(i => [i, busca(H[i], mpp, 3)[0]]); let mb = -1, ms = mpp;
      for (let f = .985; f <= 1.0151; f += .0025) { const m = mpp * f; let t = 0; for (const [i, r] of ini) { const k = m / mpp; t += afina(H[i], m, { ...r, tx: r.tx * k, tz: r.tz * k }).b; } if (t > mb) { mb = t; ms = m; } }
      mpp = ms;
    }
    return { mpp, piezas: H.map((o, i) => { aviso(`Encajando ${i + 1} de ${H.length} en el plano`); const r = afina(o, mpp, busca(o, mpp, 6)[0]); return { th: r.th, tx: r.tx, tz: r.tz, dy: H[0].suelo - o.suelo, nota: +r.v.toFixed(2), encajado: r.v >= (op.minimoPlano || .55), puntos: o.muro.length / 2, pts: resumen(o.muro) }; }) };
  }

  aviso("Analizando los escaneos");
  const H = listas.map(huella), n = H.length; H.forEach((h, i) => h.i = i);
  if (op.plano) return conPlano(H, op.plano);
  const orden = H.map((h, i) => i).sort((a, b) => H[b].muro.length - H[a].muro.length), ini = orden[0];
  const res = H.map(() => null); res[ini] = { th: 0, tx: 0, tz: 0, v: 9, encajado: true };
  let unido = H[ini].muro.slice(), piso = H[ini].piso.slice(); op.dirBase = H[ini].dir;
  const queda = new Set(orden.slice(1));
  while (queda.size) {
    aviso(`Encajando ${n - queda.size} de ${n}`);
    let mejor = null, id = -1;
    for (const i of queda) { const r = encaja(unido, piso, H[i]); if (!mejor || r.v > mejor.v) { mejor = r; id = i; } }
    queda.delete(id); const ok = mejor.v >= (op.minimo || 3); res[id] = { ...mejor, encajado: ok };
    if (ok) {
      const c = Math.cos(mejor.th), s = Math.sin(mejor.th), a = gira(H[id].muro, c, s, mejor.tx, mejor.tz), b = gira(H[id].piso, c, s, mejor.tx, mejor.tz), u = new Float32Array(unido.length + a.length), p = new Float32Array(piso.length + b.length);
      u.set(unido); u.set(a, unido.length); p.set(piso); p.set(b, piso.length); unido = u; piso = p;
    } else {
      /* Sin solape claro: se deja al lado para colocarlo a mano */
      const cu = caja(unido), cb = caja(H[id].muro); res[id].th = 0; res[id].tx = cu[2] + 1.5 - cb[0]; res[id].tz = cu[1] - cb[1];
    }
  }
  return H.map((h, i) => ({ th: res[i].th, tx: res[i].tx, tz: res[i].tz, dy: H[ini].suelo - h.suelo, nota: +res[i].v.toFixed(2), encajado: res[i].encajado, puntos: h.muro.length / 2, pts: resumen(h.muro) }));
}
if (typeof module !== "undefined") module.exports = { unirEscaneos };
