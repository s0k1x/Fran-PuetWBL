"""Convierte un OBJ + MTL a GLB binario cuantizado (KHR_mesh_quantization).

- Posiciones en int16 con la escala y el desplazamiento en el nodo, normales en int8.
- Sin UV: el motor proyecta las texturas en metros reales y no las necesita.
- Vértices sin repetir e índices de 16 bits por primitiva cuando caben.
- Un nodo por objeto (conserva los nombres CUB_ y PA_ que usa la portada) y un material por nombre.

Uso: python3 fuente/obj2glb.py modelo.obj modelo.mtl salida.glb [materiales_a_quitar] [objetos_a_quitar]
  Los dos últimos son expresiones regulares, por ejemplo "hoja_tropical|flores_.*" y "Palmera_0[2468]".
"""
import re
import json, struct, sys, math
from collections import OrderedDict

def lee_mtl(ruta):
    mats, cur = OrderedDict(), None
    for l in open(ruta, encoding="utf-8", errors="ignore"):
        p = l.split()
        if not p: continue
        if p[0] == "newmtl": cur = p[1]; mats[cur] = {"Kd": [.8, .8, .8], "d": 1.0, "Ke": [0, 0, 0]}
        elif cur and p[0] in ("Kd", "Ke"): mats[cur][p[0]] = [float(x) for x in p[1:4]]
        elif cur and p[0] == "d": mats[cur]["d"] = float(p[1])
    return mats

def lee_obj(ruta):
    V, N, objetos, obj, mat = [], [], OrderedDict(), None, None
    for l in open(ruta, encoding="utf-8", errors="ignore"):
        if l.startswith("v "): V.append(tuple(map(float, l.split()[1:4])))
        elif l.startswith("vn "): N.append(tuple(map(float, l.split()[1:4])))
        elif l.startswith("o ") or l.startswith("g "):
            nom = l.split(maxsplit=1)[1].strip()
            if l.startswith("o ") or nom not in objetos: obj = nom; objetos.setdefault(obj, OrderedDict())
        elif l.startswith("usemtl"): mat = l.split()[1]
        elif l.startswith("f "):
            if obj is None: obj = "objeto"; objetos.setdefault(obj, OrderedDict())
            caras = objetos[obj].setdefault(mat, [])
            vs = []
            for t in l.split()[1:]:
                a = t.split("/"); vi = int(a[0]); ni = int(a[2]) if len(a) > 2 and a[2] else 0
                vs.append((vi - 1 if vi > 0 else len(V) + vi, (ni - 1 if ni > 0 else len(N) + ni) if ni else -1))
            for i in range(1, len(vs) - 1): caras.append((vs[0], vs[i], vs[i + 1]))
    return V, N, objetos

def normal_cara(V, a, b, c):
    ax, ay, az = V[a]; bx, by, bz = V[b]; cx, cy, cz = V[c]
    ux, uy, uz, wx, wy, wz = bx - ax, by - ay, bz - az, cx - ax, cy - ay, cz - az
    n = (uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx); l = math.sqrt(sum(x * x for x in n)) or 1
    return tuple(x / l for x in n)

def convierte(obj, mtl, salida, quitaMat="", quitaObj=""):
    mats = lee_mtl(mtl); V, N, objetos = lee_obj(obj)
    rm, ro = (re.compile(quitaMat) if quitaMat else None), (re.compile(quitaObj) if quitaObj else None)
    objetos = OrderedDict((o, OrderedDict((m, c) for m, c in pm.items() if not (rm and m and rm.fullmatch(m)))) for o, pm in objetos.items() if not (ro and ro.search(o)))
    objetos = OrderedDict((o, pm) for o, pm in objetos.items() if pm)
    nombres_mat = list(OrderedDict.fromkeys([m for o in objetos.values() for m in o] ))
    bin_, vistas, accesos, mallas, nodos = bytearray(), [], [], [], []
    def vista(datos, destino=None):
        while len(bin_) % 4: bin_.append(0)
        off = len(bin_); bin_.extend(datos); v = {"buffer": 0, "byteOffset": off, "byteLength": len(datos)}
        if destino: v["target"] = destino
        vistas.append(v); return len(vistas) - 1
    for nom, porMat in objetos.items():
        pts = [V[i] for caras in porMat.values() for t in caras for (i, _) in t]
        if not pts: continue
        mn = [min(p[k] for p in pts) for k in range(3)]; mx = [max(p[k] for p in pts) for k in range(3)]
        esc = [max((mx[k] - mn[k]) / 65534.0, 1e-9) for k in range(3)]; cen = [(mx[k] + mn[k]) / 2 for k in range(3)]
        prims = []
        for mat, caras in porMat.items():
            unico, pos, nor, idx = {}, bytearray(), bytearray(), []
            for t in caras:
                fn = None
                for (vi, ni) in t:
                    if ni < 0:
                        fn = fn or normal_cara(V, t[0][0], t[1][0], t[2][0]); n = fn
                    else: n = N[ni]
                    q = tuple(int(round((V[vi][k] - cen[k]) / esc[k])) for k in range(3)); qn = tuple(max(-127, min(127, int(round(c * 127)))) for c in n)
                    clave = q + qn
                    if clave not in unico:
                        unico[clave] = len(unico); pos += struct.pack("<hhhh", *q, 0); nor += struct.pack("<bbbb", *qn, 0)
                    idx.append(unico[clave])
            nv = len(unico); corto = nv < 65536
            ip = struct.pack("<%d%s" % (len(idx), "H" if corto else "I"), *idx)
            vp, vn, vi_ = vista(bytes(pos), 34962), vista(bytes(nor), 34962), vista(ip, 34963)
            vistas[vp]["byteStride"] = 8; vistas[vn]["byteStride"] = 4
            qs = [(p[0], p[1], p[2]) for p in struct.iter_unpack("<hhhh", bytes(pos))]
            accesos.append({"bufferView": vp, "componentType": 5122, "count": nv, "type": "VEC3", "min": [min(q[k] for q in qs) for k in range(3)], "max": [max(q[k] for q in qs) for k in range(3)]}); ap = len(accesos) - 1
            accesos.append({"bufferView": vn, "componentType": 5120, "normalized": True, "count": nv, "type": "VEC3"}); an = len(accesos) - 1
            accesos.append({"bufferView": vi_, "componentType": 5123 if corto else 5125, "count": len(idx), "type": "SCALAR"}); ai = len(accesos) - 1
            prims.append({"attributes": {"POSITION": ap, "NORMAL": an}, "indices": ai, "material": nombres_mat.index(mat) if mat in nombres_mat else 0})
        mallas.append({"name": nom, "primitives": prims})
        nodos.append({"name": nom, "mesh": len(mallas) - 1, "translation": cen, "scale": esc})
    materiales = []
    for n in nombres_mat:
        m = mats.get(n, {"Kd": [.8, .8, .8], "d": 1, "Ke": [0, 0, 0]})
        e = {"name": n, "pbrMetallicRoughness": {"baseColorFactor": [*m["Kd"], m["d"]], "metallicFactor": 0, "roughnessFactor": .7}, "doubleSided": True}
        if m["d"] < 1: e["alphaMode"] = "BLEND"
        if any(m["Ke"]): e["emissiveFactor"] = m["Ke"]
        materiales.append(e)
    gltf = {"asset": {"version": "2.0", "generator": "INNRA3D obj2glb"}, "extensionsUsed": ["KHR_mesh_quantization"], "extensionsRequired": ["KHR_mesh_quantization"],
            "scene": 0, "scenes": [{"nodes": list(range(len(nodos)))}], "nodes": nodos, "meshes": mallas, "materials": materiales,
            "accessors": accesos, "bufferViews": vistas, "buffers": [{"byteLength": len(bin_)}]}
    j = json.dumps(gltf, separators=(",", ":")).encode()
    while len(j) % 4: j += b" "
    while len(bin_) % 4: bin_.append(0)
    total = 12 + 8 + len(j) + 8 + len(bin_)
    with open(salida, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total)); f.write(struct.pack("<II", len(j), 0x4E4F534A)); f.write(j); f.write(struct.pack("<II", len(bin_), 0x004E4942)); f.write(bin_)
    print("ok", salida, total, "bytes,", len(nodos), "nodos,", len(materiales), "materiales")

if __name__ == "__main__":
    convierte(*sys.argv[1:6])
