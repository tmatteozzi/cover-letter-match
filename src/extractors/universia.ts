// EXTRACTOR DE UNIVERSIA: LEE PUESTO, EMPRESA, DESCRIPCIÓN Y LOGO DE LA OFERTA SELECCIONADA.
// SE INYECTA CON chrome.scripting.executeScript: DEBE SER AUTOCONTENIDO (SIN DEPENDENCIAS EXTERNAS).
// UNIVERSIA ES ANGULAR + WEB COMPONENTS: BÚSQUEDA CON LA OFERTA JUNTO A LAS <job-card>
// (?selectedJob=…) Y PÁGINA PROPIA /empleo/{uuid}/…. PUESTO Y EMPRESA SON h1/h2 sr-only DENTRO DE
// <app-job-detail-container>; LA DESCRIPCIÓN ESTÁ EN EL SHADOW DOM DE <job-detail>, QUE
// innerText DESDE FUERA NO VE.
// POR QUÉ SE IGNORA EL JSON-LD DE LA PÁGINA: LA SPA CONSERVA EL DE LA OFERTA ANTERIOR (DATOS VIEJOS).
export function scrapeUniversia(): { puesto: string; empresa: string; descripcion: string; logo: string } {
  const txt = (el: Element | null | undefined) =>
    (el ? (el as HTMLElement).innerText || el.textContent || "" : "").trim();
  // SIN CONTENEDOR DE DETALLE NO HAY OFERTA SELECCIONADA
  const box = document.querySelector("app-job-detail-container");
  if (!box) return { puesto: "", empresa: "", descripcion: "", logo: "" };
  const puesto = (box.querySelector("h1")?.textContent ?? "").trim();
  const sr = box.querySelector("job-detail")?.shadowRoot ?? null;
  // EMPRESA: h2 sr-only; RESPALDO: EL ELEMENTO DENTRO DEL SHADOW DOM
  const empresa =
    (box.querySelector("h2")?.textContent ?? "").trim() ||
    (sr?.querySelector(".job-detail-hiring-organization")?.textContent ?? "").trim();
  const descripcion = sr
    ? Array.from(sr.querySelectorAll("section.section-container")).map(txt).filter(Boolean).join("\n\n")
    : "";
  // EL LOGO SOLO SALE DE UN JSON-LD CUYO TÍTULO COINCIDE CON EL PUESTO ACTUAL (EVITA EL DE LA OFERTA ANTERIOR)
  let logo = "";
  for (const sc of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      const j = JSON.parse(sc.textContent ?? "");
      const l = j?.["@type"] === "JobPosting" && String(j.title ?? "").trim().toLowerCase() === puesto.toLowerCase() ? j.hiringOrganization?.logo : null;
      if (l) logo = typeof l === "string" ? l : l.url ?? "";
    } catch {
      /* IGNORA JSON-LD ROTO */
    }
  }
  return { puesto, empresa, descripcion, logo };
}
