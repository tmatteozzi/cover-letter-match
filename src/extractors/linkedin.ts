// EXTRACTOR DE LINKEDIN: LEE PUESTO, EMPRESA, DESCRIPCIÓN Y LOGO DE LA OFERTA SELECCIONADA.
// SE INYECTA CON chrome.scripting.executeScript: DEBE SER AUTOCONTENIDO (SIN DEPENDENCIAS EXTERNAS).
// LINKEDIN MUESTRA LA OFERTA JUNTO A UNA LISTA DE OTRAS (BÚSQUEDA, COLECCIONES) O ARRIBA DE
// "More jobs" (/jobs/view). TODO SE ACOTA AL ID DE LA OFERTA SELECCIONADA PARA QUE NO SE FILTREN OTRAS TARJETAS.
export function scrapeLinkedin(): { puesto: string; empresa: string; descripcion: string; logo: string } {
  const txt = (el: Element | null | undefined) =>
    (el ? (el as HTMLElement).innerText || el.textContent || "" : "").trim();
  // PRIMER SELECTOR DE LA LISTA CON TEXTO NO VACÍO
  const first = (sels: string[]) => {
    for (const s of sels) {
      const t = txt(document.querySelector(s));
      if (t) return t;
    }
    return "";
  };
  // ID DE LA OFERTA SELECCIONADA: DE /jobs/view/{id} O DEL PARÁMETRO currentJobId
  const jobId =
    location.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d+)/)?.[1] ??
    new URLSearchParams(location.search).get("currentJobId") ??
    "";

  // POR QUÉ componentkey: LA UI 2025+ USA CLASES OFUSCADAS E INESTABLES, PERO EL ATRIBUTO
  // componentkey "JobDetails_AboutTheJob_{id}" ES ESTABLE Y ATA EL BLOQUE A ESA OFERTA (SIN FILTRAR OTRAS)
  const about =
    (jobId && document.querySelector(`[componentkey="JobDetails_AboutTheJob_${jobId}"]`)) ||
    document.querySelector('[componentkey^="JobDetails_AboutTheJob_"]');
  // RESPALDO: UI CLÁSICA (/jobs/collections/…, PÁGINAS SIN SESIÓN). SE QUITAN EL ENCABEZADO Y EL "ver más" FINAL
  const descripcion = (
    txt(about) ||
    first(["#job-details", ".jobs-description__content", ".jobs-description-content__text", ".show-more-less-html__markup", ".description__text"])
  )
    .replace(/^(Acerca del empleo|About the job)\s*/i, "")
    .replace(/\s*…\s*(más|more|see more|ver más)\s*$/i, "");

  let puesto = first([".job-details-jobs-unified-top-card__job-title h1", ".top-card-layout__title", ".topcard__title"]);
  let empresa = first([
    ".job-details-jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".topcard__org-name-link",
    'a[data-tracking-control-name*="org-name"]',
  ]);
  // EL TÍTULO DE LA PESTAÑA SIEMPRE SIGUE A LA OFERTA SELECCIONADA: "(3) Puesto | Empresa | LinkedIn"
  // (CON SESIÓN) O "Puesto at Empresa — Ubicación | LinkedIn Jobs" (SIN SESIÓN). SE USA SI FALTA ALGO
  if (!puesto || !empresa) {
    const parts = document.title
      .replace(/^\(\d+\)\s*/, "")
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s && !/^linkedin( jobs)?$/i.test(s));
    const guest = parts.length === 1 ? parts[0].match(/^(.+?) at (.+?)(?: — .*)?$/) : null;
    const [p, e] = guest ? [guest[1], guest[2]] : parts.length >= 2 ? parts : ["", ""];
    if (!puesto) puesto = p.trim();
    if (!empresa) empresa = e.trim();
  }
  // LOGO DE LA OFERTA SELECCIONADA: IMAGEN company-logo FUERA DE LAS TARJETAS DE RESULTADOS
  const logos = Array.from(document.querySelectorAll<HTMLImageElement>('img[src*="company-logo"]')).filter(
    (i) => !i.closest('[componentkey^="job-card-component-ref-"], .job-card-container, .jobs-search-results-list, .scaffold-layout__list'),
  );
  const logo = (
    logos.find((i) => empresa && i.alt.includes(empresa)) ??
    (jobId ? document.querySelector<HTMLImageElement>(`[componentkey="JobDetails_AboutTheCompany_${jobId}"] img[src*="company-logo"]`) : null) ??
    logos[0]
  )?.src ?? "";
  return { puesto, empresa, descripcion, logo };
}
