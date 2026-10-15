// EXTRACTOR DE SEEDS: LEE PUESTO, EMPRESA, DESCRIPCIÓN Y LOGO DE LA OFERTA ABIERTA.
// SE INYECTA CON chrome.scripting.executeScript: DEBE SER AUTOCONTENIDO (SIN DEPENDENCIAS EXTERNAS).
// HAY DOS SITIOS SEEDS:
// - SEEDS PLATFORM (app.weareseeders.com, CON SESIÓN): "Oportunidades", "Mis postulaciones" Y LA HOME
//   ABREN CADA OFERTA EN UN DIÁLOGO DE MATERIAL UI (role="dialog") SOBRE LA LISTA; LA URL NO CAMBIA.
//   TÍTULO = PRIMER <h6>, DESCRIPCIÓN = BLOQUE BAJO "Descripción de la oportunidad"
//   (EL DIÁLOGO TERMINA CON UN PERFIL DE EMPRESA QUE SE DEJA AFUERA).
// - PORTAL PÚBLICO (jobs.weareseeds.com/posicion/…): EMPRESA JUSTO ARRIBA DEL h1, LUEGO LAS SECCIONES Y
//   AL FINAL "Otras oportunidades que te podrían interesar". SIN <main> NI JSON-LD.
export function scrapeSeeds(): { puesto: string; empresa: string; descripcion: string; logo: string } {
  const txt = (el: Element | null | undefined) =>
    (el ? (el as HTMLElement).innerText || el.textContent || "" : "").trim();
  // EL LOGO DE LA EMPRESA ES LA IMAGEN CUYO alt ES EL NOMBRE DE LA EMPRESA (EL DIÁLOGO SOLO TIENE ÍCONOS DE LA APP)
  const logoDe = (root: ParentNode, empresa: string) =>
    (empresa && Array.from(root.querySelectorAll<HTMLImageElement>("img")).find((i) => i.alt.trim().toLowerCase() === empresa.toLowerCase())?.src) || "";
  // DOM SIN LAYOUT (TESTS): AHÍ getClientRects() ESTÁ VACÍO, ASÍ QUE NO SE PUEDE FILTRAR POR VISIBILIDAD
  const sinLayout = document.documentElement.getBoundingClientRect().height === 0;

  // SOLO CUENTA EL DIÁLOGO VISIBLE QUE CONTIENE LA DESCRIPCIÓN DE UNA OPORTUNIDAD
  const dialog = Array.from(document.querySelectorAll('[role="dialog"]')).find(
    (d) => (sinLayout || d.getClientRects().length > 0) && /Descripci[oó]n de la oportunidad/i.test(d.textContent ?? ""),
  );
  if (dialog) {
    const tituloEl = Array.from(dialog.querySelectorAll("h1, h2, h3, h6")).find((h) => txt(h) && !/^Publicado/i.test(txt(h)));
    const puesto = txt(tituloEl);
    // LA EMPRESA ESTÁ JUSTO ARRIBA DEL TÍTULO; LAS OFERTAS CONFIDENCIALES NO TIENEN. NO HAY RESPALDO
    // PORQUE EL PRIMER <p> PUEDE SER UN AVISO TIPO "REQUIERE RESIDIR EN CHILE" (SE DESCARTA SI TERMINA EN PUNTUACIÓN)
    const prev = txt(tituloEl?.previousElementSibling);
    const empresa = prev.length < 80 && !/[.!?]$/.test(prev) ? prev : "";
    const heading = Array.from(dialog.querySelectorAll("h4, h5, h6, p")).find((h) => /^Descripci[oó]n de la oportunidad$/i.test(txt(h)));
    // SUBE DESDE EL ENCABEZADO HASTA EL PRIMER ANCESTRO CON TEXTO SUFICIENTE (>= 300): ESE ES EL BLOQUE DE DESCRIPCIÓN
    let bloque: Element | null | undefined = heading;
    while (bloque && bloque !== dialog && txt(bloque).length < 300) bloque = bloque.parentElement;
    const descripcion = txt(bloque === dialog ? null : bloque).replace(/^Descripci[oó]n de la oportunidad\s*/i, "");
    return { puesto, empresa, descripcion, logo: logoDe(dialog, empresa) };
  }

  // PORTAL PÚBLICO: SOLO UNA PÁGINA /posicion/… ES UNA OFERTA (SU HOME Y LISTADOS TAMBIÉN TIENEN h1)
  if (!/\/posicion\//.test(location.pathname)) return { puesto: "", empresa: "", descripcion: "", logo: "" };
  const h1 = document.querySelector("h1");
  const puesto = txt(h1);
  const empresa = txt(h1?.previousElementSibling).split("\n")[0].trim();

  // DESCRIPCIÓN = TEXTO DESDE EL TÍTULO HASTA "Otras oportunidades" (OFERTAS AJENAS)
  const all = txt(document.body);
  const start = puesto ? all.indexOf(puesto) : -1;
  const cut = all.search(/\n\s*(Otras oportunidades|Otras posiciones|Posiciones similares)/i);
  const descripcion = start >= 0 ? all.slice(start + puesto.length, cut > start ? cut : undefined).trim() : "";

  return { puesto, empresa, descripcion, logo: logoDe(document, empresa) };
}
