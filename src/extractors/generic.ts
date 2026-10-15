import type { Oferta } from "../types";

// UTILIDADES GENÉRICAS: DETECCIÓN DE SITIO POR URL, TEXTO Y EXTRACTOR DE RESPALDO PARA CUALQUIER PÁGINA.

// DEVUELVE EL SITIO CONOCIDO SEGÚN EL HOST DE LA URL ("otro" SI NO COINCIDE O LA URL ES INVÁLIDA)
export function detectSitio(url: string): Oferta["sitio"] {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "otro";
  }
  if (/(^|\.)linkedin\.com$/.test(host)) return "linkedin";
  if (/(^|\.)computrabajo\.com(\.[a-z]{2})?$/.test(host)) return "computrabajo";
  if (/(^|\.)bumeran\.com(\.[a-z]{2})?$/.test(host)) return "bumeran";
  if (/(^|\.)zonajobs\.com(\.[a-z]{2})?$/.test(host)) return "zonajobs";
  if (/(^|\.)indeed\.com$/.test(host)) return "indeed";
  if (/(^|\.)(weareseeds|weareseeders)\.com$/.test(host)) return "seeds";
  if (/(^|\.)universia\.net$/.test(host)) return "universia";
  return "otro";
}

// true SI EL TEXTO MENCIONA INGLÉS O BILINGÜE (CON O SIN TILDE/DIÉRESIS)
export function pideIngles(text: string): boolean {
  return /ingl[eé]s|english|biling[uü]e|bilingual/i.test(text);
}

// NORMALIZA ESPACIOS Y SALTOS DE LÍNEA, Y CORTA EL TEXTO A max CARACTERES
export function recortar(text: string, max = 4000): string {
  return text
    .replace(/[ \t ]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

// EXTRACTOR DE RESPALDO PARA CUALQUIER PÁGINA (SITIOS SIN EXTRACTOR PROPIO O CUANDO ÉSTE NO ENCUENTRA NADA).
// SE INYECTA CON chrome.scripting.executeScript: DEBE SER AUTOCONTENIDO (SIN DEPENDENCIAS EXTERNAS).
export function scrapePage(): { titulo: string; h1: string; empresa: string; texto: string; logo: string } {
  const txt = (el: Element | null | undefined) => (el?.textContent ?? "").trim();
  // MUCHOS SITIOS (Greenhouse, Lever, Workday, Universia…) PUBLICAN LA OFERTA COMO JSON-LD:
  // DATOS EXACTOS Y SIN LAS "OFERTAS SIMILARES" DE ALREDEDOR.
  for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      const j = JSON.parse(s.textContent ?? "");
      const job = (Array.isArray(j) ? j : j?.["@graph"] ?? [j]).find((x: { "@type"?: unknown }) => x?.["@type"] === "JobPosting");
      // LAS SPA (EJ. UNIVERSIA) CONSERVAN EL JSON-LD DE LA OFERTA VISTA ANTES: SOLO SE CONFÍA EN ÉL
      // SI SU TÍTULO COINCIDE CON UN ENCABEZADO ACTUAL DE LA PÁGINA
      const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ");
      const titulos = Array.from(document.querySelectorAll("h1, h2")).map((h) => norm(h.textContent ?? ""));
      if (job?.title && job.description && (!titulos.length || titulos.includes(norm(String(job.title))))) {
        const div = document.createElement("div");
        div.innerHTML = String(job.description);
        const l = job.hiringOrganization?.logo;
        return {
          titulo: document.title.trim(),
          h1: String(job.title).trim(),
          empresa: String(job.hiringOrganization?.name ?? "").trim(),
          texto: (div.textContent ?? "").trim(),
          logo: String((typeof l === "string" ? l : l?.url) ?? ""),
        };
      }
    } catch {
      /* IGNORA JSON-LD ROTO */
    }
  }
  // SIN JSON-LD: EMPRESA POR SELECTORES HEURÍSTICOS Y TEXTO DE LA PÁGINA PRINCIPAL
  let empresa = "";
  const selectors = ["[data-company]", '[class*="company" i] a', '[class*="company" i]', '[class*="empresa" i]'];
  for (const sel of selectors) {
    const found = Array.from(document.querySelectorAll(sel))
      .map(txt)
      // ponytail: LISTA NEGRA DE TEXTOS DE PIE DE PÁGINA/LEGALES; LOS EXTRACTORES POR SITIO (v2) LA REEMPLAZAN
      .find((t) => t.length > 0 && t.length < 100 && !/aviso legal|privacidad|t[ée]rminos|cookies|seguir/i.test(t));
    if (found) {
      empresa = found;
      break;
    }
  }
  // ÚLTIMO RECURSO: EMPRESA DEL TÍTULO, EJ. "Job Application for Design Engineer at Vercel" / "... en Acme SA"
  if (!empresa) empresa = document.title.match(/\s(?:at|en)\s+([^|·–—-]{2,50}?)\s*$/i)?.[1] ?? "";
  const root = document.querySelector("main, article, [role=main]") as HTMLElement | null;
  return {
    titulo: document.title.trim(),
    h1: txt(document.querySelector("h1")),
    empresa,
    texto: (root ?? document.body).innerText,
    logo: "",
  };
}
