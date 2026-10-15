// EXTRACTOR DE BUMERAN Y ZONAJOBS: LEE PUESTO, EMPRESA, DESCRIPCIÓN Y LOGO DE LA OFERTA.
// SE INYECTA CON chrome.scripting.executeScript: DEBE SER AUTOCONTENIDO (SIN DEPENDENCIAS EXTERNAS).
// AMBOS SITIOS COMPARTEN PLATAFORMA: PÁGINA CON #ficha-detalle Y "Empleos relacionados" DEBAJO.
// EL JSON-LD JobPosting ES LA FUENTE CONFIABLE DE TÍTULO Y EMPRESA (EL TÍTULO DE LA PESTAÑA
// TERMINA EN "- octubre 2026" Y NO SIRVE PARA ESO).
export function scrapeBumeran(): { puesto: string; empresa: string; descripcion: string; logo: string } {
  const txt = (el: Element | null | undefined) =>
    (el ? (el as HTMLElement).innerText || el.textContent || "" : "").trim();
  // BUSCA EL PRIMER JSON-LD DE TIPO JobPosting (PUEDE VENIR SUELTO O EN UN ARRAY)
  let ld: { title?: string; hiringOrganization?: { name?: string; logo?: string | { url?: string } }; description?: string } | null = null;
  for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      const j = JSON.parse(s.textContent ?? "");
      const item = (Array.isArray(j) ? j : [j]).find((x) => x?.["@type"] === "JobPosting");
      if (item) {
        ld = item;
        break;
      }
    } catch {
      /* IGNORA JSON-LD ROTO */
    }
  }
  const puesto = txt(document.querySelector("h1")) || (ld?.title ?? "").trim();
  const empresa = (ld?.hiringOrganization?.name ?? "").trim();
  let descripcion = txt(document.querySelector("#ficha-detalle"));
  // RESPALDO: LA DESCRIPCIÓN DEL JSON-LD VIENE COMO HTML, SE CONVIERTE A TEXTO PLANO
  if (!descripcion && ld?.description) {
    const div = document.createElement("div");
    div.innerHTML = ld.description;
    descripcion = (div.textContent ?? "").trim();
  }
  const l = ld?.hiringOrganization?.logo;
  const logo = (typeof l === "string" ? l : l?.url) ?? "";
  return { puesto, empresa, descripcion, logo };
}
