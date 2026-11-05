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

## Unir varios escaneos con Gemini

En la portada, pulsa **Unir varios escaneos**.

1. Añade los escaneos. Usa un ZIP por escaneo si varios comparten nombres de textura, como pasa en Polycam.
2. Añade el plano de la casa en imagen o PDF.
3. Si conoces la anchura real del plano, escríbela: mejora la precisión.
4. Pega tu clave de Gemini, opcional. Se consigue en aistudio.google.com y se guarda solo en tu navegador.
5. Revisa las piezas sobre el plano, corrígelas arrastrando si hace falta y pulsa **Entrar**.

Con plano, los escaneos no necesitan solaparse. Sin plano deben solaparse y el resultado necesita revisión a mano.

Gemini lee el plano, nombra estancias, responde preguntas, hace inventario, propone mejoras, revisa el estado, busca objetos, crea puntos de información y escribe anuncios. Cada persona usa su propia clave. **No escribas nunca una clave en el código:** en un repositorio público quedaría expuesta.

Con Supabase usa `gemini-3.8-flash` y, si está saturado, pasa a `gemini-3.5-flash-lite` y `gemini-2.5-flash`. Con clave propia, el modelo se cambia en Herramientas, Conectar Gemini.

## Modelo de la portada y casa de prueba

Sube tu modelo a `modelos/`, por ejemplo `modelos/casa.zip` con el OBJ, el MTL y las texturas. Después edita `CONFIG` en `fuente/web.html` y en `index.html`:

```js
modeloPortada: "modelos/casa.zip",
modeloPrueba: "modelos/casa.zip",
```

El recorrido del scroll se calcula solo con el tamaño y las habitaciones del modelo. Antes de fijarlo puedes probarlo en **Herramientas → Probar un modelo en esta portada**.

## Supabase

La web ya apunta al proyecto de Supabase. Las claves de `CONFIG` son públicas por diseño: la seguridad la ponen las reglas de la base de datos.

- **Gemini para visitantes:** guarda tu clave como `GEMINI_API_KEY` en Edge Functions, Secrets. Cada dirección IP tiene 40 usos al día y la web 500.
- **Otro dominio:** la función solo acepta `*.github.io` y `localhost`. Para otro dominio, añade el secreto `ORIGENES`.
- **Cuentas:** en Authentication, URL Configuration, pon la dirección de tu GitHub Pages como Site URL.
- **Publicar:** los proyectos publicados son visibles para quien tenga el enlace. Máximo 50 MB por modelo.

Nunca pongas en el código la clave de Gemini ni la clave `service_role` de Supabase.

## Realismo y diseño

- **Materiales reales:** `fuente/realismo.js` reconoce los materiales por su nombre (`madera_suelo`, `marmol_blanco`, `vidrio`, `agua_piscina`…) y les pone texturas de `texturas/` en metros reales, relieve, brillo, barniz, vidrio con reflejos y agua con refracción y cáusticas.
- **Cielo y luz:** cielo físico, iluminación HDR de `cielos/` (Poly Haven, CC0), sombras suaves, niebla de horizonte y lámparas que se encienden al atardecer y de noche. Con el techo levantado o en maqueta las sombras interiores desaparecen para verlo todo.
- **Posproceso:** oclusión ambiental, resplandor, tono fílmico, gradación, viñeta y grano. En Ajustes, *Efectos de luz*: Básica, Alta o Ultra. Si va lento, baja solo.
- **IA:** además de lo anterior entiende «apaga las luces», «enciéndelas» o «cambia las luces».
- **Texturas:** `python3 fuente/texturas.py` las regenera (necesita numpy y Pillow).
- **Diseño:** estilos en `fuente/estilo.css` e interacción en `fuente/interfaz.js`.

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
