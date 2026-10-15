// EXTRACTOR DE INDEED: LEE PUESTO, EMPRESA, DESCRIPCIÓN Y LOGO DE LA OFERTA SELECCIONADA.
// SE INYECTA CON chrome.scripting.executeScript: DEBE SER AUTOCONTENIDO (SIN DEPENDENCIAS EXTERNAS).
// INDEED MUESTRA LA OFERTA EN #jobsearch-ViewjobPaneWrapper JUNTO A LOS RESULTADOS (?vjk=…) O SOLA
// EN /viewjob?jk=…. AMBAS USAN LOS MISMOS data-testid; LOS SELECTORES CLÁSICOS QUEDAN DE RESPALDO.
export function scrapeIndeed(): { puesto: string; empresa: string; descripcion: string; logo: string } {
  const txt = (el: Element | null | undefined) =>
    (el ? (el as HTMLElement).innerText || el.textContent || "" : "").trim();
  // SI HAY PANEL LATERAL SE LEE SOLO DENTRO DE ÉL; EN /viewjob SE LEE TODO EL DOCUMENTO
  const scope: ParentNode = document.querySelector("#jobsearch-ViewjobPaneWrapper") ?? document;
  const q = (s: string) => scope.querySelector(s);

  const puesto = (
    txt(q('[data-testid="vj-job-title"]')) ||
    txt(q('[data-testid="jobsearch-JobInfoHeader-title"]')) ||
    txt(q(".jobsearch-JobInfoHeader-title"))
  ).replace(/\s*-\s*job post$/i, "");

  const empresa =
    txt(q('[data-testid="inlineHeader-companyName"]')) ||
    txt(q('[data-company-name="true"]')) ||
    Array.from(scope.querySelectorAll('a[href*="/cmp/"]')).map(txt).find((t) => t && t.length < 100) ||
    "";

  // SI NO EXISTE #jobDescriptionText SE USA EL BLOQUE QUE SIGUE AL ENCABEZADO DE DESCRIPCIÓN
  const heading = q('[data-testid="vj-job-description-heading"]');
  const descripcion = txt(q("#jobDescriptionText")) || txt(heading?.nextElementSibling) || txt(heading?.parentElement);

  const logoEl = q('[data-testid="company-logo"]');
  const logo = (logoEl instanceof HTMLImageElement ? logoEl : logoEl?.querySelector("img"))?.src ?? "";
  return { puesto, empresa, descripcion, logo };
}
