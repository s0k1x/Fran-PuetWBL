"""Genera las texturas de ../texturas/: color, relieve (normal) y rugosidad.

Todo es periódico (se repite sin costuras) porque el ruido se crea en el dominio
de frecuencias. Las texturas de color son casi neutras: la web las tiñe con el
color de cada material del modelo, así un mismo mármol sirve para blanco y crema.

Uso: python3 fuente/texturas.py  (necesita numpy y Pillow)
Las fotos de madera, césped y agua salen del repositorio de three.js y se
reprocesan aquí si están en fuente/fotos/.
"""
import json, os
import numpy as np
from PIL import Image

RAIZ = os.path.join(os.path.dirname(__file__), "..")
SAL = os.path.join(RAIZ, "texturas")
FOTOS = os.environ.get("FOTOS", os.path.join(os.path.dirname(__file__), "fotos"))
os.makedirs(SAL, exist_ok=True)
N = 1024
rng = np.random.default_rng(7)
medias = {}


def ruido(n=N, beta=2.0, kmin=1, kmax=None, semilla=None):
    """Ruido fractal periódico normalizado a 0..1."""
    r = np.random.default_rng(semilla) if semilla is not None else rng
    w = r.normal(size=(n, n))
    F = np.fft.rfft2(w)
    ky = np.fft.fftfreq(n)[:, None] * n
    kx = np.fft.rfftfreq(n)[None, :] * n
    k = np.sqrt(kx ** 2 + ky ** 2)
    amp = np.where(k < kmin, 0, 1 / np.maximum(k, 1) ** (beta / 2 + .5))
    if kmax:
        amp *= np.exp(-(k / kmax) ** 2)
    v = np.fft.irfft2(F * amp, s=(n, n))
    v -= v.min(); v /= v.max() or 1
    return v


def suaviza(a, k=2):
    for _ in range(k):
        a = (a + np.roll(a, 1, 0) + np.roll(a, -1, 0) + np.roll(a, 1, 1) + np.roll(a, -1, 1)) / 5
    return a


def normal(h, fuerza):
    """Mapa normal en espacio tangente (convención OpenGL) desde un relieve periódico."""
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * fuerza
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * fuerza
    nz = np.ones_like(h)
    l = np.sqrt(dx * dx + dy * dy + 1)
    n = np.stack([-dx / l, dy / l, nz / l], -1)
    return (n * .5 + .5)


def guarda(nombre, a, q=84, tam=None, gris=False):
    a = np.clip(a, 0, 1)
    if a.ndim == 2 and not gris:
        a = np.stack([a] * 3, -1)
    im = Image.fromarray((a * 255 + .5).astype(np.uint8), "L" if gris else "RGB")
    if tam:
        im = im.resize(tam, Image.LANCZOS)
    im.save(os.path.join(SAL, nombre + ".jpg"), quality=q, optimize=True, progressive=True)
    if nombre.endswith("_c"):
        medias[nombre[:-2]] = [round(float(x), 4) for x in np.asarray(im, dtype=np.float32).reshape(-1, 3 if not gris else 1).mean(0) / 255]


yy, xx = np.mgrid[0:N, 0:N] / N

# ---------- Mármol claro: vetas finas y nubes suaves ----------
def marmol(semilla, oscuro=False, giro=1.1):
    # Campo suave y deformado: las vetas son sus curvas de nivel, así fluyen sin dientes
    w1 = ruido(beta=3.2, kmax=7, semilla=semilla)
    w2 = ruido(beta=2.6, kmax=22, semilla=semilla + 1)
    w3 = ruido(beta=2.0, kmax=70, semilla=semilla + 4)
    nube = ruido(beta=2.8, kmax=14, semilla=semilla + 2)
    turb = np.abs(w1 - .5) * 2 * .9 + np.abs(w2 - .5) * 2 * .3 + w3 * .04
    fase = 2 * np.pi * (xx * 2 + yy * 1 + turb * giro)
    v1 = np.exp(-np.abs(np.sin(fase)) / .02) * (.55 + .45 * nube)
    w4 = ruido(beta=2.8, kmax=16, semilla=semilla + 3)
    fase2 = 2 * np.pi * (xx * 1 - yy * 3 + w4 * 1.6 + w3 * .05)
    v2 = np.exp(-np.abs(np.sin(fase2)) / .008) * .5 * np.clip((w2 - .4) * 4, 0, 1)
    halo = np.exp(-np.abs(np.sin(fase)) / .16) * .13 * (.4 + .6 * nube)
    vena = np.clip(v1 + v2, 0, 1)
    if not oscuro:
        base = .965 - .05 * nube - halo
        col = base[..., None] * np.array([1, .995, .985]) - vena[..., None] * np.array([.24, .24, .23])
    else:
        base = .085 + .05 * nube + halo * .3
        col = base[..., None] * np.array([1, 1, 1.03]) + vena[..., None] * np.array([.62, .6, .56])
    return col, vena


c, v = marmol(11, giro=.42)
guarda("marmol_c", c)
guarda("marmol_r", .07 + .1 * v + .03 * ruido(beta=1.2, semilla=4), gris=True)
guarda("marmol_n", normal(suaviza(v, 2) * .4 + ruido(beta=1.5, semilla=5) * .1, 3), q=80, tam=(512, 512))
c, v = marmol(21, oscuro=True)
guarda("marmol_negro_c", c)

# ---------- Estuco y pintura: grano fino con ondulación de llana ----------
fino = ruido(beta=1.1, kmin=40, semilla=31)
llana = ruido(beta=2.4, kmax=60, semilla=32)
h = fino * .35 + llana * .65
guarda("estuco_c", .93 + .07 * (llana - .5) + .03 * (fino - .5))
guarda("estuco_n", normal(h, 2.2), q=78, tam=(512, 512))

# ---------- Hormigón: manchas, poros y encofrado ----------
man = ruido(beta=2.2, semilla=41)
poro = (ruido(beta=.6, kmin=80, semilla=42) > .82).astype(float)
h = ruido(beta=1.4, semilla=43) * .6 - poro * .5
guarda("hormigon_c", .86 + .16 * (man - .5) - poro * .12 + .05 * (ruido(beta=1.0, kmin=30, semilla=44) - .5))
guarda("hormigon_n", normal(suaviza(h, 1), 3), q=78, tam=(512, 512))
guarda("hormigon_r", .72 + .2 * man - poro * .1, gris=True, tam=(512, 512))

# ---------- Piedra natural (travertino): estratos y oquedades ----------
w = ruido(beta=2.2, semilla=51)
estrato = .5 + .5 * np.sin(2 * np.pi * (yy * 9 + w * 1.6))
hueco = (ruido(beta=1.0, kmin=20, semilla=52) * (1 - estrato * .4) > .86).astype(float)
h = estrato * .25 + ruido(beta=1.3, semilla=53) * .45 - suaviza(hueco, 2) * .8
col = (.9 + .1 * (estrato - .5) + .08 * (ruido(beta=2.0, semilla=54) - .5) - hueco * .2)[..., None] * np.array([1, .975, .93])
# Despiece en sillares de 60 x 30 cm (la textura mide 1,2 m)
fila = (yy * 4).astype(int)
jx = np.abs(((xx * 2 + (fila % 2) * .5) % 1) - .5) > .497
jy = np.abs(((yy * 4) % 1) - .5) > .494
junta = (jx | jy).astype(float)
col = col * (1 - junta[..., None] * .28)
h = h - suaviza(junta, 1) * .9
guarda("piedra_c", col)
guarda("piedra_n", normal(h, 3.5), q=78, tam=(512, 512))

# ---------- Baldosa grande de exterior (dos por dos, 1,2 m) ----------
def baldosas(nx, ny, jw, semilla, var=.06, tono=None):
    ix, iy = (xx * nx).astype(int), (yy * ny).astype(int)
    r = np.random.default_rng(semilla).random((ny, nx))
    dx = np.abs((xx * nx) % 1 - .5) * 2
    dy = np.abs((yy * ny) % 1 - .5) * 2
    junta = np.clip((np.maximum(dx * (1 if nx >= ny else 1), dy) - (1 - jw)) / jw, 0, 1)
    junta = (np.maximum(dx, dy) > 1 - jw).astype(float)
    return ix, iy, r[iy, ix], junta

ix, iy, var, junta = baldosas(2, 2, .012, 61)
sup = ruido(beta=1.8, semilla=62)
col = (.93 + (var - .5) * .07 + (sup - .5) * .08 + .03 * (ruido(beta=1.0, kmin=60, semilla=63) - .5)) * (1 - junta * .3)
guarda("pavimento_c", col)
guarda("pavimento_n", normal(suaviza(-junta * 1.0 + sup * .15, 1), 4), q=78, tam=(512, 512))

# ---------- Porcelánico rectificado 120 x 60, pulido ----------
ix, iy, var, junta = baldosas(1, 2, .004, 71)
sup = ruido(beta=2.3, semilla=72)
col = (.95 + (var - .5) * .03 + (sup - .5) * .07) * (1 - junta * .35)
guarda("porcelanico_c", col)
guarda("porcelanico_n", normal(suaviza(-junta, 1) * .8, 4), q=78, tam=(512, 512))

# ---------- Gresite de piscina: teselas de 2,5 cm (la textura mide 0,5 m) ----------
ix, iy, var, junta = baldosas(20, 20, .1, 81)
col = ((.9 + (var - .5) * .12) * (1 - junta * .25))[..., None] * np.array([1, 1, 1])
guarda("gresite_c", col)
guarda("gresite_n", normal(suaviza(-junta, 1) * .6, 6), q=78, tam=(512, 512))

# ---------- Grava ----------
def piedrecillas(n_piedras, rmin, rmax, semilla):
    r = np.random.default_rng(semilla)
    h = np.zeros((N, N)); col = np.zeros((N, N))
    for _ in range(n_piedras):
        cx, cy = r.random(2) * N
        rx, ry = r.uniform(rmin, rmax, 2)
        x0, x1, y0, y1 = int(cx - rx - 1), int(cx + rx + 2), int(cy - ry - 1), int(cy + ry + 2)
        Y, X = np.mgrid[y0:y1, x0:x1]
        d = ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2
        m = d < 1
        alt = np.sqrt(np.clip(1 - d, 0, 1)) * r.uniform(.6, 1)
        Yi, Xi = Y % N, X % N
        sel = m & (alt > h[Yi, Xi])
        h[Yi[sel], Xi[sel]] = alt[sel]
        col[Yi[sel], Xi[sel]] = r.uniform(.65, 1.05)
    return h, col

h, cg = piedrecillas(9000, 4, 10, 91)
c = (cg * (.55 + .45 * h))[..., None] * np.array([1, .985, .96])
c[h == 0] = .3
guarda("grava_c", c)
guarda("grava_n", normal(h, 5), q=78, tam=(512, 512))

# ---------- Asfalto ----------
a = ruido(beta=.5, kmin=100, semilla=101)
guarda("asfalto_c", .8 + .4 * (a - .5) + .1 * (ruido(beta=2.0, semilla=102) - .5))
guarda("asfalto_n", normal(a * .6, 2), q=75, tam=(512, 512))

# ---------- Tela: tejido de sarga ----------
t = np.sin(2 * np.pi * xx * 256) * .5 + .5
u = np.sin(2 * np.pi * yy * 256) * .5 + .5
diag = (np.floor(xx * 256) + np.floor(yy * 256)) % 4 < 2
h = np.where(diag, t, u) * .6 + ruido(beta=1.2, kmin=20, semilla=111) * .4
guarda("tela_c", .9 + .12 * (h - .5) + .06 * (ruido(beta=2.0, semilla=112) - .5))
guarda("tela_n", normal(h, 1.4), q=75, tam=(512, 512))

# ---------- Cuero: celdas ----------
pts = np.random.default_rng(121).random((900, 2))
Y, X = np.mgrid[0:256, 0:256] / 256
d1 = np.full((256, 256), 9.); d2 = np.full((256, 256), 9.)
for ox in (-1, 0, 1):
    for oy in (-1, 0, 1):
        for px, py in pts:
            d = (X - px - ox) ** 2 + (Y - py - oy) ** 2
            d2 = np.where(d < d1, d1, np.minimum(d2, d)); d1 = np.minimum(d1, d)
cel = np.sqrt(d2) - np.sqrt(d1)
cel = np.array(Image.fromarray((np.clip(cel / cel.max(), 0, 1) * 255).astype(np.uint8)).resize((N, N), Image.BICUBIC)) / 255
guarda("cuero_c", .88 + .14 * (cel - .5) + .1 * (ruido(beta=2.2, semilla=122) - .5))
guarda("cuero_n", normal(np.clip(cel * 3, 0, 1) * .5, 2), q=75, tam=(512, 512))

# ---------- Follaje: hojas superpuestas (setos y palmeras) ----------
h, cg = piedrecillas(14000, 5, 14, 131)
c = (cg * (.45 + .6 * h))
c[h == 0] = .25
c = c[..., None] * np.array([.95, 1.05, .9])
guarda("follaje_c", c)
guarda("follaje_n", normal(h, 4), q=75, tam=(512, 512))

# ---------- Tierra ----------
guarda("tierra_c", .85 + .3 * (ruido(beta=1.3, semilla=141) - .5) + .15 * (ruido(beta=2.4, semilla=142) - .5))

# ---------- Fotos reprocesadas ----------
def foto(nombre, archivo, tam, neutro=True):
    p = os.path.join(FOTOS, archivo)
    if not os.path.exists(p):
        return None
    im = Image.open(p).convert("RGB").resize(tam, Image.LANCZOS)
    a = np.asarray(im, dtype=np.float32) / 255
    if neutro:
        L = a @ np.array([.2126, .7152, .0722])
        L = L / L.mean()
        a = np.clip(.82 * (1 + (suaviza(L, 1) - 1) * .7), 0, 1)
    guarda(nombre, a)
    return a

foto("madera_c", "hardwood2_diffuse.jpg", (1024, 512))
p = os.path.join(FOTOS, "hardwood2_bump.jpg")
if os.path.exists(p):
    b = np.asarray(Image.open(p).convert("L").resize((1024, 512), Image.LANCZOS), dtype=np.float32) / 255
    guarda("madera_n", normal(b, 2.5), q=80)
    r = np.asarray(Image.open(os.path.join(FOTOS, "hardwood2_roughness.jpg")).convert("L").resize((512, 256), Image.LANCZOS), dtype=np.float32) / 255
    guarda("madera_r", r, gris=True)
foto("cesped_c", "grasslight-big.jpg", (1024, 1024), neutro=False)
p = os.path.join(FOTOS, "waternormals.jpg")
if os.path.exists(p):
    Image.open(p).convert("RGB").resize((512, 512), Image.LANCZOS).save(os.path.join(SAL, "agua_n.jpg"), quality=82)

with open(os.path.join(SAL, "medias.json"), "w") as f:
    json.dump(medias, f, indent=1, sort_keys=True)
# Texturas que se ven siempre de lejos: más pequeñas para que la web cargue rápido
for n, (t, q) in {"cesped_c": (768, 80), "grava_c": (512, 80), "follaje_c": (512, 80), "asfalto_c": (512, 78), "tela_c": (512, 80), "tierra_c": (512, 78)}.items():
    p = os.path.join(SAL, n + ".jpg"); Image.open(p).convert("RGB").resize((t, t), Image.LANCZOS).save(p, quality=q, optimize=True, progressive=True)
print("ok", len(os.listdir(SAL)), "archivos")
