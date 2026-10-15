// EXTRACTOR DE COMPUTRABAJO: LEE PUESTO, EMPRESA, DESCRIPCIÓN Y LOGO DE LA OFERTA SELECCIONADA.
// SE INYECTA CON chrome.scripting.executeScript: DEBE SER AUTOCONTENIDO (SIN DEPENDENCIAS EXTERNAS).
// DOS DISEÑOS: LA BÚSQUEDA MUESTRA LA OFERTA EN UN PANEL LATERAL ([data-offers-grid-detail-container],
// LA URL NO CAMBIA) Y LA PÁGINA /ofertas-de-trabajo/… TIENE "Ofertas similares" DEBAJO.
// EN AMBOS CASOS SE LEE SOLO EL BLOQUE PROPIO DE LA OFERTA.
export function scrapeComputrabajo(): { puesto: string; empresa: string; descripcion: string; logo: string } {
  const txt = (el: Element | null | undefined) =>
    (el ? (el as HTMLElement).innerText || el.textContent || "" : "").trim();
  // POR QUÉ EL MODAL CERRADO NO CUENTA: EN VENTANAS ANGOSTAS EL PANEL ES UN MODAL INFERIOR; CERRADO
  // SE DESLIZA FUERA DE LA PANTALLA PERO CONSERVA LA OFERTA ANTERIOR, ASÍ QUE SOLO VALE UN PANEL VISIBLE.
  const enPantalla = (el: Element) => {
    const r = el.getBoundingClientRect();
    return el.getClientRects().length > 0 && r.top < innerHeight && r.bottom > 0;
  };
  // DOM SIN LAYOUT (TESTS): NO HAY GEOMETRÍA, ASÍ QUE SE ACEPTA EL PRIMER PANEL
  const sinLayout = document.documentElement.getBoundingClientRect().height === 0;

  const panels = Array.from(document.querySelectorAll("[data-offers-grid-detail-container]"));
  const panel = panels.find(enPantalla) ?? (sinLayout ? panels[0] : undefined) ?? null;
  // BÚSQUEDA SIN OFERTA ABIERTA (O MODAL CERRADO): NO HAY SELECCIÓN, NO SE LEE EL LISTADO
  if (panels.length && !panel) return { puesto: "", empresa: "", descripcion: "", logo: "" };
  const scope: ParentNode = panel ?? document;

  // EN LA BÚSQUEDA EL h1 ES "36 Ofertas de trabajo de …", POR ESO AHÍ SOLO CUENTA EL TÍTULO DEL PANEL.
  // RESPALDO (SOLO PÁGINA DE OFERTA): TÍTULO DE PESTAÑA "Trabajos de {puesto} en {EMPRESA} - {lugar}"
  const m = panel ? null : document.title.trim().match(/^Trabajos? de (.+) en (.+?) - [^-]*$/i);
  const puesto = txt(scope.querySelector(".title_offer")) || (panel ? "" : txt(document.querySelector("h1")) || (m?.[1] ?? "").trim());

  // EMPRESA: PRIMER ENLACE A LA PÁGINA DE EMPRESA DENTRO DEL ÁMBITO; RESPALDO: TÍTULO DE PESTAÑA
  let empresa = "";
  for (const a of Array.from(scope.querySelectorAll('a[href*="/empresas/ofertas-de-trabajo-"]'))) {
    const t = txt(a);
    if (t && t.length < 100) {
      empresa = t;
      break;
    }
  }
  if (!empresa) empresa = (m?.[2] ?? "").trim();

  // SE CORTAN LOS BOTONES/ENLACES DE ACCIÓN QUE SIGUEN A LA DESCRIPCIÓN
  const heading = Array.from(scope.querySelectorAll("h2, h3, p")).find((e) => /^\s*Descripción de la oferta\s*$/i.test(e.textContent ?? ""));
  const descripcion = (txt(heading?.parentElement) || txt(scope.querySelector(".description_offer")))
    .replace(/\n\s*(Postularme|Ocultar aviso|Avísame con ofertas similares|Denunciar empleo)[\s\S]*$/i, "");

  // LOS LOGOS REALES ESTÁN BAJO /logos/empresas/; LAS OFERTAS CONFIDENCIALES TRAEN UNA IMAGEN GENÉRICA
  const logo =
    Array.from(scope.querySelectorAll<HTMLImageElement>("img"))
      .map((i) => i.currentSrc || i.src)
      .find((src) => /\/logos\/empresas\//.test(src)) ?? "";
  return { puesto, empresa, descripcion, logo };
}
