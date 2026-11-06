# INNRA3D

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

## Portada con escultura y modelos de ejemplo

- La portada ya no descarga la villa: muestra una **escultura de obsidiana con vetas de oro** generada por código (0 KB), en un estudio oscuro, que se transforma al hacer scroll (nudo, espiral, esfera y oro) y se dibuja a resolución completa.
- **Modelos de ejemplo** (Explorar o «Modelos de ejemplo»): villa contemporánea simplificada (38 600 triángulos, 258 KB), loft minimalista, pabellón de cristal, superdeportivo en sala de exposición y galería con la escultura. Los cuatro últimos se generan al momento y se abren de noche con el estilo «Oscuro».
- `fuente/obj2glb.py` acepta materiales y objetos a quitar: `python3 fuente/obj2glb.py villa.obj villa.mtl villa.glb "hoja_tropical|cristal_lampara|flores_.*|libro_.|maceta" "Palmera_(0[2468]|10|12|14)"`.

## Carga rápida

- La web arranca siempre en **Básica**; la calidad se sube en Ajustes, en «Efectos de luz».
- En Básica no se descargan cielos HDR (la luz sale del cielo horneado) ni mapas de relieve y rugosidad.
- La villa va en **GLB binario cuantizado** (`KHR_mesh_quantization`, sin UV): 410 KB frente a los 877 KB del OBJ. Para convertir otro modelo: `python3 fuente/obj2glb.py modelo.obj modelo.mtl salida.glb` y mételo en un ZIP con su `estancias.json`.
- Al pulsar «Recorrer la villa» se reutiliza el modelo de la portada, sin descargarlo ni procesarlo otra vez.

## Estudio, IA y herramientas nuevas

- **Hora del día** (Ambiente o Herramientas): el sol se mueve, el cielo cambia y las lámparas se encienden al anochecer.
- **Entrada cinematográfica** al recorrer la villa, **cursor propio** con botones magnéticos, **sonidos opcionales** y **tema claro** (Ajustes).
- **Modo foto:** rejilla, nivel, desenfoque por distancia y captura en 4K con la marca.
- **Plano de arquitecto** en PNG o PDF con todas las plantas, cotas, norte, escala y cajetín.
- **Estilos de la casa** (nórdico, mediterráneo, industrial, japandi, lujo clásico), **diseñar con IA** y **comparar dos estilos** con una línea movible.
- **IA:** asistente de voz (tecla V), ficha comercial en PDF, presupuesto orientativo de reforma, vídeo promocional con música y antes/después al redecorar.
- **Compartir:** enlace, QR e inserción con `?embed=1`.
- **Medición:** superficies y alturas, guardadas con el modelo y exportables a CSV.
- **Visita en directo** con Supabase Realtime: el enlace lleva `&vivo=código` y los invitados siguen al guía.
- **Panel del propietario** con visitas, tiempo por estancia y solicitudes, y **galería** de proyectos publicados (se activa en «Mis proyectos»).
- **App instalable** y uso sin conexión (`manifest.webmanifest` y `sw.js`).

## Novedades de INNRA3D

- **Rendimiento:** las piezas de la villa se unen por material (de unas 940 a unas 140 llamadas de dibujo por fotograma). El agua ya no repite la escena. Si un equipo va justo, baja primero la resolución interna y solo después los efectos.
- **Imagen:** exposición automática como una cámara, nitidez suave, resolución alta en móvil, interiores iluminados con las lámparas y noche sin deslumbrar.
- **Superdeportivos:** los coches del modelo se detectan por su pintura y se cambian por superdeportivos procedurales (`fuente/optimiza.js`).
- **Móvil:** arreglado el fallo que impedía andar y mirar con el dedo.
- **IA sin configurar nada:** usa la función `gemini` de Supabase. Nuevas herramientas: visita guiada con voz, amueblar la estancia y anuncios en cuatro formatos.
- **Cuenta:** entrar, crear cuenta (aceptando términos), enlace por correo, recuperar contraseña y menú de cuenta con apariencia, accesibilidad y notificaciones.
- **Opiniones:** tabla `resenas` en Supabase, una por cuenta, visibles para todos.
- **Cookies y textos legales** al pie de la página.

### Activar Google y GitHub

En Supabase, **Authentication → Sign In / Providers**, activa Google y GitHub con su Client ID y secreto, y añade la dirección de GitHub Pages en **URL Configuration**. Los botones se activan solos; mientras tanto muestran «Próximamente». Para que iniciar sesión sea obligatorio, pon `accesoObligatorio: true` en `CONFIG` dentro de `fuente/web.html`.

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
