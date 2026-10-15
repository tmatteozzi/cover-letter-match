// ORQUESTA LA EXTRACCIÓN DE LA OFERTA DE LA PESTAÑA ACTIVA: EXTRACTOR DEL SITIO, RESPALDO GENÉRICO Y MERGE.
import type { Oferta } from "../types";
import { detectarIdioma } from "../ai/detectLanguage";
import { detectSitio, pideIngles, recortar, scrapePage } from "./generic";
import { scrapeLinkedin } from "./linkedin";
import { scrapeComputrabajo } from "./computrabajo";
import { scrapeBumeran } from "./bumeran";
import { scrapeIndeed } from "./indeed";
import { scrapeSeeds } from "./seeds";
import { scrapeUniversia } from "./universia";

// ESPECIFICO = RESULTADO DE UN EXTRACTOR POR SITIO; GENERICO = RESULTADO DE scrapePage
type Especifico = { puesto: string; empresa: string; descripcion: string; logo?: string };
type Generico = { titulo: string; h1: string; empresa: string; texto: string; logo?: string };

// EXTRACTOR POR SITIO (ZONAJOBS COMPARTE PLATAFORMA CON BUMERAN)
const SCRAPERS: Partial<Record<Oferta["sitio"], () => Especifico>> = {
  linkedin: scrapeLinkedin,
  computrabajo: scrapeComputrabajo,
  bumeran: scrapeBumeran,
  zonajobs: scrapeBumeran,
  indeed: scrapeIndeed,
  seeds: scrapeSeeds,
  universia: scrapeUniversia,
};

// true SI EL EXTRACTOR DEL SITIO ENCONTRÓ LA OFERTA SELECCIONADA (PUESTO + DESCRIPCIÓN REAL), NO UNA PÁGINA ENTERA
export const esEnfocada = (e: Especifico | null) => !!e?.puesto && (e.descripcion?.length ?? 0) >= 200;

// LOS AVISOS CONFIDENCIALES NO NOMBRAN EMPRESA ("Confidencial", "Importante empresa del sector…"):
// UN SALUDO A "equipo de Confidencial" QUEDA MAL, ASÍ QUE CUENTAN COMO SIN EMPRESA.
const empresaReal = (e: string) =>
  /^(empresa\s+)?confidencial$|^importante empresa\b|^empresa l[ií]der\b/i.test(e.trim()) ? "" : e.trim();

// COMBINA EL RESULTADO ESPECÍFICO Y EL GENÉRICO: MANDA EL ESPECÍFICO, EL GENÉRICO COMPLETA LO QUE FALTA
export function mergeResultado(especifico: Especifico | null, generico: Generico | null): Especifico {
  return {
    puesto: especifico?.puesto || generico?.h1 || generico?.titulo || "",
    empresa: empresaReal(especifico?.empresa || generico?.empresa || ""),
    // LOS PORTALES LISTAN OTRAS OFERTAS ALREDEDOR DE LA SELECCIONADA: EL TEXTO DE TODA LA PÁGINA ES ÚLTIMO RECURSO
    descripcion: especifico?.descripcion || generico?.texto || "",
    logo: [especifico?.logo, generico?.logo].find((u) => u && /^https?:\/\//i.test(u)) ?? "",
  };
}

const ERR_LEER = "No se pudo leer la pestaña. Hacé clic en el ícono de la extensión sobre la oferta y probá de nuevo.";

// LEE LA OFERTA DE LA PESTAÑA ACTIVA INYECTANDO LOS SCRAPERS Y DEVUELVE UNA Oferta NORMALIZADA
export async function extractOferta(): Promise<Oferta> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || !/^https?:/i.test(tab.url)) {
    throw new Error("Esta pestaña no se puede leer. Abrí una oferta laboral en una página web.");
  }
  const tabId = tab.id;
  const sitio = detectSitio(tab.url);
  const scraper = SCRAPERS[sitio];

  // EJECUTA EL EXTRACTOR DEL SITIO EN LA PESTAÑA; null SI NO HAY O FALLA LA INYECCIÓN
  const correr = async (): Promise<Especifico | null> => {
    if (!scraper) return null;
    try {
      const [r] = await chrome.scripting.executeScript({ target: { tabId }, func: scraper });
      return r?.result ?? null;
    } catch {
      return null;
    }
  };
  let especifico = await correr();
  // LAS SPA (LinkedIn, Universia, Seeds Platform) RENDERIZAN EL TÍTULO ANTES QUE LA DESCRIPCIÓN: UN REINTENTO
  if (especifico?.puesto && !especifico.descripcion) {
    await new Promise((r) => setTimeout(r, 1500));
    especifico = (await correr()) ?? especifico;
  }

  // RESPALDO GENÉRICO SOLO SI EL ESPECÍFICO NO TRAJO PUESTO O DESCRIPCIÓN; ERROR SI NO HAY NINGÚN RESULTADO
  let generico: Generico | null = null;
  if (!especifico?.puesto || !especifico.descripcion) {
    try {
      const [r] = await chrome.scripting.executeScript({ target: { tabId }, func: scrapePage });
      generico = r?.result ?? null;
    } catch {
      if (!especifico) throw new Error(ERR_LEER);
    }
    if (!generico && !especifico) throw new Error(ERR_LEER);
  }

  const { puesto, empresa, descripcion: texto, logo } = mergeResultado(especifico, generico);
  const descripcion = recortar(texto);
  return {
    puesto,
    empresa,
    descripcion,
    url: tab.url,
    sitio,
    // AVISOS CONFIDENCIALES: SIN EMPRESA, ASÍ QUE TAMPOCO HAY LOGO
    logo: empresa ? logo : "",
    enfocada: esEnfocada(especifico),
    idiomaDetectado: await detectarIdioma(descripcion),
    pideIngles: pideIngles(texto),
  };
}
