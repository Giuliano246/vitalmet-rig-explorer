# Vitalmet Rig Explorer

Plataforma web de Vitalmet S.A. para explorar equipos petroleros en 3D, entender sus sistemas y ubicar los productos Vitalmet con sus fichas del catálogo. Sin build, sin framework, sin backend: HTML + CSS + JavaScript (módulos ES) + Three.js local.

## Ejecutar

Desde esta carpeta (`proyecto/`):

```sh
python3 -m http.server 4178 --bind 127.0.0.1
```

Abrir http://127.0.0.1:4178/ (o el puerto que esté libre; si el 4178 está ocupado por otro servidor, usar 4179). No abrir `index.html` por `file://`: los módulos ES y el service worker requieren http(s).

Cualquier servidor estático sirve (Netlify, Vercel, GitHub Pages, nginx). No hay dependencias que instalar ni costos: todo es local y de licencia MIT/propia.

## Qué hace

- **4 escenas 3D**: Equipo de perforación · Línea de alta presión (cementación/fractura) · Bomba de lodo (despiece esquemático del fluid end) · Pieza en detalle (la variante seleccionada con despiece y etiquetas).
- **8 familias / 42 variantes** del catálogo con datos por página y procedencia (dato del catálogo / inferencia / no informado), medidas, matriz BX, 96 referencias a fotos (recortes del PDF y fotos del sitio web), enlace a la página original y al PDF.
- Selección desde la escena (clic o marcador numerado), desde el listado o desde los sistemas; resalte, aislamiento, acercar, despiece, etiquetas; calidad 3D alta/media/baja.
- **Sistemas del equipo** con explicación, componentes, aporte Vitalmet y fuentes.
- **Español / inglés** completos (botón en la cabecera o `?lang=en`).
- **Solicitud de cotización**: lista con medida y cantidad, datos de contacto, texto preparado para correo o WhatsApp. No envía nada automáticamente; sin precios ni stock.
- **Panel de contenido** ("Editar contenido"): edita textos, datos, medidas y fotos en este navegador; exporta/importa JSON validado; restaura originales. Sin contraseña; no es un CMS compartido.
- **Sin conexión**: tras la primera carga por http(s), la app entera (incluidos PDF, páginas y fotos) queda en caché del navegador.
- **Sin WebGL**: si el navegador no puede iniciar 3D, la interfaz sigue funcionando con la página del catálogo (`?nowebgl=1` para probarlo).
- Teclado: `R` restablecer · `F` acercar · `E` despiece · `Esc` salir de aislar.

## Estructura

```
index.html · style.css · app.js · sw.js · manifest.webmanifest
data/catalog.js        catálogo (ES/EN, procedencia, fotos, geometría, despieces, matriz BX, piezas VAE)
data/systems.js        sistemas y fuentes
src/i18n.js · src/store.js
src/scene/             materials · builders · parts · viewer · explorer · scenes/{rig,hpline,mudpump,studio}
src/ui/                list · inspector · quote · admin · systems
assets/                catalogo-vitalmet.pdf · paginas/ · catalogo/ · fotos/ · logo.png · assets-manifest.json
vendor/                three.module.js · three.core.js · OrbitControls.js (r184, MIT)
tools/validate.mjs     `node tools/validate.mjs` valida los datos
tools/prueba-responsive.html  vista a 390 px y 768 px (abrir por http)
```

## Editar contenido sin programar

1. Botón **Editar contenido** → elegir familia, variante o sistema e idioma.
2. Datos técnicos: una línea por dato con el formato `Clave = Valor | p.N | published|inferred|pending`.
3. Fotos: `assets/ruta.webp | Leyenda` (la imagen debe existir en `assets/`; copiarla ahí antes).
4. **Guardar** aplica en este navegador. **Exportar JSON** produce un archivo con sólo las diferencias; para publicarlo hay que importarlo en el navegador de destino o convertirlo en el nuevo `data/catalog.js`.

Para agregar una variante nueva o cambiar geometrías hay que editar `data/catalog.js` (y `src/scene/parts.js` si cambia la forma).

## Límites conocidos

- Geometrías procedurales ilustrativas, no CAD; ubicaciones no validadas por un especialista.
- Despieces: sólo la VAE está documentada (plano p. 14); el resto es esquemático y se rotula como tal.
- Offline: requiere una primera carga por http(s) (localhost o https). En `file://` no hay service worker.
- Panel: guarda en `localStorage` del navegador; no hay usuarios ni sincronización.
- Portal privado: no implementado (ver `../PENDIENTES.md`).
- Probado en Chrome de escritorio (macOS) y viewports de 390/768 px; faltan pruebas en móviles reales, Safari y Firefox.

## Parámetros de URL

`?lang=es|en` · `?familia=<id>` (union, pup-joint, codo, codo-giratorio, valvula, anillo-bx, campana, bombas) · `?nowebgl=1`

## Publicación (MVP)

Sitio público: https://giuliano246.github.io/vitalmet-rig-explorer/ (GitHub Pages, repo público `Giuliano246/vitalmet-rig-explorer`, gratis). Para actualizarlo tras cambiar `proyecto/`: `tools/deploy-pages.sh "mensaje"`. El sitio tarda alrededor de un minuto en reflejar cada push.

## Documentación de la entrega

En la carpeta superior: `CAMBIOS.md`, `PRUEBAS.md`, `PENDIENTES.md`, `FUENTES-Y-LICENCIAS.md`, `DATOS-POR-CONFIRMAR.md`.
