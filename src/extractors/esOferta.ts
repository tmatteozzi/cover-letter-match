// DECIDE SI UNA PÁGINA ES UNA OFERTA LABORAL: PRIMERO POR URL (SITIOS CONOCIDOS), LUEGO POR TEXTO.

// PALABRAS TÍPICAS DE UNA OFERTA (ES/EN) PARA LA HEURÍSTICA DE TEXTO
const PALABRAS =
  /requisitos|responsabilidades|experiencia|postul|vacante|empleo|salario|beneficios|requirements|responsibilities|experience|qualifications|apply|salary|benefits|we are looking|buscamos/i;

// EN LOS PORTALES CONOCIDOS LA URL DICE SI ES UNA SOLA OFERTA: SUS HOME Y BÚSQUEDAS
// ESTÁN LLENAS DE PALABRAS DE EMPLEO Y ENGAÑAN A LA HEURÍSTICA DE TEXTO.
// CADA PAR ES [REGEX DEL HOST, REGEX DE LA RUTA/QUERY DE UNA OFERTA].
const URL_OFERTA: [RegExp, RegExp][] = [
  [/(^|\.)computrabajo\.com/, /\/ofertas-de-trabajo\//],
  [/(^|\.)linkedin\.com$/, /\/jobs\/view\/|[?&]currentJobId=/],
  [/(^|\.)(bumeran|zonajobs)\.com/, /\/empleos\/[^/?#]+\.html/],
  [/(^|\.)indeed\.com$/, /\/viewjob|[?&](vjk|jk)=/],
  [/(^|\.)(weareseeds|weareseeders)\.com$/, /\/posicion\//],
  [/(^|\.)universia\.net$/, /\/empleo\/[0-9a-f-]{36}\/|[?&]selectedJob=/],
];

// DEVUELVE true SI LA PÁGINA PARECE UNA OFERTA ÚNICA (URL, PUESTO Y DESCRIPCIÓN SUFICIENTE)
export function pareceOferta(puesto: string, descripcion: string, url = "", enfocada = false): boolean {
  // EL SCRAPER DEL SITIO YA ENCONTRÓ LA OFERTA SELECCIONADA (EJ. PANEL LATERAL DE COMPUTRABAJO,
  // CUYA URL ES DE BÚSQUEDA): NO HACE FALTA MÁS CHEQUEO
  if (enfocada) return true;
  let u: URL | null = null;
  try { u = new URL(url); } catch { /* SIN URL: SOLO HEURÍSTICA DE TEXTO */ }
  const sitio = u && URL_OFERTA.find(([host]) => host.test(u.hostname));
  // UNA URL CON FORMA DE OFERTA ES NECESARIA PERO NO SUFICIENTE: UN MURO DE CLOUDFLARE O LOGIN
  // VIVE EN LA MISMA URL, POR ESO SIGUEN LOS CHEQUEOS DE TEXTO
  if (sitio && !sitio[1].test(u!.pathname + u!.search)) return false;
  if (!puesto.trim()) return false;
  if (descripcion.length < 300) return false;
  // SE QUITAN LAS TILDES (NFD) PARA QUE PALABRAS COMO "EXPERIENCIA" MATCHEEN SIN IMPORTAR LA ACENTUACIÓN
  return PALABRAS.test(descripcion.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
}
