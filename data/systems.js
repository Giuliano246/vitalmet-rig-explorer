// Sistemas de un equipo de perforación y de una línea de tratamiento de alta presión.
// Explicaciones generales (no describen un equipo específico). Fuentes públicas identificables al pie de cada sistema.
// Taxonomía de referencia: rig.petromind.ai (inspeccionado el 2026-09-17: 7 sistemas, 823 componentes) y PetroWiki (SPE).
const es_en = (es, en) => ({ es, en });

export const sources = {
  petrowikiRig: { label: 'PetroWiki (SPE) — "Drilling rig components"', url: 'https://petrowiki.spe.org/Drilling_rig_components' },
  petrowikiMudPump: { label: 'PetroWiki (SPE) — "Mud pumps"', url: 'https://petrowiki.spe.org/Mud_pumps' },
  petrowikiBOP: { label: 'PetroWiki (SPE) — "Blowout preventers"', url: 'https://petrowiki.spe.org/Blowout_preventers' },
  api6a: { label: 'API Spec 6A — Wellhead and tree equipment (bridas 6B/6BX, anillos R/RX/BX)' },
  asmeB1620: { label: 'ASME B16.20 — Metallic gaskets for pipe flanges (ring-joint)' },
  api7k: { label: 'API Spec 7K — Drilling and well servicing equipment (malacates, frenos, sistemas de izaje)' },
  api53: { label: 'API Std 53 — Well control equipment systems for drilling wells (BOP)' },
  api16c: { label: 'API Spec 16C — Choke and kill equipment' },
  en10297: { label: 'EN 10297-1 — Seamless circular steel tubes for mechanical and general engineering purposes' },
  catalogo: { label: 'Catálogo de productos Vitalmet S.A. (PDF, 21 páginas, incluido)' },
  petromind: { label: 'rig.petromind.ai — Rig Explorer (referencia conceptual, inspeccionado 2026-09-17)', url: 'https://rig.petromind.ai/' },
};

export const systems = [
  {
    id: 'hoisting', scene: 'rig',
    name: es_en('Sistema de izaje', 'Hoisting system'),
    summary: es_en(
      'Levanta y baja la sarta de perforación y el revestimiento. Lo componen el mástil o torre, la corona, el aparejo (traveling block), el cable de perforación y el malacate (cuadro de maniobras), cuyo freno principal controla el descenso de cargas de decenas de toneladas.',
      'Raises and lowers the drill string and casing. It comprises the mast or derrick, crown block, travelling block, drilling line and the drawworks, whose main brake controls the descent of loads of tens of tonnes.'),
    components: es_en(['Mástil o torre', 'Corona y aparejo', 'Cable de perforación', 'Malacate (cuadro de maniobras)', 'Freno principal (cinta o disco) y freno auxiliar'], ['Mast or derrick', 'Crown and travelling block', 'Drilling line', 'Drawworks', 'Main brake (band or disc) and auxiliary brake']),
    vitalmet: es_en('Campanas de freno STCV para malacates con freno de cinta. En equipos modernos con freno a disco no aplica.', 'STCV brake drums for band-brake drawworks. Not applicable to modern disc-brake rigs.'),
    families: ['campana'],
    sources: ['petrowikiRig', 'api7k', 'catalogo'],
  },
  {
    id: 'rotating', scene: 'rig',
    name: es_en('Sistema de rotación', 'Rotating system'),
    summary: es_en(
      'Transmite el giro a la sarta: mediante top drive (motor colgado del aparejo) o mesa rotaria con kelly y cabeza de inyección (swivel). El caño lavador (wash pipe) es la pieza de desgaste que deja pasar el lodo desde la manguera rotaria hacia la sarta en rotación.',
      'Transmits rotation to the drill string: via a top drive (motor hung from the travelling block) or a rotary table with kelly and swivel. The wash pipe is the wear part that lets mud flow from the rotary hose into the rotating string.'),
    components: es_en(['Top drive o mesa rotaria', 'Cabeza de inyección (swivel) y caño lavador', 'Manguera rotaria', 'Sarta de perforación'], ['Top drive or rotary table', 'Swivel and wash pipe', 'Rotary hose', 'Drill string']),
    vitalmet: es_en('Caños lavadores (listados en la página 20 del catálogo, sin modelos publicados).', 'Wash pipes (listed on catalogue page 20, no models published).'),
    families: ['bombas'],
    sources: ['petrowikiRig', 'catalogo'],
  },
  {
    id: 'circulating', scene: 'rig',
    name: es_en('Sistema de circulación', 'Circulating system'),
    summary: es_en(
      'Bombea el lodo desde los tanques, por la línea de descarga de alta presión, el standpipe y la manguera rotaria hasta el trépano, y lo devuelve por el anular hasta las zarandas. Las bombas de lodo triplex son el equipo con más repuestos de desgaste del rig: pistones, camisas, válvulas, vástagos y sus fijaciones.',
      'Pumps mud from the tanks through the high-pressure discharge line, standpipe and rotary hose down to the bit, and returns it up the annulus to the shale shakers. Triplex mud pumps are the rig equipment with the most wear spares: pistons, liners, valves, rods and their fasteners.'),
    components: es_en(['Bombas de lodo triplex (fluid end y power end)', 'Amortiguador de pulsaciones', 'Línea de descarga y standpipe', 'Manguera rotaria', 'Tanques, zarandas y agitadores'], ['Triplex mud pumps (fluid end and power end)', 'Pulsation dampener', 'Discharge line and standpipe', 'Rotary hose', 'Tanks, shale shakers and agitators']),
    vitalmet: es_en('Repuestos de bomba (vástagos, porta vástagos, grampas, tuercas camisa, tapas de válvula, tapones, platos de desgaste, guías y resortes, pistones) y uniones, codos y válvulas de la línea de descarga y el standpipe.', 'Pump spares (piston rods, pony rods, clamps, liner nuts, valve covers, plugs, wear plates, guides and springs, pistons) plus unions, elbows and valves on the discharge line and standpipe.'),
    families: ['bombas', 'union', 'codo', 'codo-giratorio', 'valvula', 'pup-joint'],
    sources: ['petrowikiMudPump', 'petrowikiRig', 'catalogo'],
  },
  {
    id: 'wellcontrol', scene: 'rig',
    name: es_en('Control de pozo', 'Well control'),
    summary: es_en(
      'Conjunto de preventores (BOP) montado sobre el cabezal en el sótano del equipo, con líneas de estrangulación y ahogo (choke & kill) hacia el manifold de estrangulación y el acumulador hidráulico. Las bridas 6BX del stack se sellan con anillos metálicos BX.',
      'Blowout-preventer stack mounted on the wellhead in the cellar, with choke and kill lines running to the choke manifold and the hydraulic accumulator unit. The stack\'s 6BX flanges are sealed with metal BX ring gaskets.'),
    components: es_en(['Preventor anular y de esclusas (rams)', 'Carreteles y bridas 6BX con anillos BX', 'Líneas de estrangulación y ahogo', 'Manifold de estrangulación', 'Unidad acumuladora'], ['Annular and ram preventers', 'Spools and 6BX flanges with BX rings', 'Choke and kill lines', 'Choke manifold', 'Accumulator unit']),
    vitalmet: es_en('Anillos BX (p. 3), uniones FIG 1502 y codos integrales para líneas de estrangulación y estabilización (p. 9 y 16), ejes de esclusa y vástagos manuales (p. 20).', 'BX rings (p. 3), FIG 1502 unions and integral elbows for choke and kill lines (p. 9 and 16), gate shafts and manual stems (p. 20).'),
    families: ['anillo-bx', 'union', 'codo', 'bombas'],
    sources: ['petrowikiBOP', 'api53', 'api6a', 'api16c', 'asmeB1620', 'catalogo'],
  },
  {
    id: 'power', scene: 'rig',
    name: es_en('Potencia y energía', 'Power system'),
    summary: es_en(
      'Motores diésel y generadores, o alimentación de red, que mueven malacate, bombas y top drive. En equipos mecánicos la transmisión es por cadenas y compound; en equipos eléctricos, por motores de CA con variadores.',
      'Diesel engines and generators, or grid supply, driving the drawworks, pumps and top drive. Mechanical rigs use chain drives and a compound; electric rigs use AC motors with variable-frequency drives.'),
    components: es_en(['Motores y generadores', 'Casa de fuerza / VFD', 'Transmisión (compound o eléctrica)'], ['Engines and generators', 'Power house / VFD', 'Transmission (compound or electric)']),
    vitalmet: es_en('Sin productos Vitalmet en este sistema.', 'No Vitalmet products in this system.'),
    families: [],
    sources: ['petrowikiRig'],
  },
  {
    id: 'structure', scene: 'rig',
    name: es_en('Estructura y piso de perforación', 'Structure and drill floor'),
    summary: es_en(
      'Subestructura, piso de perforación, casilla del perforador, pasarela (catwalk) y caballetes de tubería. Sostiene el mástil y las cargas del aparejo y aloja debajo el BOP.',
      'Substructure, drill floor, doghouse, catwalk and pipe racks. It supports the mast and hook loads and houses the BOP beneath it.'),
    components: es_en(['Subestructura', 'Piso y mesa rotaria', 'Casilla del perforador', 'Catwalk y caballetes'], ['Substructure', 'Floor and rotary table', 'Doghouse', 'Catwalk and pipe racks']),
    vitalmet: es_en('Sin productos Vitalmet en este sistema.', 'No Vitalmet products in this system.'),
    families: [],
    sources: ['petrowikiRig'],
  },
  {
    id: 'hpline', scene: 'hpline',
    name: es_en('Línea de tratamiento de alta presión', 'High-pressure treating line'),
    summary: es_en(
      'Línea temporaria armada en locación para cementación, fractura, acidificación o pruebas: desde las bombas de la unidad de bombeo, por codos giratorios, pup joints y uniones de golpe, hasta el manifold de válvulas y el árbol o cabezal. Se arma y desarma en horas; por eso usa uniones rápidas de figura (FIG) en lugar de bridas.',
      'Temporary line rigged up on location for cementing, fracturing, acidising or testing: from the pumping unit, through swivel joints, pup joints and hammer unions, to the valve manifold and the tree or wellhead. It is rigged up and down in hours, hence figure (FIG) hammer unions instead of flanges.'),
    components: es_en(['Unidad de bombeo', 'Codos giratorios (absorben movimiento)', 'Pup joints y uniones de golpe', 'Válvulas tapón y válvula de retención', 'Codos integrales', 'Árbol o cabezal con bridas 6BX'], ['Pumping unit', 'Swivel joints (absorb movement)', 'Pup joints and hammer unions', 'Plug valves and check valve', 'Integral elbows', 'Tree or wellhead with 6BX flanges']),
    vitalmet: es_en('Es el sistema donde Vitalmet cubre casi todos los componentes: uniones FIG 602/1002/1502, pup joints, codos integrales y giratorios, válvulas tapón balanceado integrales y kits, anillos BX en el árbol.', 'The system where Vitalmet covers almost every component: FIG 602/1002/1502 unions, pup joints, integral and swivel elbows, integral balanced plug valves and kits, BX rings at the tree.'),
    families: ['union', 'pup-joint', 'codo', 'codo-giratorio', 'valvula', 'anillo-bx'],
    sources: ['catalogo', 'api6a', 'en10297'],
  },
];
