// Catálogo Vitalmet — datos transcritos del PDF "Catálogo de productos" (21 páginas).
// Cada dato lleva `page` (página del PDF) y `kind`:
//   published  = transcripción literal o resumida del catálogo
//   inferred   = inferencia del equipo de desarrollo (no confirmada por Vitalmet)
//   pending    = no informado en el catálogo
// Los identificadores de familia se conservan respecto del snapshot anterior:
//   union, pup-joint, codo, valvula, anillo-bx, bombas, campana, codo-giratorio
// Las variantes ahora tienen `id` estable; el índice numérico anterior se documenta en CAMBIOS.md.

const es_en = (es, en) => ({ es, en });
const PUB = 'published', INF = 'inferred', PEND = 'pending';
const spec = (k, v, page, kind = PUB) => ({ k, v, page, kind });
const photo = (file, es, en, page) => ({ src: `assets/catalogo/${file}`, caption: es_en(es, en), origin: 'catalogo', page });
const webPhoto = (file, es, en) => ({ src: `assets/fotos/${file}`, caption: es_en(es, en), origin: 'web' });

const USO = spec(es_en('Uso recomendado', 'Recommended service'), es_en('Petróleo, gas, agua y aire', 'Oil, gas, water and air'), 4);
const EXTREMOS_SW = (page) => spec(es_en('Extremos', 'End connections'), es_en('Roscados según normas API o para soldar BUTT WELD / SOCKET WELD', 'Threaded to API standards or BUTT WELD / SOCKET WELD ends'), page);
const ORING = (page) => spec(es_en('Sellado', 'Sealing'), es_en('O-ring de NBR reemplazable en cualquier momento', 'Replaceable NBR O-ring'), page);
const INTERCAMBIO = spec(es_en('Intercambiabilidad', 'Interchangeability'), es_en('Todas las piezas del mismo tamaño, presión nominal y número de figura son intercambiables', 'All parts of the same size, pressure rating and figure number are interchangeable'), 4);
const MONTAJE = spec(es_en('Montaje', 'Make-up'), es_en('Tuerca de tres aletas y rosca Acme autotrabante; montaje y desmontaje sin herramientas especiales', 'Three-lug nut with self-locking Acme thread; make-up and break-out without special tools'), 4);

const union = (id, fig, es, en, page, pressureEs, pressureEn, sizes, extra = [], geometry = {}, photos = []) => ({
  id, name: es_en(es, en), page, sizes, pressure: pressureEs,
  specs: [
    spec(es_en('Presión de trabajo', 'Working pressure'), es_en(pressureEs, pressureEn), page),
    spec(es_en('Tamaños', 'Sizes'), es_en(sizes.join(' · '), sizes.join(' · ')), page),
    USO, ...extra, MONTAJE, INTERCAMBIO,
  ],
  geometry: { type: 'union', fig, ...geometry },
  photos,
});

export const contact = {
  email: 'ventas@vitalmetsa.com',           // catálogo p. 21
  phone: '54 9 11 5998-3767',               // catálogo p. 21
  whatsapp: '5491159983767',
  address: 'Perú 246 - Villa Martelli, Buenos Aires, Argentina', // catálogo p. 1 y 21
  web: 'https://vitalmetsa.com',
};

export const catalogSource = {
  file: 'assets/catalogo-vitalmet.pdf',
  pages: 21,
  pageImage: (n) => `assets/paginas/pagina-${String(n).padStart(2, '0')}.webp`,
  title: es_en('Catálogo de productos Vitalmet S.A.', 'Vitalmet S.A. product catalogue'),
};

export const families = [
  {
    id: 'anillo-bx', order: 1, page: 3,
    name: es_en('Anillos BX', 'BX ring gaskets'),
    short: es_en('Anillos BX', 'BX rings'),
    desc: es_en(
      'Anillos de sellado metálicos para bridas API Spec 6A modelo 6BX, para trabajos de alta presión (hasta 20.000 psi según anillo y brida).',
      'Metal ring gaskets for API Spec 6A type 6BX flanges, for high-pressure service (up to 20,000 psi depending on ring and flange).'),
    role: es_en(
      'Sellan la unión entre dos bridas 6BX: cabezales de pozo, BOP, carreteles y manifolds. Se seleccionan por diámetro nominal y serie de presión de la brida.',
      'Seal the joint between two 6BX flanges: wellheads, BOPs, spools and manifolds. Selected by nominal bore and flange pressure series.'),
    scenes: ['rig', 'hpline'],
    geometry: 'bx',
    photos: [photo('bx-anillos-p03.webp', 'Anillos BX · catálogo p. 3', 'BX rings · catalogue p. 3', 3), photo('bx-brida-contexto-p03.webp', 'Brida con anillo BX (foto de contexto) · catálogo p. 3', 'Flange with BX ring (context photo) · catalogue p. 3', 3), webPhoto('anillos-bx-web.jpg', 'Anillos BX · sitio vitalmetsa.com', 'BX rings · vitalmetsa.com')],
    variants: [
      {
        id: 'bx-serie', name: es_en('Anillos BX (serie 6BX)', 'BX rings (6BX series)'), page: 3,
        sizes: ['1 11/16"', '1 13/16"', '2 1/16"', '2 9/16"', '3 1/16"', '4 1/16"', '5 1/8"', '7 1/16"', '9"', '11"', '13 5/8"', '16 3/4"', '18 3/4"', '21 1/4"', '26 1/4"', '30"'],
        specs: [
          spec(es_en('Normas', 'Standards'), es_en('ASME B16.20 y API 6A', 'ASME B16.20 and API 6A'), 3),
          spec(es_en('Bridas', 'Flanges'), es_en('Según API Spec 6A modelo 6BX', 'Per API Spec 6A type 6BX'), 3),
          spec(es_en('Material', 'Material'), es_en('Acero al carbono con recubrimiento de zincado dorado', 'Carbon steel with gold zinc plating'), 3),
          spec(es_en('Dureza máxima', 'Maximum hardness'), es_en('Acero dulce: 90 HB / 56 HRB · Acero al carbono: 120 HB / 68 HRB', 'Mild steel: 90 HB / 56 HRB · Carbon steel: 120 HB / 68 HRB'), 3),
          spec(es_en('Presión', 'Pressure'), es_en('Hasta 20.000 psi. La presión admisible depende del número de anillo y de la serie de la brida (ver matriz).', 'Up to 20,000 psi. Allowable pressure depends on ring number and flange series (see matrix).'), 3),
          spec(es_en('Selección', 'Selection'), es_en('Número BX según diámetro nominal y serie de presión; no todas las combinaciones están disponibles (celdas "---").', 'BX number by nominal bore and pressure series; not every combination is available ("---" cells).'), 3),
        ],
        // Matriz transcrita de la página 3 y contrastada celda por celda con la imagen de la página.
        matrix: {
          series: ['2000', '3000', '5000', '10000', '15000', '20000'],
          rows: [
            ['1 11/16"', null, null, null, 'BX150', 'BX150', null],
            ['1 13/16"', null, null, null, 'BX151', 'BX151', 'BX151'],
            ['2 1/16"', null, null, null, 'BX152', 'BX152', 'BX152'],
            ['2 9/16"', null, null, null, 'BX153', 'BX153', 'BX153'],
            ['3 1/16"', null, null, null, 'BX154', 'BX154', 'BX154'],
            ['4 1/16"', null, null, null, 'BX155', 'BX155', 'BX155'],
            ['5 1/8"', null, null, null, 'BX169', 'BX169', null],
            ['7 1/16"', null, null, null, 'BX156', 'BX156', 'BX156'],
            ['9"', null, null, null, 'BX157', 'BX157', 'BX157'],
            ['11"', null, null, null, 'BX158', 'BX158', 'BX158'],
            ['13 5/8"', null, null, 'BX160', 'BX159', 'BX159', 'BX159'],
            ['16 3/4"', null, null, 'BX162', 'BX162', null, null],
            ['18 3/4"', null, null, 'BX163', 'BX164', 'BX164', null],
            ['21 1/4"', null, null, 'BX165', 'BX165', null, null],
            ['26 1/4"', 'BX167', 'BX168', null, null, null, null],
            ['30"', 'BX303', 'BX303', null, null, null, null],
          ],
        },
        geometry: { type: 'bx' },
        photos: [],
      },
    ],
  },
  {
    id: 'union', order: 2, page: 4,
    name: es_en('Uniones dobles rápidas', 'Hammer unions'),
    short: es_en('Uniones', 'Unions'),
    desc: es_en(
      'Uniones de golpe con tuerca de tres aletas para líneas de petróleo, gas, agua y aire. Figuras 100 a 1502, serie 3000, unión simple y tipo Bowen.',
      'Hammer unions with three-lug wing nut for oil, gas, water and air lines. Figures 100 to 1502, 3000 series, single union and Bowen type.'),
    role: es_en(
      'Conexión desmontable de tramos de cañería y accesorios: líneas de lodo, standpipe, manifolds y líneas de tratamiento (cementación, fractura, pruebas). Figura, diámetro y presión deben corresponder a la aplicación.',
      'Quick-connect joint between pipe sections and fittings: mud lines, standpipe, manifolds and treating lines (cementing, fracturing, testing). Figure, size and pressure must match the service.'),
    scenes: ['rig', 'hpline'],
    geometry: 'union',
    photos: [photo('union-fig1502-p09.webp', 'Uniones FIG 1502 · catálogo p. 9', 'FIG 1502 unions · catalogue p. 9', 9), webPhoto('uniones-web.jpg', 'Uniones · sitio vitalmetsa.com', 'Unions · vitalmetsa.com')],
    variants: [
      union('union-fig100', 100, 'Unión doble FIG 100', 'Hammer union FIG 100', 5, '1.000 psi (69 bar)', '1,000 psi (69 bar)', ['6"', '8"'], [EXTREMOS_SW(5)], { nut: '#1d1d1d', body: '#e8a317' },
        [photo('union-fig100-p05.webp', 'Unión doble FIG 100 · catálogo p. 5', 'FIG 100 hammer union · catalogue p. 5', 5), photo('union-fig100-partes-p05.webp', 'FIG 100: tuerca y extremos · catálogo p. 5', 'FIG 100: nut and subs · catalogue p. 5', 5), photo('union-fig100-campo-p05.webp', 'FIG 100 en línea (campo) · catálogo p. 5', 'FIG 100 in a field line · catalogue p. 5', 5)]),
      union('union-fig200', 200, 'Unión doble FIG 200', 'Hammer union FIG 200', 6, '2.000 psi (138 bar)', '2,000 psi (138 bar)', ['2"', '3"', '4"', '5"', '6"', '8"'], [EXTREMOS_SW(6)], { nut: '#2b4c8c', body: '#8e9498' },
        [photo('union-fig200-p06.webp', 'Unión doble FIG 200 · catálogo p. 6', 'FIG 200 hammer union · catalogue p. 6', 6), photo('union-fig200-partes-p06.webp', 'FIG 200: tuerca y extremos · catálogo p. 6', 'FIG 200: nut and subs · catalogue p. 6', 6)]),
      union('union-fig206', 206, 'Unión doble FIG 206', 'Hammer union FIG 206', 6, '2.000 psi (138 bar)', '2,000 psi (138 bar)', ['2"', '3"', '4"', '6"', '8"'], [EXTREMOS_SW(6), ORING(6)], { nut: '#2b4c8c', body: '#8e9498' },
        [photo('union-fig206-p06.webp', 'Unión doble FIG 206 · catálogo p. 6', 'FIG 206 hammer union · catalogue p. 6', 6), photo('union-fig206-partes-p06.webp', 'FIG 206: tuerca y extremos · catálogo p. 6', 'FIG 206: nut and subs · catalogue p. 6', 6)]),
      union('union-fig207', 207, 'Unión doble FIG 207', 'Hammer union FIG 207', 6, '2.000 psi (138 bar)', '2,000 psi (138 bar)', ['3"', '4"', '6"', '8"'], [EXTREMOS_SW(6), ORING(6), spec(es_en('Compatibilidad', 'Compatibility'), es_en('Compatible con las figuras 200 y 206', 'Compatible with figures 200 and 206'), 6)], { nut: '#2b4c8c', body: '#8e9498' },
        [photo('union-fig207-partes-p06.webp', 'FIG 207: tuerca y extremos · catálogo p. 6', 'FIG 207: nut and subs · catalogue p. 6', 6)]),
      union('union-fig602', 602, 'Unión doble FIG 602', 'Hammer union FIG 602', 7, '6.000 psi (414 bar)', '6,000 psi (414 bar)', ['1"', '2"', '3"', '4"'], [EXTREMOS_SW(7), ORING(7)], { nut: '#1d1d1d', body: '#c8242a' },
        [photo('union-fig602-p07.webp', 'Unión doble FIG 602 · catálogo p. 7', 'FIG 602 hammer union · catalogue p. 7', 7), photo('union-fig602-partes-p07.webp', 'FIG 602: tuerca y extremos · catálogo p. 7', 'FIG 602: nut and subs · catalogue p. 7', 7), photo('union-fig602-campo-p07.webp', 'FIG 602 en línea (campo) · catálogo p. 7', 'FIG 602 in a field line · catalogue p. 7', 7)]),
      union('union-fig1002', 1002, 'Unión doble FIG 1002', 'Hammer union FIG 1002', 8, '10.000 psi (690 bar)', '10,000 psi (690 bar)', ['4"', '5"'], [EXTREMOS_SW(8), ORING(8)], { nut: '#1d1d1d', body: '#8e9498' },
        [photo('union-fig1002-p08.webp', 'Unión doble FIG 1002 · catálogo p. 8', 'FIG 1002 hammer union · catalogue p. 8', 8), photo('union-fig1002-partes-p08.webp', 'FIG 1002: tuerca y extremos · catálogo p. 8', 'FIG 1002: nut and subs · catalogue p. 8', 8)]),
      union('union-fig1003', 1003, 'Unión doble FIG 1003', 'Hammer union FIG 1003', 8, '10.000 psi (690 bar)', '10,000 psi (690 bar)', ['4"', '5"'], [EXTREMOS_SW(8), ORING(8)], { nut: '#1d1d1d', body: '#8e9498' },
        [photo('union-fig1003-p08.webp', 'Unión doble FIG 1003 · catálogo p. 8', 'FIG 1003 hammer union · catalogue p. 8', 8), photo('union-fig1003-partes-p08.webp', 'FIG 1003: tuerca y extremos · catálogo p. 8', 'FIG 1003: nut and subs · catalogue p. 8', 8)]),
      union('union-fig1502', 1502, 'Unión doble FIG 1502', 'Hammer union FIG 1502', 9, '15.000 psi (1.034 bar)', '15,000 psi (1,034 bar)', ['2"', '3"', '4"'],
        [spec(es_en('Extremos', 'End connections'), es_en('Roscados según norma API o para soldar BUTT WELD', 'Threaded to API standard or BUTT WELD ends'), 9),
         spec(es_en('Sellado', 'Sealing'), es_en('Empaquetadura reemplazable en cualquier momento', 'Replaceable seal ring'), 9),
         spec(es_en('Aplicaciones', 'Applications'), es_en('Líneas de cementación, fracturación, pruebas y líneas de estrangulación y estabilización', 'Cementing, fracturing and test lines; choke and kill lines'), 9)],
        { nut: '#2b4c8c', body: '#c8242a' },
        [photo('union-fig1502-p09.webp', 'Uniones dobles FIG 1502 · catálogo p. 9', 'FIG 1502 hammer unions · catalogue p. 9', 9), photo('union-fig1502-campo-p09.webp', 'FIG 1502 en manifold (campo) · catálogo p. 9', 'FIG 1502 on a manifold (field) · catalogue p. 9', 9)]),
      union('union-serie3000', 3000, 'Unión doble Serie 3000', 'Hammer union 3000 series', 10, '3.000 psi (207 bar)', '3,000 psi (207 bar)', ['1"', '2"', '3"', '4"', '5"', '6"', '8"', '10"', '12"'], [EXTREMOS_SW(10), ORING(10)], { nut: '#2b4c8c', body: '#8e9498' },
        [photo('union-serie3000-p10.webp', 'Unión doble Serie 3000 · catálogo p. 10', '3000 series hammer union · catalogue p. 10', 10), photo('union-serie3000-partes-p10.webp', 'Serie 3000: tuerca y extremos · catálogo p. 10', '3000 series: nut and subs · catalogue p. 10', 10), photo('union-serie3000-campo-p10.webp', 'Serie 3000 en línea (campo) · catálogo p. 10', '3000 series in a field line · catalogue p. 10', 10)]),
      {
        id: 'union-simple', name: es_en('Unión simple', 'Single union'), page: 11, sizes: ['6"', '8"', '10"', '12"', '14"'], pressure: null,
        specs: [
          spec(es_en('Tamaños', 'Sizes'), es_en('6" · 8" · 10" · 12" · 14"', '6" · 8" · 10" · 12" · 14"'), 11),
          spec(es_en('Extremos', 'End connections'), es_en('Rosca hembra o para soldar', 'Female thread or weld ends'), 11),
          spec(es_en('Sello', 'Seal'), es_en('Junta de BUNA-N', 'BUNA-N gasket'), 11),
          spec(es_en('Presión', 'Pressure'), es_en('Resistencia a altas presiones incluso con cierre manual; el catálogo no publica un valor nominal.', 'High-pressure capable even with hand tightening; the catalogue publishes no nominal rating.'), 11),
          spec(es_en('Mantenimiento', 'Maintenance'), es_en('Diseño simple, ajuste sin herramientas especiales', 'Simple design, no special tools for make-up'), 11),
        ],
        geometry: { type: 'union', fig: 'simple', nut: '#2b4c8c', body: '#8e9498', lugs: 2 },
        photos: [photo('union-simple-p11.webp', 'Unión simple · catálogo p. 11', 'Single union · catalogue p. 11', 11), photo('union-simple-b-p11.webp', 'Unión simple (vista 2) · catálogo p. 11', 'Single union (view 2) · catalogue p. 11', 11)],
      },
      {
        id: 'union-bowen', name: es_en('Unión doble tipo Bowen', 'Bowen-type union'), page: 11, sizes: ['2"', '3"'], pressure: null,
        specs: [
          spec(es_en('Tamaños', 'Sizes'), es_en('2" · 3"', '2" · 3"'), 11),
          spec(es_en('Aplicación', 'Application'), es_en('Maniobra de fractura; el collar no posee orejas para golpe de martillo', 'Fracturing operations; the collar has no hammer lugs'), 11),
          spec(es_en('Sellos', 'Seals'), es_en('O-ring de NBR reemplazable como cierre primario', 'Replaceable NBR O-ring as primary seal'), 11),
          spec(es_en('Intercambiabilidad', 'Interchangeability'), es_en('Partes similares intercambiables', 'Similar parts are interchangeable'), 11),
          spec(es_en('Presión de trabajo', 'Working pressure'), es_en('No informada en el catálogo', 'Not stated in the catalogue'), 11, PEND),
        ],
        geometry: { type: 'union', fig: 'bowen', nut: '#2a2a2a', body: '#e8641b', lugs: 0 },
        photos: [photo('union-bowen-p11.webp', 'Unión tipo Bowen · catálogo p. 11', 'Bowen-type union · catalogue p. 11', 11), photo('union-bowen-b-p11.webp', 'Unión tipo Bowen (vista 2) · catálogo p. 11', 'Bowen-type union (view 2) · catalogue p. 11', 11)],
      },
    ],
  },
  {
    id: 'valvula', order: 3, page: 12,
    name: es_en('Válvulas y kits de reparación', 'Valves and repair kits'),
    short: es_en('Válvulas', 'Valves'),
    desc: es_en(
      'Válvulas tapón balanceado (VTB) roscadas e integrales, válvulas de asiento expandible (VAE) y kits de suplementos para VTB integrales.',
      'Balanced plug valves (VTB), threaded and integral, expanding-seat gate valves (VAE) and repair kits for integral VTB valves.'),
    role: es_en(
      'Control abierto/cerrado del paso de fluido en líneas de alta presión (cementación, fractura, acidificación, lodo) y en cabezas de pozo y manifolds de producción.',
      'On/off control of flow in high-pressure lines (cementing, fracturing, acidizing, mud) and at wellheads and production manifolds.'),
    scenes: ['rig', 'hpline'],
    geometry: 'valve',
    photos: [photo('vtb-p12.webp', 'Válvula tapón balanceado · catálogo p. 12', 'Balanced plug valve · catalogue p. 12', 12)],
    variants: [
      {
        id: 'vtb', name: es_en('Válvula tapón balanceado (VTB)', 'Balanced plug valve (VTB)'), page: 12, sizes: ['1"', '2"', '3"', '3" paso total'], pressure: null,
        specs: [
          spec(es_en('Tamaños', 'Sizes'), es_en('1", 2" y 3"; también 3" paso total', '1", 2" and 3"; also 3" full bore'), 12),
          spec(es_en('Servicio', 'Service'), es_en('Estándar o corrosivo; operación abierto/cerrado', 'Standard or sour service; open/close duty'), 12),
          spec(es_en('Aplicaciones', 'Applications'), es_en('Cementación, fracturación y acidificación; líneas de alta presión (inyección, abrasivos, lodo de perforación y otros productos químicos)', 'Cementing, fracturing and acidizing; high-pressure lines (injection, abrasives, drilling mud and other chemicals)'), 12),
          spec(es_en('Operación bajo presión', 'Operation under pressure'), es_en('El vástago pistón encaja en un juego de cuatro segmentos (dos segmentos asiento y dos separadores) y evita que el tapón se pegue al cuerpo', 'The piston stem engages a set of four segments (two seat segments and two spacers) and prevents the plug from sticking to the body'), 12),
          spec(es_en('Sellado', 'Sealing'), es_en('Los dos segmentos asiento flotan levemente para absorber microexpansiones del cuerpo', 'The two seat segments float slightly to absorb body micro-expansion'), 12),
          spec(es_en('Indicación', 'Indication'), es_en('Topes en la tapa que indican abierto/cerrado; sin herramientas especiales', 'Stops on the bonnet indicate open/closed; no special tools'), 12),
          spec(es_en('Presión de trabajo', 'Working pressure'), es_en('No informada en la página 12 para la versión roscada', 'Not stated on page 12 for the threaded version'), 12, PEND),
        ],
        geometry: { type: 'plugvalve', integral: false, body: '#c8242a', handle: 'T' },
        explode: { source: 12, documented: true, parts: ['cuerpo', 'tapon', 'segAsiento', 'segSeparador', 'sellos', 'tapa', 'manija'] },
        photos: [photo('vtb-p12.webp', 'VTB roscada · catálogo p. 12', 'Threaded VTB · catalogue p. 12', 12), photo('vtb-kit-p12.webp', 'VTB: vástago pistón, segmentos y sellos · catálogo p. 12', 'VTB: piston stem, segments and seals · catalogue p. 12', 12), photo('vtb-campo-p12.webp', 'VTB en manifold (campo) · catálogo p. 12', 'VTB on a manifold (field) · catalogue p. 12', 12), webPhoto('vtb-manija-t.jpg', 'VTB con manija en T · sitio vitalmetsa.com', 'VTB with T-handle · vitalmetsa.com'), webPhoto('vtb-volante.jpg', 'VTB con volante · sitio vitalmetsa.com', 'VTB with handwheel · vitalmetsa.com')],
      },
      {
        id: 'vtb-integral', name: es_en('Válvula tapón balanceado integral', 'Integral balanced plug valve'), page: 13, sizes: ['2" x 1" FIG 1502', '2" FIG 602', '2" FIG 1502', '3" FIG 602', '3" FIG 1502'], pressure: 'hasta 15.000 psi (según figura)',
        specs: [
          spec(es_en('Tamaños comercializados', 'Sizes offered'), es_en('2" x 1" FIG 1502 · 2" FIG 602 · 2" FIG 1502 · 3" FIG 602 · 3" FIG 1502', '2" x 1" FIG 1502 · 2" FIG 602 · 2" FIG 1502 · 3" FIG 602 · 3" FIG 1502'), 13),
          spec(es_en('Extremos', 'End connections'), es_en('Compatibles con conexiones WECO; cuerpo completamente integral', 'WECO-compatible ends; fully integral body'), 13),
          spec(es_en('Accionamiento', 'Actuation'), es_en('Volante con tope de cuarto de vuelta que indica abierto/cerrado', 'Handwheel with quarter-turn stop indicating open/closed'), 13),
          spec(es_en('Presión de trabajo en frío', 'Cold working pressure'), es_en('El texto indica que se logran 15.000 psi. No corresponde asignar ese valor a las variantes FIG 602 (unión de 6.000 psi); confirmar por figura con ventas.', 'The text states 15,000 psi is achieved. That value should not be assigned to FIG 602 variants (6,000 psi union); confirm per figure with sales.'), 13, INF),
          spec(es_en('Mantenimiento', 'Maintenance'), es_en('Completo en línea con herramientas estándar; kits de reparación disponibles (p. 15)', 'Full in-line maintenance with standard tools; repair kits available (p. 15)'), 13),
          spec(es_en('Observación', 'Note'), es_en('En la página 13 la lista de tamaños y los rótulos de las fotos ("FIG 1502 1" 2" 3"", "FIG 602 1"") no coinciden. Dato registrado en DATOS-POR-CONFIRMAR.', 'On page 13 the size list and the photo captions ("FIG 1502 1" 2" 3"", "FIG 602 1"") do not match. Logged in DATOS-POR-CONFIRMAR.'), 13, INF),
        ],
        geometry: { type: 'plugvalve', integral: true, body: '#c8242a', nut: '#2b4c8c', handle: 'wheel' },
        explode: { source: 13, documented: true, parts: ['cuerpo', 'tapon', 'segAsiento', 'segSeparador', 'sellos', 'tapa', 'volante', 'tuerca', 'segmentosUnion', 'aroRetencion'] },
        photos: [photo('vtb-integral-fig1502-p13.webp', 'VTB integral FIG 1502 con tuerca, segmentos y aro · catálogo p. 13', 'Integral VTB FIG 1502 with nut, segments and ring · catalogue p. 13', 13), photo('vtb-integral-fig602-p13.webp', 'VTB integral FIG 602 · catálogo p. 13', 'Integral VTB FIG 602 · catalogue p. 13', 13), photo('vtb-integral-campo-p13.webp', 'VTB integral en línea (campo) · catálogo p. 13', 'Integral VTB in a field line · catalogue p. 13', 13), webPhoto('vtb-integral-tuerca.jpg', 'VTB integral · sitio vitalmetsa.com', 'Integral VTB · vitalmetsa.com')],
      },
      {
        id: 'vae', name: es_en('Válvula de asiento expandible (VAE)', 'Expanding-seat gate valve (VAE)'), page: 14, sizes: ['2"-5000 (plano p. 14)'], pressure: '3.000 a 5.000 psi',
        specs: [
          spec(es_en('Presión de trabajo', 'Working pressure'), es_en('Rangos API de 3.000 a 5.000 psi (fabricación estándar)', 'API ranges of 3,000 to 5,000 psi (standard manufacture)'), 14),
          spec(es_en('Extremos', 'End connections'), es_en('Roscados, bridados o para soldar; todos los estilos y series', 'Threaded, flanged or weld ends; all styles and series'), 14),
          spec(es_en('Aplicaciones', 'Applications'), es_en('Cabezas de pozo, manifolds de producción, líneas de inyección de fluidos abrasivos y agua corrosiva, proyectos de inyección de CO₂', 'Wellheads, production manifolds, abrasive-fluid and corrosive-water injection lines, CO₂ injection projects'), 14),
          spec(es_en('Mantenimiento', 'Maintenance'), es_en('Se desarma para inspección o reparación sin retirar la cañería; repuestos reemplazables en campo', 'Can be stripped for inspection or repair without removing it from the line; parts replaceable in the field'), 14),
          spec(es_en('Tamaños', 'Sizes'), es_en('El catálogo muestra el plano de la válvula Ø 2"-5000 psi; otros tamaños no se enumeran', 'The catalogue shows the drawing of the 2"-5000 psi valve; other sizes are not listed'), 14, PEND),
        ],
        geometry: { type: 'gatevalve', body: '#c8242a' },
        // Despiece documentado: plano "Válvula autoexpandible Ø 2"-5000 psi", catálogo p. 14.
        explode: { source: 14, documented: true, parts: ['alemite', 'volante', 'chaveta', 'manija', 'buje', 'empCapuchon', 'capuchon', 'anilloReten', 'empAnilloReten', 'bujeEmpaquetadura', 'tornilloTraba', 'empVastago', 'vastago', 'espina', 'empCuerpo', 'tapaRoscada', 'bonete', 'cuerpo', 'asiento', 'esclusa'] },
        photos: [photo('vae-p14.webp', 'Válvula VAE · catálogo p. 14', 'VAE valve · catalogue p. 14', 14), photo('vae-plano-despiece-p14.webp', 'Plano de despiece VAE Ø 2"-5000 psi con códigos 09E · catálogo p. 14', 'VAE Ø 2"-5000 psi sectional drawing with 09E part codes · catalogue p. 14', 14), photo('vae-partes-p14.webp', 'Repuestos VAE · catálogo p. 14', 'VAE spare parts · catalogue p. 14', 14), photo('vae-campo-p14.webp', 'VAE en línea (campo) · catálogo p. 14', 'VAE in a field line · catalogue p. 14', 14)],
      },
      { id: 'kit-09b-0036', name: es_en('Kit suplementos VTB integral 2" FIG 602 · 09B-0036', 'Repair kit, integral VTB 2" FIG 602 · 09B-0036'), page: 15, sizes: ['2" FIG 602'], code: '09B-0036',
        specs: [spec(es_en('Código', 'Part number'), es_en('09B-0036', '09B-0036'), 15), spec(es_en('Aplicación', 'Fits'), es_en('VTB Integral 2" FIG 602', 'Integral VTB 2" FIG 602'), 15), spec(es_en('Contenido', 'Contents'), es_en('Según foto: tuerca de unión, segmentos y aro de retención. El catálogo no enumera el contenido.', 'Per photo: union nut, segments and retaining ring. The catalogue does not list the contents.'), 15, INF)],
        geometry: { type: 'kit', nut: '#1d1d1d', size: 2 }, explode: { source: 15, documented: false, parts: ['tuerca', 'segmentosUnion', 'aroRetencion'] },
        photos: [photo('kit-vtb-p15-sup-izq.webp', 'Kit 09B-0036 · catálogo p. 15', 'Kit 09B-0036 · catalogue p. 15', 15)] },
      { id: 'kit-09b-0038', name: es_en('Kit suplementos VTB integral 2" FIG 1502 · 09B-0038', 'Repair kit, integral VTB 2" FIG 1502 · 09B-0038'), page: 15, sizes: ['2" FIG 1502'], code: '09B-0038',
        specs: [spec(es_en('Código', 'Part number'), es_en('09B-0038', '09B-0038'), 15), spec(es_en('Aplicación', 'Fits'), es_en('VTB Integral 2" FIG 1502', 'Integral VTB 2" FIG 1502'), 15), spec(es_en('Contenido', 'Contents'), es_en('Según foto: tuerca de unión, segmentos y aro de retención. El catálogo no enumera el contenido.', 'Per photo: union nut, segments and retaining ring. The catalogue does not list the contents.'), 15, INF)],
        geometry: { type: 'kit', nut: '#2b4c8c', size: 2 }, explode: { source: 15, documented: false, parts: ['tuerca', 'segmentosUnion', 'aroRetencion'] },
        photos: [photo('kit-vtb-p15-inf-izq.webp', 'Kit 09B-0038 · catálogo p. 15', 'Kit 09B-0038 · catalogue p. 15', 15)] },
      { id: 'kit-09b-0037', name: es_en('Kit suplementos VTB integral 3" FIG 602 · 09B-0037', 'Repair kit, integral VTB 3" FIG 602 · 09B-0037'), page: 15, sizes: ['3" FIG 602'], code: '09B-0037',
        specs: [spec(es_en('Código', 'Part number'), es_en('09B-0037', '09B-0037'), 15), spec(es_en('Aplicación', 'Fits'), es_en('VTB Integral 3" FIG 602', 'Integral VTB 3" FIG 602'), 15), spec(es_en('Contenido', 'Contents'), es_en('Según foto: tuerca de unión, segmentos y aro de retención. El catálogo no enumera el contenido.', 'Per photo: union nut, segments and retaining ring. The catalogue does not list the contents.'), 15, INF)],
        geometry: { type: 'kit', nut: '#1d1d1d', size: 3 }, explode: { source: 15, documented: false, parts: ['tuerca', 'segmentosUnion', 'aroRetencion'] },
        photos: [photo('kit-vtb-p15-sup-der.webp', 'Kit 09B-0037 · catálogo p. 15', 'Kit 09B-0037 · catalogue p. 15', 15)] },
      { id: 'kit-09b-0039', name: es_en('Kit suplementos VTB integral 3" FIG 1502 · 09B-0039', 'Repair kit, integral VTB 3" FIG 1502 · 09B-0039'), page: 15, sizes: ['3" FIG 1502'], code: '09B-0039',
        specs: [spec(es_en('Código', 'Part number'), es_en('09B-0039', '09B-0039'), 15), spec(es_en('Aplicación', 'Fits'), es_en('VTB Integral 3" FIG 1502', 'Integral VTB 3" FIG 1502'), 15), spec(es_en('Contenido', 'Contents'), es_en('Según foto: tuerca de unión, segmentos y aro de retención. El catálogo no enumera el contenido.', 'Per photo: union nut, segments and retaining ring. The catalogue does not list the contents.'), 15, INF)],
        geometry: { type: 'kit', nut: '#2b4c8c', size: 3 }, explode: { source: 15, documented: false, parts: ['tuerca', 'segmentosUnion', 'aroRetencion'] },
        photos: [photo('kit-vtb-p15-inf-der.webp', 'Kit 09B-0039 · catálogo p. 15', 'Kit 09B-0039 · catalogue p. 15', 15)] },
    ],
  },
  {
    id: 'codo', order: 4, page: 16,
    name: es_en('Codos integrales', 'Integral elbows'),
    short: es_en('Codos integrales', 'Integral elbows'),
    desc: es_en('Codos integrales de 2" con extremos de unión doble, en FIG 602 (6.000 psi) y FIG 1502 (15.000 psi).', '2" integral elbows with hammer-union ends, in FIG 602 (6,000 psi) and FIG 1502 (15,000 psi).'),
    role: es_en('Cambio de dirección en líneas de lodo, prueba, agua, cementación, circulación, estrangulación y estabilización, sin soldaduras ni roscas intermedias.', 'Change of direction in mud, test, water, cementing, circulation, choke and kill lines, without intermediate welds or threads.'),
    scenes: ['rig', 'hpline'],
    geometry: 'elbow',
    photos: [photo('codo-integral-fig1502-p16.webp', 'Codo integral FIG 1502 · catálogo p. 16', 'FIG 1502 integral elbow · catalogue p. 16', 16)],
    variants: [
      { id: 'codo-fig602', name: es_en('Codo integral 2" FIG 602', 'Integral elbow 2" FIG 602'), page: 16, sizes: ['2"'], pressure: '6.000 psi',
        specs: [spec(es_en('Diámetro', 'Size'), es_en('2"', '2"'), 16), spec(es_en('Presión de trabajo en frío', 'Cold working pressure'), es_en('6.000 psi', '6,000 psi'), 16), spec(es_en('Aplicaciones', 'Applications'), es_en('Líneas de lodo, líneas de prueba, líneas de agua, mangueras de cementación y circulación, líneas de estrangulación y estabilización', 'Mud lines, test lines, water lines, cementing and circulating hoses, choke and kill lines'), 16)],
        geometry: { type: 'elbow', fig: 602, nut: '#1d1d1d', body: '#c8242a' }, explode: { source: 16, documented: false, parts: ['cuerpoCodo', 'tuerca', 'segmentosUnion', 'aroRetencion'] },
        photos: [photo('codo-integral-fig602-p16.webp', 'Codo integral FIG 602 · catálogo p. 16', 'FIG 602 integral elbow · catalogue p. 16', 16), webPhoto('codo-integral-602.jpg', 'Codo integral FIG 602 · sitio vitalmetsa.com', 'FIG 602 integral elbow · vitalmetsa.com')] },
      { id: 'codo-fig1502', name: es_en('Codo integral 2" FIG 1502', 'Integral elbow 2" FIG 1502'), page: 16, sizes: ['2"'], pressure: '15.000 psi',
        specs: [spec(es_en('Diámetro', 'Size'), es_en('2"', '2"'), 16), spec(es_en('Presión de trabajo en frío', 'Cold working pressure'), es_en('15.000 psi', '15,000 psi'), 16), spec(es_en('Aplicaciones', 'Applications'), es_en('Alta presión: líneas de estrangulación y estabilización, fracturación, mangueras de cementación y circulación, líneas de prueba', 'High pressure: choke and kill lines, fracturing, cementing and circulating hoses, test lines'), 16)],
        geometry: { type: 'elbow', fig: 1502, nut: '#2b4c8c', body: '#c8242a' }, explode: { source: 16, documented: false, parts: ['cuerpoCodo', 'tuerca', 'segmentosUnion', 'aroRetencion'] },
        photos: [photo('codo-integral-fig1502-p16.webp', 'Codo integral FIG 1502 con tuerca, segmentos y aro · catálogo p. 16', 'FIG 1502 integral elbow with nut, segments and ring · catalogue p. 16', 16), webPhoto('codo-integral-1502.jpg', 'Codo integral FIG 1502 · sitio vitalmetsa.com', 'FIG 1502 integral elbow · vitalmetsa.com')] },
    ],
  },
  {
    id: 'codo-giratorio', order: 5, page: 17,
    name: es_en('Codos giratorios', 'Swivel joints'),
    short: es_en('Codos giratorios', 'Swivel joints'),
    desc: es_en('Accesorios de acero forjado de 2" con uno, dos o tres giratorios integrales con rodamientos a bolillas, hasta 6.000 psi.', '2" forged-steel fittings with one, two or three integral swivels on ball bearings, up to 6,000 psi.'),
    role: es_en('Dan flexibilidad a cañerías rígidas de presión: absorben desalineaciones y movimientos entre la bomba y la línea, sin mangueras.', 'Give flexibility to rigid pressure piping: absorb misalignment and movement between pump and line, without hoses.'),
    scenes: ['rig', 'hpline'],
    geometry: 'swivel',
    photos: [photo('codo-giratorio-a-p17.webp', 'Codo giratorio · catálogo p. 17', 'Swivel joint · catalogue p. 17', 17)],
    variants: [
      { id: 'codo-giratorio-2', name: es_en('Codo giratorio 2"', 'Swivel joint 2"'), page: 17, sizes: ['2"'], pressure: '6.000 psi',
        specs: [
          spec(es_en('Tamaño', 'Size'), es_en('2"', '2"'), 17),
          spec(es_en('Presión máxima', 'Maximum pressure'), es_en('6.000 psi', '6,000 psi'), 17),
          spec(es_en('Material', 'Material'), es_en('Fabricados totalmente en acero forjado', 'Fully forged steel'), 17),
          spec(es_en('Configuraciones', 'Configurations'), es_en('Uno, dos o tres giratorios integrales', 'One, two or three integral swivels'), 17),
          spec(es_en('Rodamientos', 'Bearings'), es_en('Doble hilera de bolillas; pistas endurecidas por tratamiento térmico; absorben momentos flectores, cargas axiales y radiales', 'Double-row ball bearings; heat-treated hardened races; take bending moments, axial and radial loads'), 17),
          spec(es_en('Mantenimiento', 'Maintenance'), es_en('Empaquetadura resistente al agua, barro o petróleo; rodamientos lubricados por grasa a presión', 'Packing resistant to water, mud and oil; grease-lubricated bearings under pressure'), 17),
          spec(es_en('Extremos', 'End connections'), es_en('Roscados o biselados para soldar', 'Threaded or bevelled for welding'), 17),
        ],
        geometry: { type: 'swivel', swivels: 3, body: '#e8641b' }, explode: { source: 17, documented: false, parts: ['cuerpoGiratorio', 'rodamiento', 'empaquetadura', 'alemite'] },
        photos: [photo('codo-giratorio-a-p17.webp', 'Codo giratorio (config. 1) · catálogo p. 17', 'Swivel joint (config. 1) · catalogue p. 17', 17), photo('codo-giratorio-b-p17.webp', 'Codo giratorio (config. 2) · catálogo p. 17', 'Swivel joint (config. 2) · catalogue p. 17', 17), photo('codo-giratorio-campo-p17.webp', 'Codo giratorio en línea (campo) · catálogo p. 17', 'Swivel joint in a field line · catalogue p. 17', 17)] },
    ],
  },
  {
    id: 'pup-joint', order: 6, page: 18,
    name: es_en('Pup Joints', 'Pup joints'),
    short: es_en('Pup Joints', 'Pup joints'),
    desc: es_en('Tramos de cañería sin costura SCH 160 soldados con uniones Vitalmet en sus extremos, de 2", 3" y 4" y hasta 6 metros.', 'Seamless SCH 160 pipe sections welded with Vitalmet unions at both ends, 2", 3" and 4", up to 6 metres long.'),
    role: es_en('Tramos rectos de líneas de alta presión entre bomba, manifold y pozo (cementación, fractura, pruebas).', 'Straight sections of high-pressure lines between pump, manifold and well (cementing, fracturing, testing).'),
    scenes: ['rig', 'hpline'],
    geometry: 'pupjoint',
    photos: [photo('pup-joints-par-p18.webp', 'Pup joints · catálogo p. 18', 'Pup joints · catalogue p. 18', 18), webPhoto('pup-joints-planta-1.jpg', 'Pup joints en planta Vitalmet', 'Pup joints at the Vitalmet shop')],
    variants: [
      { id: 'pup-joint-std', name: es_en('Pup Joint Vitalmet', 'Vitalmet pup joint'), page: 18, sizes: ['2"', '3"', '4"'], pressure: 'según figura',
        specs: [
          spec(es_en('Medidas', 'Sizes'), es_en('2", 3" y 4"', '2", 3" and 4"'), 18),
          spec(es_en('Longitud', 'Length'), es_en('Hasta 6 metros', 'Up to 6 metres'), 18),
          spec(es_en('Figuras', 'Figures'), es_en('FIG 206, 602, 1002 y 1502', 'FIG 206, 602, 1002 and 1502'), 18),
          spec(es_en('Tubo', 'Pipe'), es_en('Sin costura SCH 160 (tubo S/C EN 10297)', 'Seamless SCH 160 (EN 10297 seamless tube)'), 18),
          spec(es_en('Uniones', 'Unions'), es_en('Se fabrican únicamente con uniones Vitalmet', 'Made exclusively with Vitalmet unions'), 18),
          spec(es_en('Soldadura', 'Welding'), es_en('Realizada por personal calificado bajo normas', 'Performed by qualified personnel under standards'), 18),
          spec(es_en('Ensayos', 'Testing'), es_en('A pedido del cliente y tercerizados: radiografías (tres placas por costura) y partículas magnéticas', 'On request and outsourced: radiography (three films per weld) and magnetic-particle inspection'), 18),
          spec(es_en('Presión de trabajo', 'Working pressure'), es_en('La del extremo de unión elegido (FIG 206: 2.000 psi · 602: 6.000 · 1002: 10.000 · 1502: 15.000)', 'That of the selected union figure (FIG 206: 2,000 psi · 602: 6,000 · 1002: 10,000 · 1502: 15,000)'), 18, INF),
        ],
        geometry: { type: 'pupjoint', nut: '#2b4c8c', body: '#c8242a' }, explode: { source: 18, documented: false, parts: ['tubo', 'extremoMacho', 'extremoHembra', 'tuerca'] },
        photos: [photo('pup-joints-par-p18.webp', 'Pup joints · catálogo p. 18', 'Pup joints · catalogue p. 18', 18), photo('pup-joint-p18.webp', 'Pup joint · catálogo p. 18', 'Pup joint · catalogue p. 18', 18), photo('pup-joints-campo-p18.webp', 'Pup joints en línea de tratamiento (campo) · catálogo p. 18', 'Pup joints on a treating line (field) · catalogue p. 18', 18), webPhoto('pup-joints-planta-1.jpg', 'Pup joints en planta Vitalmet', 'Pup joints at the Vitalmet shop'), webPhoto('pup-joints-planta-2.jpg', 'Pup joints en planta Vitalmet (2)', 'Pup joints at the Vitalmet shop (2)')] },
    ],
  },
  {
    id: 'campana', order: 7, page: 19,
    name: es_en('Campanas de freno', 'Brake drums (rims)'),
    short: es_en('Campanas', 'Brake drums'),
    desc: es_en('Campanas de freno fundidas en la aleación especial STCV desarrollada por Vitalmet, con tratamiento térmico completo y dureza ajustable hasta 60 HRC.', 'Brake drums cast in Vitalmet\'s proprietary STCV alloy, fully heat-treated, with hardness adjustable up to 60 HRC.'),
    role: es_en('Superficie de frenado del malacate (cuadro de maniobras) en equipos con freno de cinta. La ubicación mostrada es esquemática: no hay plano de montaje en el paquete.', 'Braking surface of the drawworks on band-brake rigs. The location shown is schematic: no assembly drawing is included in this package.'),
    scenes: ['rig'],
    geometry: 'drum',
    photos: [photo('campana-p19.webp', 'Campana de freno · catálogo p. 19', 'Brake drum · catalogue p. 19', 19), webPhoto('campana-web.jpg', 'Campana de freno · sitio vitalmetsa.com', 'Brake drum · vitalmetsa.com')],
    variants: [
      { id: 'campana-stcv', name: es_en('Campana de freno STCV', 'STCV brake drum'), page: 19, sizes: [], pressure: null,
        specs: [
          spec(es_en('Aleación', 'Alloy'), es_en('STCV (desarrollo Vitalmet); equivalencia: acero DIN 28 Ni Cr Mo V 85; microaleantes específicos', 'STCV (Vitalmet development); equivalent to DIN 28 Ni Cr Mo V 85 steel; specific micro-alloying'), 19),
          spec(es_en('Fusión', 'Melting'), es_en('Horno eléctrico: mínima presencia de impurezas, afino preciso; alto silicio para colabilidad y afino de grano', 'Electric furnace: minimal impurities, precise refining; high silicon for castability and grain refinement'), 19),
          spec(es_en('Tratamiento térmico', 'Heat treatment'), es_en('1) Homogeneización química a 1.200 °C · 2) Normalizado cíclico (grano 5–8 ASTM) · 3) Temple y revenido', '1) Chemical homogenisation at 1,200 °C · 2) Cyclic normalising (ASTM grain 5–8) · 3) Quench and temper'), 19),
          spec(es_en('Dureza', 'Hardness'), es_en('Se fija en el revenido; hasta 60 HRC; alta penetración de capa martensítica', 'Set during tempering; up to 60 HRC; deep martensitic hardening'), 19),
          spec(es_en('Beneficio', 'Benefit'), es_en('Mayor vida útil frente a campanas estándar; desgaste uniforme y prolongado', 'Longer life than standard drums; uniform, prolonged wear'), 19),
          spec(es_en('Dimensiones y equipos', 'Dimensions and rigs'), es_en('No informadas en el catálogo. Vitalmet dispone de planos para varios modelos de malacate (fuente: inventario interno de planos); consultar.', 'Not stated in the catalogue. Vitalmet holds drawings for several drawworks models (source: internal drawing inventory); enquire.'), 19, INF),
        ],
        geometry: { type: 'drum' }, explode: { source: 19, documented: false, parts: ['campana', 'cintaFreno', 'tamborMalacate'] },
        photos: [] },
    ],
  },
  {
    id: 'bombas', order: 8, page: 20,
    name: es_en('Accesorios y repuestos de bombas', 'Pump accessories and spares'),
    short: es_en('Repuestos de bombas', 'Pump spares'),
    desc: es_en('Repuestos mecanizados para bombas de lodo y equipos de perforación (fluid end y power end) y accesorios hidráulicos, fabricados a plano.', 'Machined spares for mud pumps and drilling equipment (fluid end and power end) plus hydraulic accessories, made to drawing.'),
    role: es_en('El catálogo enumera 18 ítems sin medidas ni modelos. Según el inventario interno de planos, Vitalmet fabrica repuestos para bombas National, Emsco, Ideco, Gardner Denver, Bonco, Lewco, LeTourneau, SJ Petro y Oilwell, entre otras (dato interno, no publicado en el catálogo).', 'The catalogue lists 18 items with no sizes or models. Per the internal drawing inventory, Vitalmet makes spares for National, Emsco, Ideco, Gardner Denver, Bonco, Lewco, LeTourneau, SJ Petro and Oilwell pumps, among others (internal data, not in the catalogue).'),
    scenes: ['rig', 'mudpump'],
    geometry: 'pump',
    photos: [photo('repuestos-vastagos-p20.webp', 'Repuestos mecanizados · catálogo p. 20', 'Machined spares · catalogue p. 20', 20)],
    variants: [
      ...[
        ['tapones-roscados', 'Tapones roscados', 'Threaded plugs', 'plug', 'fluid', 'repuestos-tapas-bridas-p20.webp'],
        ['bridas-roscadas', 'Bridas roscadas', 'Threaded flanges', 'flange', 'fluid', 'repuestos-brida-vastago-manual-p20.webp'],
        ['tuerca-camisa', 'Tuerca camisa', 'Liner nut', 'linerNut', 'fluid', 'repuestos-piston-tuerca-p20.webp'],
        ['tapa-valvula', 'Tapa de válvula', 'Valve cover', 'valveCover', 'fluid', 'repuestos-tapas-bridas-p20.webp'],
        ['plato-desgaste', 'Plato de desgaste', 'Wear plate', 'wearPlate', 'fluid', 'repuestos-tapas-bridas-p20.webp'],
        ['porta-vastagos', 'Porta vástagos grampados y roscados', 'Pony rods (clamped and threaded)', 'ponyRod', 'power', 'repuestos-vastago-brida-p20.webp'],
        ['vastagos', 'Vástagos roscados y grampados', 'Piston rods (threaded and clamped)', 'pistonRod', 'fluid', 'repuestos-vastagos-p20.webp'],
        ['grampa-vastagos', 'Grampa de vástagos', 'Rod clamp', 'rodClamp', 'fluid', 'repuestos-vastagos-p20.webp'],
        ['grampa-camisa', 'Grampa camisa', 'Liner clamp', 'linerClamp', 'fluid', 'repuestos-piston-tuerca-p20.webp'],
        ['guia-valvula', 'Guía de válvula', 'Valve guide', 'valveGuide', 'fluid', 'repuestos-tapas-bridas-p20.webp'],
        ['pistones', 'Pistones completos', 'Complete pistons', 'piston', 'fluid', 'repuestos-piston-tuerca-p20.webp'],
        ['ejes-esclusa', 'Ejes de esclusa', 'Gate shafts', 'gateShaft', 'other', 'repuestos-vastagos-p20.webp'],
        ['vastago-manual', 'Vástago manual', 'Manual stem', 'manualStem', 'other', 'repuestos-brida-vastago-manual-p20.webp'],
        ['resortes', 'Resortes', 'Springs', 'spring', 'fluid', 'repuestos-tapas-bridas-p20.webp'],
        ['embolo-buzo', 'Émbolo buzo', 'Plunger', 'plunger', 'other', 'repuestos-vastagos-p20.webp'],
        ['cano-lavador', 'Caño lavador', 'Wash pipe', 'washPipe', 'other', 'repuestos-vastagos-p20.webp'],
        ['economizador', 'Economizador hidráulico', 'Hydraulic economiser', 'economiser', 'accessory', 'accesorio-economizador-p20.webp'],
        ['bomba-economizador', 'Bomba del economizador', 'Economiser pump', 'economiserPump', 'accessory', 'accesorio-bomba-economizador-p20.webp'],
      ].map(([id, es, en, geo, zone, img]) => ({
        id: `bombas-${id}`, name: es_en(es, en), page: 20, sizes: [], pressure: null, zone,
        specs: [
          spec(es_en('Listado', 'Listing'), es_en(zone === 'accessory' ? 'Accesorio listado en el catálogo (p. 20)' : 'Repuesto listado en el catálogo (p. 20)', zone === 'accessory' ? 'Accessory listed in the catalogue (p. 20)' : 'Spare part listed in the catalogue (p. 20)'), 20),
          spec(es_en('Fabricación', 'Manufacture'), es_en('Desarrollado y fabricado en Vitalmet; cumple con requerimientos y normas, apto para diferentes equipos de perforación (texto del catálogo)', 'Developed and manufactured by Vitalmet; meets requirements and standards, suitable for different drilling rigs (catalogue text)'), 20),
          spec(es_en('Medidas / modelo / material', 'Sizes / model / material'), es_en('No informados en el catálogo; se fabrica a plano según equipo. Consultar con ventas indicando marca y modelo de bomba.', 'Not stated in the catalogue; made to drawing per pump. Enquire with sales stating pump make and model.'), 20, PEND),
        ],
        geometry: { type: 'pumpPart', part: geo },
        photos: [photo(img, `${es} (foto de familia, identificación visual) · catálogo p. 20`, `${en} (family photo, visual identification) · catalogue p. 20`, 20)],
      })),
    ],
  },
];

// Fotos web adicionales asignadas a variantes por identificación visual (no confirmadas por Vitalmet).
const extraWeb = {
  'bombas-economizador': [webPhoto('economizador-y-bomba.jpg', 'Economizador hidráulico y bomba · sitio vitalmetsa.com', 'Hydraulic economiser and pump · vitalmetsa.com')],
  'bombas-bomba-economizador': [webPhoto('economizador-y-bomba.jpg', 'Economizador hidráulico y bomba · sitio vitalmetsa.com', 'Hydraulic economiser and pump · vitalmetsa.com')],
  'bombas-vastagos': [webPhoto('vastagos-ejes-mecanizados.jpg', 'Vástagos y ejes mecanizados · sitio vitalmetsa.com', 'Machined rods and shafts · vitalmetsa.com')],
  'bombas-porta-vastagos': [webPhoto('vastagos-ejes-mecanizados.jpg', 'Vástagos y ejes mecanizados · sitio vitalmetsa.com', 'Machined rods and shafts · vitalmetsa.com')],
  'bombas-bridas-roscadas': [webPhoto('brida-roscada-vastago-manual.jpg', 'Brida roscada y vástago manual · sitio vitalmetsa.com', 'Threaded flange and manual stem · vitalmetsa.com')],
  'bombas-vastago-manual': [webPhoto('brida-roscada-vastago-manual.jpg', 'Brida roscada y vástago manual · sitio vitalmetsa.com', 'Threaded flange and manual stem · vitalmetsa.com')],
  'bombas-pistones': [webPhoto('piston-tuerca-camisa-brida.jpg', 'Pistón, tuerca camisa y brida · sitio vitalmetsa.com', 'Piston, liner nut and flange · vitalmetsa.com')],
  'bombas-tuerca-camisa': [webPhoto('piston-tuerca-camisa-brida.jpg', 'Pistón, tuerca camisa y brida · sitio vitalmetsa.com', 'Piston, liner nut and flange · vitalmetsa.com')],
  'codo-giratorio-2': [webPhoto('codo-giratorio-web.jpg', 'Codo giratorio · sitio vitalmetsa.com', 'Swivel joint · vitalmetsa.com')],
  'kit-09b-0036': [webPhoto('kit-vtb-despiece.jpg', 'Despiece VTB · sitio vitalmetsa.com', 'VTB parts · vitalmetsa.com')],
  'kit-09b-0037': [webPhoto('tuerca-union-segmentos-3.jpg', 'Tuerca, segmentos y aro · sitio vitalmetsa.com', 'Nut, segments and ring · vitalmetsa.com')],
  'kit-09b-0038': [webPhoto('tuerca-union-segmentos-2.jpg', 'Tuerca, segmentos y aro · sitio vitalmetsa.com', 'Nut, segments and ring · vitalmetsa.com')],
};
for (const f of families) for (const v of f.variants) if (extraWeb[v.id]) v.photos.push(...extraWeb[v.id]);

// Modelos 3D generados desde planos Vitalmet (build123d → GLB). Cada uno indica su plano de origen y simplificaciones.
const models = {
  'bombas-vastagos': {
    src: 'assets/modelos/01E-0002-vastago-national-8p80.glb', unit: 0.001, up: 'z',
    plano: '01E-0002', rev: '00', fecha: '04-06-04',
    note: es_en('Modelo 3D generado con build123d a partir del plano Vitalmet 01E-0002 (Vástago p/bomba National 8-P-80, SAE 1045, L 525 mm). Cotas principales del plano; moleteado y rosca 1 3/8"-8UN simplificados; el diámetro del cuerpo entre moleteados se tomó Ø61: confirmar.', '3D model generated with build123d from Vitalmet drawing 01E-0002 (piston rod for National 8-P-80 pump, SAE 1045, L 525 mm). Main drawing dimensions; knurling and 1 3/8"-8UN thread simplified; body diameter between knurls assumed Ø61: to confirm.'),
  },
};
for (const f of families) for (const v of f.variants) if (models[v.id]) { v.model = models[v.id]; v.specs.push(spec(es_en('Modelo 3D', '3D model'), models[v.id].note, 20, INF)); }

// Nombres de piezas de los despieces (ES/EN). Los de la VAE llevan el código 09E del plano de la página 14.
export const partNames = {
  // Unión / codo / pup joint (esquemático, basado en fotos p. 4–16)
  tuerca: es_en('Tuerca de tres aletas', 'Three-lug wing nut'),
  extremoMacho: es_en('Extremo macho (con sello)', 'Male sub (with seal)'),
  extremoHembra: es_en('Extremo hembra (roscado)', 'Female sub (threaded)'),
  sello: es_en('O-ring / empaquetadura', 'O-ring / seal ring'),
  segmentosUnion: es_en('Segmentos', 'Segments'),
  aroRetencion: es_en('Aro de retención', 'Retaining ring'),
  tubo: es_en('Tubo sin costura SCH 160', 'Seamless SCH 160 pipe'),
  cuerpoCodo: es_en('Cuerpo del codo (integral)', 'Elbow body (integral)'),
  cuerpoGiratorio: es_en('Cuerpo forjado', 'Forged body'),
  rodamiento: es_en('Giratorio con rodamiento de doble hilera', 'Swivel with double-row ball bearing'),
  empaquetadura: es_en('Empaquetadura', 'Packing'),
  alemite: es_en('Alemite (engrasador)', 'Grease fitting (alemite)'),
  // VTB (p. 12)
  cuerpo: es_en('Cuerpo', 'Body'),
  tapon: es_en('Vástago pistón (tapón)', 'Piston stem (plug)'),
  segAsiento: es_en('Segmentos asiento (2)', 'Seat segments (2)'),
  segSeparador: es_en('Segmentos separadores (2)', 'Spacer segments (2)'),
  sellos: es_en('Sellos', 'Seals'),
  tapa: es_en('Tapa con topes abierto/cerrado', 'Bonnet with open/closed stops'),
  manija: es_en('Manija', 'Handle'),
  volante: es_en('Volante', 'Handwheel'),
  // VAE (plano p. 14, códigos 09E)
  chaveta: es_en('Chaveta (09E-0017)', 'Key (09E-0017)'),
  buje: es_en('Buje (09E-0007)', 'Bushing (09E-0007)'),
  empCapuchon: es_en('Empaquetadura del capuchón (09E-0018)', 'Cap packing (09E-0018)'),
  capuchon: es_en('Capuchón (09E-0008)', 'Cap (09E-0008)'),
  anilloReten: es_en('Anillo retén (09E-0014)', 'Retainer ring (09E-0014)'),
  empAnilloReten: es_en('Empaquetadura del anillo retén (09E-0019)', 'Retainer ring packing (09E-0019)'),
  bujeEmpaquetadura: es_en('Buje empaquetadura (09E-0011)', 'Packing bushing (09E-0011)'),
  tornilloTraba: es_en('Tornillo traba buje (09E-0021)', 'Bushing lock screw (09E-0021)'),
  empVastago: es_en('Empaquetadura del vástago (09E-0016)', 'Stem packing (09E-0016)'),
  vastago: es_en('Vástago (09E-0005)', 'Stem (09E-0005)'),
  espina: es_en('Espina del cuerpo (09E-0022)', 'Body pin (09E-0022)'),
  empCuerpo: es_en('Empaquetadura del cuerpo (09E-0015)', 'Body gasket (09E-0015)'),
  tapaRoscada: es_en('Tapa roscada (09E-0013)', 'Threaded cap (09E-0013)'),
  bonete: es_en('Bonete (09E-0010)', 'Bonnet (09E-0010)'),
  asiento: es_en('Asiento (09E-0002)', 'Seat (09E-0002)'),
  esclusa: es_en('Esclusa (09E-0003)', 'Gate (09E-0003)'),
  // Campana (esquemático)
  campana: es_en('Campana de freno STCV (Vitalmet)', 'STCV brake drum (Vitalmet)'),
  cintaFreno: es_en('Cinta de freno (contexto)', 'Brake band (context)'),
  tamborMalacate: es_en('Tambor del malacate (contexto)', 'Drawworks drum (context)'),
};
// Sobrescrituras de nombre para piezas de la VAE que comparten clave con las VTB.
export const vaePartNames = {
  alemite: es_en('Alemite (09E-0020)', 'Grease fitting (09E-0020)'),
  volante: es_en('Volante (09E-0009)', 'Handwheel (09E-0009)'),
  manija: es_en('Manija (09E-0012)', 'Handle (09E-0012)'),
  cuerpo: es_en('Cuerpo (09E-0006)', 'Body (09E-0006)'),
};

// Despiece esquemático del fluid end de una bomba de lodo triplex (escena "Bomba de lodo").
// Sólo los ítems marcados vitalmet:true figuran en el catálogo (p. 20); el resto es contexto.
export const mudPumpParts = [
  { key: 'fluidEndBody', name: es_en('Módulo fluid end (contexto)', 'Fluid-end module (context)'), vitalmet: false },
  { key: 'liner', name: es_en('Camisa (contexto)', 'Liner (context)'), vitalmet: false },
  { key: 'valveSeat', name: es_en('Válvula y asiento (contexto)', 'Valve and seat (context)'), vitalmet: false },
  { key: 'piston', name: es_en('Pistón completo', 'Complete piston'), vitalmet: true, variant: 'bombas-pistones' },
  { key: 'pistonRod', name: es_en('Vástago roscado / grampado', 'Piston rod, threaded / clamped'), vitalmet: true, variant: 'bombas-vastagos' },
  { key: 'rodClamp', name: es_en('Grampa de vástagos', 'Rod clamp'), vitalmet: true, variant: 'bombas-grampa-vastagos' },
  { key: 'ponyRod', name: es_en('Porta vástagos', 'Pony rod'), vitalmet: true, variant: 'bombas-porta-vastagos' },
  { key: 'linerClamp', name: es_en('Grampa camisa', 'Liner clamp'), vitalmet: true, variant: 'bombas-grampa-camisa' },
  { key: 'linerNut', name: es_en('Tuerca camisa', 'Liner nut'), vitalmet: true, variant: 'bombas-tuerca-camisa' },
  { key: 'wearPlate', name: es_en('Plato de desgaste', 'Wear plate'), vitalmet: true, variant: 'bombas-plato-desgaste' },
  { key: 'valveCover', name: es_en('Tapa de válvula', 'Valve cover'), vitalmet: true, variant: 'bombas-tapa-valvula' },
  { key: 'plug', name: es_en('Tapón roscado', 'Threaded plug'), vitalmet: true, variant: 'bombas-tapones-roscados' },
  { key: 'valveGuide', name: es_en('Guía de válvula', 'Valve guide'), vitalmet: true, variant: 'bombas-guia-valvula' },
  { key: 'spring', name: es_en('Resorte de válvula', 'Valve spring'), vitalmet: true, variant: 'bombas-resortes' },
  { key: 'flange', name: es_en('Brida roscada (descarga)', 'Threaded flange (discharge)'), vitalmet: true, variant: 'bombas-bridas-roscadas' },
];

export const legacyVariantIndex = {
  // familia → [ids en el orden del snapshot anterior]; sirve para migrar referencias numéricas.
  union: ['union-fig100', 'union-fig200', 'union-fig206', 'union-fig207', 'union-fig602', 'union-fig1002', 'union-fig1003', 'union-fig1502', 'union-serie3000', 'union-simple', 'union-bowen'],
  'pup-joint': ['pup-joint-std'],
  codo: ['codo-fig602', 'codo-fig1502'],
  valvula: ['vtb', 'vtb-integral', 'vae', 'kit-09b-0036', 'kit-09b-0038', 'kit-09b-0037', 'kit-09b-0039'],
  'anillo-bx': ['bx-serie'],
  bombas: ['bombas-tapones-roscados', 'bombas-bridas-roscadas', 'bombas-tuerca-camisa', 'bombas-tapa-valvula', 'bombas-plato-desgaste', 'bombas-porta-vastagos', 'bombas-vastagos', 'bombas-grampa-vastagos', 'bombas-grampa-camisa', 'bombas-guia-valvula', 'bombas-pistones', 'bombas-ejes-esclusa', 'bombas-vastago-manual', 'bombas-resortes', 'bombas-embolo-buzo', 'bombas-cano-lavador', 'bombas-economizador', 'bombas-bomba-economizador'],
  campana: ['campana-stcv'],
  'codo-giratorio': ['codo-giratorio-2'],
};
