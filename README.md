# Planta Caminable

Carga un escaneo o modelo 3D y camina por él en primera persona desde el navegador.

## Publicar en GitHub Pages

1. Sube todo el contenido de esta carpeta a la rama `main`, con `index.html` en la raíz.
2. En el repositorio entra en **Settings → Pages**.
3. En **Source** elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`. Guarda.
4. Espera un par de minutos. La web queda en `https://TU-USUARIO.github.io/TU-REPOSITORIO/`.

## Dejar modelos en la web

Copia el archivo en la carpeta `modelos/`. Puede ser GLB, OBJ, FBX, ZIP o cualquier formato admitido.
GitHub no acepta archivos de más de 100 MB.

- Enlace directo: `https://TU-USUARIO.github.io/TU-REPOSITORIO/?m=modelos/casa.glb`
- Para que abra siempre ese modelo, edita `CONFIG` en `index.html`: `modelUrl: "modelos/casa.glb"`.
- Para mostrar tu contacto en la herramienta Pedir visita: `contacto: "tu@correo.com"`.

Los modelos subidos a un repositorio público pueden verlos y descargarlos todos.

## Formatos

GLB, GLTF, OBJ con MTL, FBX, DAE, PLY, STL, 3DS, 3MF, AMF, PCD, XYZ y ZIP con cualquiera de ellos.

## Controles

W A S D para andar, Mayús para correr, clic para mirar con el ratón y Esc para soltarlo.
K o / abre el menú de herramientas. M abre la maqueta, P el plano y F atraviesa paredes.

## Probar en tu ordenador

```bash
npx http-server -p 8080
```

## Modificar el código

Los archivos editables están en `fuente/`. Después de cambiarlos, ejecuta `node fuente/montar.js`
para regenerar `index.html`. Los ajustes hechos a mano en `CONFIG` dentro de `index.html`
se sobrescriben: edítalos también en `fuente/web.html`.

`node fuente/hornear.js 2048 14 2.4` recalcula la luz de la casa de muestra y tarda unos 10 minutos.

## Necesita internet

El motor 3D, los lectores de formatos y las fuentes se cargan desde jsDelivr y Google Fonts.
