/* Casa de muestra: una vivienda en torno a un patio. Todo son cajas alineadas a los ejes,
   así el horneado de luz y la página parten exactamente de la misma geometría. */
function crearCasa() {
  const H = 3, T = .18, cajas = [], vidrios = [], curvos = [];
  const MATS = {
    yeso:    { al: [.80, .79, .76], d: 11, uv: 2 },
    techo:   { al: [.84, .84, .82], d: 7, uv: 2 },
    roble:   { al: [.40, .26, .155], d: 26, uv: 2.4 },
    robleM:  { al: [.40, .26, .155], d: 16, uv: 2.4 },
    traver:  { al: [.68, .62, .54], d: 18, uv: 2.4 },
    suelob:  { al: [.60, .56, .50], d: 24, uv: 2.4 },
    grava:   { al: [.60, .58, .55], d: 22, uv: 1.6 },
    negro:   { al: [.035, .035, .035], d: 14 },
    lino:    { al: [.66, .62, .55], d: 18, uv: 1.2 },
    sofa:    { al: [.40, .37, .32], d: 18, uv: 1.2 },
    lino2:   { al: [.20, .20, .19], d: 18, uv: 1.2 },
    blanco:  { al: [.86, .86, .84], d: 18 },
    agua:    { al: [.03, .05, .06], d: 18 },
    espejo:  { al: [.55, .60, .62], d: 10 },
    arte:    { al: [.72, .68, .60], d: 14 },
    luz:     { al: [.9, .9, .9], em: [5, 4.4, 3.6], d: 12 },
    fuera:   { al: [.86, .86, .84], d: .7 }
  };
  const c = (x0, y0, z0, x1, y1, z1, m, op) => cajas.push({ a: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], b: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)], m, ...(op || {}) });
  /* Muro con huecos: {a, b, y0, y1, v} desde el origen del muro; v = acristalado */
  function muro(x0, z0, x1, z1, huecos = []) {
    const hz = z0 === z1, L = hz ? x1 - x0 : z1 - z0, t = T / 2;
    const p = (a, b, y0, y1, m, g = t) => hz ? c(x0 + a, y0, z0 - g, x0 + b, y1, z0 + g, m) : c(x0 - g, y0, z0 + a, x0 + g, y1, z0 + b, m);
    let cur = -t;
    for (const h of huecos) {
      const y0 = h.y0 || 0, y1 = h.y1 || 2.72;
      p(cur, h.a, 0, H, "yeso");
      if (y0) p(h.a, h.b, 0, y0, "yeso");
      p(h.a, h.b, y1, H, "yeso");
      if (h.v) {
        const pv = hz ? [x0 + h.a, y0, z0 - .008, x0 + h.b, y1, z0 + .008] : [x0 - .008, y0, z0 + h.a, x0 + .008, y1, z0 + h.b];
        vidrios.push({ a: pv.slice(0, 3), b: pv.slice(3) });
        const g = .03, b = .02;
        p(h.a, h.a + b * 2, y0, y1, "negro", g); p(h.b - b * 2, h.b, y0, y1, "negro", g);
        p(h.a, h.b, y1 - b * 2, y1, "negro", g); p(h.a, h.b, y0, y0 + b * 2, "negro", g);
        const n = Math.max(0, Math.round((h.b - h.a) / 1.9) - 1);
        for (let i = 1; i <= n; i++) { const m = h.a + (h.b - h.a) * i / (n + 1); p(m - b, m + b, y0, y1, "negro", g); }
      }
      cur = h.b;
    }
    p(cur, L + t, 0, H, "yeso");
  }

  /* Exterior y suelos */
  c(-44, -.6, -44, 60, -.03, 57, "fuera", { suelo: true });
  c(0, -.2, 0, 6, 0, 13, "roble");
  c(6, -.2, 0, 16, 0, 4, "roble");
  c(10.5, -.2, 4, 16, 0, 9.5, "roble");
  c(6, -.2, 8, 10.5, 0, 9.5, "roble");
  c(6, -.2, 9.5, 7, 0, 13, "roble");
  c(10, -.2, 9.5, 10.5, 0, 13, "roble");
  c(10.5, -.2, 9.5, 16, 0, 13, "roble");
  c(7, -.2, 9.5, 10, 0, 13, "suelob");
  c(6, -.2, 4, 10.5, 0, 8, "grava");

  /* Muros */
  muro(0, 0, 16, 0, [{ a: .7, b: 5.3, v: 1 }, { a: 7, b: 15, v: 1 }]);
  muro(0, 0, 0, 13, [{ a: 5.3, b: 7.2, v: 1 }]);
  muro(0, 13, 16, 13, [{ a: 1, b: 5, v: 1 }, { a: 8, b: 9, y0: 1.95, y1: 2.65, v: 1 }, { a: 11, b: 15, v: 1 }]);
  muro(16, 0, 16, 13, [{ a: 5, b: 7, v: 1 }]);
  muro(6, 0, 6, 8, [{ a: 1.45, b: 2.55 }, { a: 4.2, b: 5.5, v: 1 }, { a: 5.5, b: 6.6 }, { a: 6.6, b: 7.9, v: 1 }]);
  muro(6, 4, 16, 4, [{ a: .2, b: 4.3, v: 1 }, { a: 7, b: 7.95 }]);
  muro(10.5, 4, 10.5, 8, [{ a: .3, b: 3.7, v: 1 }]);
  muro(0, 8, 16, 8, [{ a: 2.5, b: 3.6 }, { a: 6.2, b: 7.7, v: 1 }, { a: 7.7, b: 8.8 }, { a: 8.8, b: 10.3, v: 1 }, { a: 13, b: 13.95 }]);
  muro(0, 9.5, 16, 9.5, [{ a: 3, b: 3.95 }, { a: 8.05, b: 8.95 }, { a: 12.5, b: 13.45 }]);
  muro(7, 9.5, 7, 13); muro(10, 9.5, 10, 13);

  /* Cubierta alrededor del patio */
  c(-.09, H, -.09, 16.09, H + .3, 4, "techo"); c(-.09, H, 4, 6, H + .3, 8, "techo");
  c(10.5, H, 4, 16.09, H + .3, 8, "techo"); c(-.09, H, 8, 16.09, H + .3, 13.09, "techo");

  /* Salón */
  c(1, 0, 2, 4.8, .012, 5.4, "lino");
  c(1.3, 0, 4.6, 4.1, .1, 5.5, "negro");
  c(1.2, .1, 4.5, 4.2, .3, 5.6, "sofa");
  [[1.21, 2.2], [2.204, 3.2], [3.204, 4.19]].forEach(([a, b]) => { c(a, .3, 4.51, b, .45, 5.33, "sofa"); c(a, .3, 5.334, b, .8, 5.59, "sofa"); });
  c(3.3, .1, 3.6, 4.2, .3, 4.5, "sofa"); c(3.32, .3, 3.62, 4.18, .45, 4.5, "sofa");
  c(1.9, 0, 3, 2.9, .3, 3.7, "traver");
  c(4.7, .08, 2.6, 5.4, .42, 3.3, "lino2"); c(5.2, .42, 2.6, 5.4, .74, 3.3, "lino2"); c(4.8, 0, 2.7, 5.3, .08, 3.2, "negro");
  c(.09, 0, 1.4, .52, H, 4.2, "traver");
  c(.5, .32, 2.3, .53, .92, 3.3, "negro");
  c(3.95, .85, 7.86, 5.75, 2.35, 7.91, "arte", { tex: 0 });

  /* Cocina y comedor */
  c(15.25, 0, .09, 15.91, 2.72, 3.91, "robleM");
  c(11.2, 0, 1.55, 14.2, .92, 2.45, "traver");
  c(7.4, .72, 1.6, 9.7, .76, 2.4, "robleM");
  c(7.6, 0, 1.75, 7.68, .72, 2.25, "negro"); c(9.42, 0, 1.75, 9.5, .72, 2.25, "negro");
  c(8.5, 2.1, 1.98, 8.515, H, 2.02, "negro"); // cable lámpara
  curvos.push({ t: "esfera", p: [8.5, 2.02, 2], r: .14 });

  /* Estudio */
  c(10.85, .71, 4.7, 11.6, .75, 7.3, "robleM");
  c(10.9, 0, 4.8, 10.96, .71, 4.86, "negro"); c(11.5, 0, 4.8, 11.56, .71, 4.86, "negro");
  c(10.9, 0, 7.14, 10.96, .71, 7.2, "negro"); c(11.5, 0, 7.14, 11.56, .71, 7.2, "negro");
  c(11.8, .42, 5.72, 12.26, .47, 6.18, "lino2"); c(12.22, .47, 5.72, 12.26, .84, 6.18, "lino2"); c(12, 0, 5.92, 12.06, .42, 5.98, "negro");
  c(15.35, 0, 4.1, 15.91, .72, 4.9, "robleM");

  /* Galería */
  c(1.2, H - .012, 8.7, 14.8, H, 8.8, "luz");
  [[4.7, 1], [6.3, 2], [10.1, 1]].forEach(([x, i]) => c(x, 1, 9.36, x + .9, 2.2, 9.41, "arte", { tex: i }));

  /* Dormitorio */
  c(.09, 0, 9.6, .2, 1.15, 12.9, "robleM");
  c(.2, 0, 10.2, 2.4, .26, 12, "robleM");
  c(.25, .26, 10.25, 2.35, .5, 11.95, "blanco");
  c(1.5, .5, 10.22, 2.37, .54, 11.98, "lino2");
  c(.2, .5, 10.4, .62, .62, 11.05, "lino"); c(.2, .5, 11.15, .62, .62, 11.8, "lino");
  c(.2, .3, 9.68, .68, .34, 10.1, "robleM"); c(.2, .3, 12.1, .68, .34, 12.52, "robleM");
  c(5.3, 0, 9.59, 6.91, 2.72, 12.91, "robleM");

  /* Baño */
  c(7.09, 0, 11.85, 9.91, .56, 12.91, "traver");
  c(7.3, .4, 12.05, 9.7, .562, 12.72, "blanco");
  c(9.42, .58, 10.05, 9.91, .86, 11.45, "traver");
  c(9.88, 1.1, 10.1, 9.91, 2.15, 11.4, "espejo", { refleja: true });
  c(7.09, .26, 10.3, 7.62, .46, 10.76, "blanco");

  /* Invitados */
  c(13.7, 0, 10.4, 15.91, .26, 12.1, "robleM");
  c(13.75, .26, 10.45, 15.91, .5, 12.05, "lino");
  c(15.8, 0, 9.6, 15.91, 1.15, 12.9, "robleM");
  c(10.5, .3, 10.2, 10.95, .34, 12.1, "robleM");
  c(10.55, 0, 10.3, 10.6, .3, 10.36, "negro"); c(10.55, 0, 11.94, 10.6, .3, 12, "negro");

  /* Patio */
  c(7.1, 0, 6.15, 10.1, .36, 7.4, "suelob");
  c(7.25, .36, 6.3, 9.95, .365, 7.25, "agua");
  c(6.9, 0, 4.8, 7.9, .52, 5.7, "suelob", { oculto: true });
  curvos.push({ t: "roca", p: [7.4, .28, 5.25], r: .62 });

  return {
    H, cajas, vidrios, curvos, MATS,
    sol: [-.42, .62, -.66],
    salas: [
      { name: "Salón", x: 2, z: 1 }, { name: "Cocina", x: 10.3, z: .8 }, { name: "Galería", x: 8, z: 8.75 }, { name: "Galería", x: 3, z: 8.75 }, { name: "Galería", x: 14, z: 8.75 },
      { name: "Patio", x: 9, z: 5 }, { name: "Estudio", x: 14, z: 6 }, { name: "Dormitorio", x: 3.5, z: 11.5 }, { name: "Baño", x: 8.5, z: 10.6 }, { name: "Invitados", x: 12, z: 11.5 }
    ],
    inicio: { x: 15.2, z: 8.75, yaw: Math.PI / 2 }
  };
}
