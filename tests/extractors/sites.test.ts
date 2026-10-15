// @vitest-environment happy-dom
// TESTS DE LOS EXTRACTORES POR SITIO, mergeResultado Y LOGOS, SOBRE FIXTURES DEL DOM REAL (OCT 2026).
// LOS FIXTURES INCLUYEN OFERTAS SEÑUELO "DECOY" (RESULTADOS, "SIMILARES") QUE NO DEBEN FILTRARSE AL RESULTADO.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { scrapeLinkedin } from "../../src/extractors/linkedin";
import { scrapeComputrabajo } from "../../src/extractors/computrabajo";
import { scrapeBumeran } from "../../src/extractors/bumeran";
import { scrapeIndeed } from "../../src/extractors/indeed";
import { scrapeSeeds } from "../../src/extractors/seeds";
import { scrapeUniversia } from "../../src/extractors/universia";
import { scrapePage } from "../../src/extractors/generic";
import { esEnfocada, mergeResultado } from "../../src/extractors/index";

// CARGA HTML EN EL DOM DE happy-dom Y FIJA LA URL Y EL TÍTULO COMO SI FUERA LA PESTAÑA
function load(html: string, url = "https://example.com/") {
  (window as unknown as { happyDOM: { setURL(u: string): void } }).happyDOM.setURL(url);
  document.documentElement.innerHTML = html.replace(/^<!doctype html>/i, "");
  document.title = document.querySelector("title")?.textContent ?? "";
}
const fixture = (n: string) => readFileSync(`${process.cwd()}/tests/extractors/fixtures/${n}`, "utf8");
// FALLA SI EN EL RESULTADO APARECE ALGÚN TEXTO SEÑUELO
const sinSenuelos =(r: { puesto: string; empresa: string; descripcion: string }) =>
  expect(JSON.stringify(r)).not.toMatch(/DECOY/);

describe("scrapers por sitio", () => {
  it("linkedin: panel de búsqueda, solo la oferta seleccionada", () => {
    load(fixture("linkedin.html"), "https://www.linkedin.com/jobs/search-results/?currentJobId=4408947507&keywords=react");
    const r = scrapeLinkedin();
    expect(r.puesto).toBe("Frontend Developer (SSR) – React");
    expect(r.empresa).toBe("Talent Connect");
    expect(r.descripcion).toMatch(/^Buscamos un Frontend Developer/);
    expect(r.descripcion).not.toMatch(/más$/);
    sinSenuelos(r);
    expect(esEnfocada(r)).toBe(true);
  });
  it("linkedin: /jobs/view/{id}", () => {
    load(fixture("linkedin.html"), "https://www.linkedin.com/jobs/view/4408947507/");
    const r = scrapeLinkedin();
    expect(r.descripcion).toContain("React, TypeScript y Next.js");
    sinSenuelos(r);
  });
  it("linkedin: UI clásica (/jobs/collections) con título de página genérico", () => {
    load(`<head><title>Principales empleos que te recomendamos | LinkedIn</title></head><body>
      <ul><li class="job-card-container"><a class="job-card-list__title">DECOY Backend Engineer</a></li></ul>
      <div class="scaffold-layout__detail"><div class="job-details-jobs-unified-top-card__job-title"><h1>Solution Architect</h1></div>
      <div class="job-details-jobs-unified-top-card__company-name"><a>Iké Asistencia Argentina</a></div>
      <div id="job-details"><h2>Acerca del empleo</h2><p>En IKÉ ARGENTINA buscamos un Solution Architect con experiencia en AWS y microservicios.</p></div></div></body>`,
      "https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4463991841");
    const r = scrapeLinkedin();
    expect(r).toEqual({ puesto: "Solution Architect", empresa: "Iké Asistencia Argentina", descripcion: expect.stringMatching(/^En IKÉ ARGENTINA buscamos/), logo: "" });
  });
  it("linkedin: título de la vista sin sesión ('Puesto at Empresa — Ubicación | LinkedIn Jobs')", () => {
    load("<head><title>Desarrollador/a Frontend SSr. at Grupo ST — Buenos Aires, Argentina | LinkedIn Jobs</title></head><body></body>", "https://www.linkedin.com/jobs/view/4456534590/");
    const r = scrapeLinkedin();
    expect([r.puesto, r.empresa]).toEqual(["Desarrollador/a Frontend SSr.", "Grupo ST"]);
  });
  it("linkedin: sin bloque de descripción no inventa", () => {
    load("<head><title>(12) Data Analyst | Initech | LinkedIn</title></head><body><p>hola</p></body>", "https://www.linkedin.com/jobs/view/1/");
    expect(scrapeLinkedin()).toEqual({ puesto: "Data Analyst", empresa: "Initech", descripcion: "", logo: "" });
  });

  it("computrabajo: panel del listado (la URL es de búsqueda)", () => {
    load(fixture("computrabajo-listado.html"), "https://ar.computrabajo.com/trabajo-de-desarrollador-react");
    const r = scrapeComputrabajo();
    expect(r.puesto).toBe("Desarrollador React Senior / Semi senior");
    expect(r.empresa).toBe("Yuhmak S.A.");
    expect(r.descripcion).toContain("Requisitos: experiencia comprobable");
    expect(r.puesto).not.toMatch(/Ofertas de trabajo/);
    sinSenuelos(r);
    expect(esEnfocada(r)).toBe(true);
  });
  it("computrabajo: página de la oferta sin 'Ofertas similares'", () => {
    load(fixture("computrabajo.html"), "https://ar.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-dev-595E");
    const r = scrapeComputrabajo();
    expect(r.puesto).toBe("Desarrollador React Senior / Semi senior");
    expect(r.empresa).toBe("Yuhmak S.A.");
    expect(r.descripcion).toContain("Responsabilidades: desarrollo");
    expect(r.descripcion).not.toMatch(/Postularme|Denunciar/);
    sinSenuelos(r);
  });
  // SIN PANEL NI h1 UTILIZABLE: PUESTO Y EMPRESA SALEN DEL TÍTULO DE LA PESTAÑA
  it("computrabajo: respaldo por título", () => {
    load("<head><title>Trabajos de Desarrollador React en ACME SA - Palermo, Capital Federal</title></head><body><p>texto</p></body>");
    const r = scrapeComputrabajo();
    expect(r.puesto).toBe("Desarrollador React");
    expect(r.empresa).toBe("ACME SA");
  });

  it("bumeran/zonajobs: empresa del JSON-LD, no del título ('- septiembre 2026')", () => {
    load(fixture("bumeran.html"), "https://www.bumeran.com.ar/empleos/desarrollador-react-native-msp-1118461793.html");
    const r = scrapeBumeran();
    expect(r.puesto).toBe("Desarrollador React native multiplataforma");
    expect(r.empresa).toBe("MSP CONSULTORA EN RRHH");
    expect(r.descripcion).toContain("Definir la arquitectura mobile");
    sinSenuelos(r);
  });
  // EL replace ELIMINA EL BLOQUE #ficha-detalle DEL FIXTURE PARA FORZAR EL RESPALDO
  it("bumeran: sin #ficha-detalle usa la descripción del JSON-LD", () => {
    load(fixture("bumeran.html").replace(/<div id="ficha-detalle">[\s\S]*?<\/div><\/div>/, ""));
    expect(scrapeBumeran().descripcion).toContain("Desarrollador React Native SR");
  });

  it("indeed: panel junto a los resultados", () => {
    load(fixture("indeed.html"), "https://ar.indeed.com/jobs?q=react&vjk=59d1531a9c9a6d25");
    const r = scrapeIndeed();
    expect(r.puesto).toBe("Frontend Developer (React & TypeScript)");
    expect(r.empresa).toBe("Lovelytics");
    expect(r.descripcion).toMatch(/^Buscamos personas apasionadas/);
    sinSenuelos(r);
    expect(esEnfocada(r)).toBe(true);
  });

  it("seeds: sin 'Otras oportunidades'", () => {
    load(fixture("seeds.html"), "https://jobs.weareseeds.com/posicion/ab-inbev-analista-de-bi");
    const r = scrapeSeeds();
    expect(r.puesto).toBe("Analista de BI - BI & Data analytics");
    expect(r.empresa).toBe("AB InBev");
    expect(r.descripcion).toContain("Power BI, SQL y Python.");
    expect(r.descripcion).not.toMatch(/Otras oportunidades/);
    sinSenuelos(r);
  });

  it("seeds: el listado del portal (home) no es una oferta", () => {
    load(`<body><div><h1>Encontrá tu próximo desafío</h1><p>Explorá todas las posiciones abiertas en Seeds.</p>
      <div><p>AB InBev</p><h3>Analista de BI</h3><p>${"AB InBev se encuentra en la búsqueda de una analista de BI & IA. ".repeat(8)}</p></div></div></body>`,
      "https://jobs.weareseeds.com/");
    expect(scrapeSeeds()).toEqual({ puesto: "", empresa: "", descripcion: "", logo: "" });
  });

  it("seeds platform: modal sobre la lista de oportunidades (la URL no cambia)", () => {
    load(`<head><title>Seeds Platform</title></head><body><h4>¡Hola, Tomás!</h4>
      <div><h5>DECOY Analista de BI - BI &amp; Data analytics</h5><h5>DECOY AI Specialist</h5></div>
      <div class="MuiDialog-root opportunityDialog"><div class="MuiDialog-paper" role="dialog">
        <div><p class="MuiTypography-body1">Veolia</p><h6 class="MuiTypography-h6">Data Engineer Semi sr.</h6><h6 class="MuiTypography-subtitle2">Publicado hace 5 días</h6></div>
        <div><div><h5>Descripción de la oportunidad</h5><p>Objetivo</p><span>Buscamos un/a Data Engineer para sumarse a Veolia. Vas a conectar los sistemas que usa la operación (Odoo y Enwis), construir los pipelines para llevar la información a BigQuery y armar un tablero básico. Requisitos: SQL, Python y modelado de datos. Valorable: conocimiento de Matillion.</span></div></div>
        <div><p>Sobre la empresa</p><p>Proyectos realizados: 9</p></div>
      </div></div></body>`, "https://app.weareseeders.com/busquedas-abiertas");
    const r = scrapeSeeds();
    expect(r.puesto).toBe("Data Engineer Semi sr.");
    expect(r.empresa).toBe("Veolia");
    expect(r.descripcion).toMatch(/^Objetivo/);
    expect(r.descripcion).toContain("Matillion");
    expect(r.descripcion).not.toMatch(/Proyectos realizados/);
    sinSenuelos(r);
    expect(esEnfocada(r)).toBe(true);
  });

  // EL PRIMER <p> ES UN AVISO DE UBICACIÓN (TERMINA EN PUNTO), NO UNA EMPRESA
  it("seeds platform: oferta confidencial con aviso de ubicación no inventa empresa", () => {
    load(`<body><div role="dialog"><p>La oportunidad requiere que residas en Chile y no coincide con tu ubicación.</p>
      <div><h6>IT Infrastucture Support</h6><h6>Publicado hace 7 días</h6></div>
      <div><h5>Descripción de la oportunidad</h5><p>Brindar soporte técnico de primer nivel a los usuarios, velar por la conectividad y soporte de la plataforma de red y servidores de la compañía, con el objetivo de asegurar el correcto funcionamiento de los sistemas y resolver problemas técnicos de manera oportuna.</p></div>
      </div></body>`, "https://app.weareseeders.com/busquedas-abiertas");
    const r = scrapeSeeds();
    expect(r.puesto).toBe("IT Infrastucture Support");
    expect(r.empresa).toBe("");
  });

  it("universia: panel del listado, descripción en shadow DOM, ignora el JSON-LD viejo", () => {
    load(`<head><title>Ofertas de Empleo de Desarrollador de software</title>
      <script type="application/ld+json">{"@type":"JobPosting","title":"DECOY Desarrollador Full Stack","hiringOrganization":{"name":"DECOY Quick"},"description":"DECOY viejo"}</script></head>
      <body><main><h1>Ofertas de Empleo de Desarrollador de software en Buenos Aires</h1>
      <job-card>DECOY Desarrollador Full Stack</job-card>
      <app-job-detail-container><section><h1 class="sr-only">DESARROLLADOR/A JUNIOR</h1><h2 class="sr-only">ON TIME</h2><job-detail></job-detail></section></app-job-detail-container></main></body>`,
      "https://www.universia.net/ar/empleo?roles=Software&selectedJob=ab2418c5-3ef2-42ea-b7b7-a2ced19f9da6");
    const sr = document.querySelector("job-detail")!.attachShadow({ mode: "open" });
    sr.innerHTML = `<div class="job-detail__container"><p>Quiero postularme</p>
      <section class="section-container">En On Time nos encontramos en la búsqueda de un/a Desarrollador/a Junior para sumarse al equipo de tecnología.</section>
      <section class="section-container">Experiencia: no excluyente. Git, Python y Flask.</section></div>`;
    const r = scrapeUniversia();
    expect(r.puesto).toBe("DESARROLLADOR/A JUNIOR");
    expect(r.empresa).toBe("ON TIME");
    expect(r.descripcion).toContain("Git, Python y Flask");
    sinSenuelos(r);
    // EL LECTOR GENÉRICO TAMPOCO DEBE CONFIAR EN ESE JSON-LD VIEJO
    expect(scrapePage().h1).not.toMatch(/DECOY/);
  });

  it("genérico: usa el JSON-LD JobPosting si existe", () => {
    load(fixture("bumeran.html"));
    const r = scrapePage();
    expect(r.h1).toBe("Desarrollador React native multiplataforma");
    expect(r.empresa).toBe("MSP CONSULTORA EN RRHH");
    expect(r.texto).not.toMatch(/DECOY/);
  });
});

describe("mergeResultado", () => {
  const gen = { titulo: "T", h1: "H1", empresa: "GenCo", texto: "texto generico" };
  it("completa lo que falta con el genérico", () => {
    expect(mergeResultado({ puesto: "", empresa: "Esp", descripcion: "" }, gen)).toEqual({
      puesto: "H1",
      empresa: "Esp",
      descripcion: "texto generico",
      logo: "",
    });
  });
  it("una descripción específica, aunque sea corta, gana al texto de toda la página", () => {
    expect(mergeResultado({ puesto: "P", empresa: "E", descripcion: "corta" }, gen).descripcion).toBe("corta");
  });
  it("avisos confidenciales no tienen empresa", () => {
    for (const e of ["Confidencial", "Empresa confidencial", "Importante empresa del sector salud", "Empresa líder en retail"])
      expect(mergeResultado({ puesto: "P", empresa: e, descripcion: "d" }, null).empresa).toBe("");
    expect(mergeResultado({ puesto: "P", empresa: "Yuhmak S.A.", descripcion: "d" }, null).empresa).toBe("Yuhmak S.A.");
  });
  it("sin específico usa genérico (h1 || titulo)", () => {
    expect(mergeResultado(null, { ...gen, h1: "" }).puesto).toBe("T");
  });
});

describe("logo de la empresa", () => {
  it("linkedin: el logo de la oferta seleccionada, no los de las tarjetas", () => {
    load(`<head><title>Dev | Grupo ST | LinkedIn</title></head><body>
      <div componentkey="job-card-component-ref-1"><img alt="Logotipo de empresa para Otra" src="https://media.licdn.com/dms/image/company-logo_100_100/otra"></div>
      <div><img alt="Logotipo de empresa para Grupo ST" src="https://media.licdn.com/dms/image/company-logo_100_100/grupo-st"></div></body>`,
      "https://www.linkedin.com/jobs/search-results/?currentJobId=9");
    expect(scrapeLinkedin().logo).toBe("https://media.licdn.com/dms/image/company-logo_100_100/grupo-st");
  });
  // EL LOGO REAL ESTÁ BAJO /logos/empresas/; LA IMAGEN GENÉRICA DE UN AVISO CONFIDENCIAL SE DESCARTA
  it("computrabajo: logo real sí, imagen genérica de aviso confidencial no", () => {
    const panel = (img: string) => `<body><div data-offers-grid-detail-container><p class="title_offer">Dev</p>${img}
      <p>Descripción de la oferta</p></div></body>`;
    load(panel(`<img alt="Yuhmak S.A. logo" src="https://ii.ct-stc.com/5/logos/empresas/2023/yuhmak.jpg">`));
    expect(scrapeComputrabajo().logo).toBe("https://ii.ct-stc.com/5/logos/empresas/2023/yuhmak.jpg");
    load(panel(`<img alt=" logo" src="https://cp.ct-stc.com/web8/c/img/edVal.png">`));
    expect(scrapeComputrabajo().logo).toBe("");
  });
  it("bumeran: logo del JSON-LD", () => {
    load(fixture("bumeran.html").replace('"name":"MSP CONSULTORA EN RRHH"}', '"name":"MSP CONSULTORA EN RRHH","logo":"https://imgbum.jobscdn.com/logo.jpg"}'));
    expect(scrapeBumeran().logo).toBe("https://imgbum.jobscdn.com/logo.jpg");
  });
  it("indeed: company-logo del panel", () => {
    load(fixture("indeed.html").replace('<h2 data-testid="vj-job-title">', '<img data-testid="company-logo" alt="Lovelytics logo" src="https://d2q79iu7y748jz.cloudfront.net/s/_squarelogo/256x256/abc"><h2 data-testid="vj-job-title">'));
    expect(scrapeIndeed().logo).toBe("https://d2q79iu7y748jz.cloudfront.net/s/_squarelogo/256x256/abc");
  });
  it("seeds: la imagen con el nombre de la empresa (no el logo de Seeds)", () => {
    load(fixture("seeds.html").replace("<p>AB InBev</p>", '<img alt="Seeds" src="https://jobs.weareseeds.com/assets/seeds-logo.png"><img alt="AB InBev" src="https://cdn.example.com/abinbev.png"><p>AB InBev</p>'),
      "https://jobs.weareseeds.com/posicion/ab-inbev-analista-de-bi");
    expect(scrapeSeeds().logo).toBe("https://cdn.example.com/abinbev.png");
  });
  it("universia: no usa el logo de un JSON-LD de otra oferta", () => {
    load(`<head><script type="application/ld+json">{"@type":"JobPosting","title":"Otra oferta","hiringOrganization":{"logo":{"url":"https://x/otra.png"}}}</script></head>
      <body><app-job-detail-container><h1>DESARROLLADOR/A JUNIOR</h1><h2>ON TIME</h2></app-job-detail-container></body>`);
    expect(scrapeUniversia().logo).toBe("");
  });
  it("mergeResultado: solo URLs http(s)", () => {
    expect(mergeResultado({ puesto: "P", empresa: "E", descripcion: "d", logo: "javascript:alert(1)" }, null).logo).toBe("");
    expect(mergeResultado({ puesto: "P", empresa: "E", descripcion: "d", logo: "https://a/b.png" }, null).logo).toBe("https://a/b.png");
  });
});
