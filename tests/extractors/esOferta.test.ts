// TESTS DE pareceOferta: HEURÍSTICA DE TEXTO Y DECISIÓN POR URL EN SITIOS CONOCIDOS.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { pareceOferta } from "../../src/extractors/esOferta";

// LEE UN FIXTURE HTML Y LE QUITA LAS ETIQUETAS PARA OBTENER TEXTO PLANO
const fx = (n: string) =>
  readFileSync(new URL(`./fixtures/${n}`, import.meta.url), "utf8").replace(/<[^>]+>/g, " ");

describe("pareceOferta", () => {
  it("true para una oferta real", () => {
    expect(pareceOferta("Dev", fx("computrabajo.html"))).toBe(true);
  });
  it("false sin puesto", () => {
    expect(pareceOferta("  ", fx("computrabajo.html"))).toBe(false);
  });
  it("false con texto corto", () => {
    expect(pareceOferta("Dev", "Requisitos: experiencia")).toBe(false);
  });
  it("false para una página que no es oferta", () => {
    expect(pareceOferta("El clima", fx("no-oferta.html"))).toBe(false);
  });
  it("en sitios conocidos decide por la URL", () => {
    const largo = fx("computrabajo.html");
    expect(pareceOferta("Bolsa de trabajo", largo, "https://ar.computrabajo.com/")).toBe(false);
    expect(pareceOferta("Dev", largo, "https://ar.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-dev-123")).toBe(true);
    expect(pareceOferta("Jobs", largo, "https://www.linkedin.com/jobs/")).toBe(false);
    expect(pareceOferta("Dev", largo, "https://www.linkedin.com/jobs/search/?currentJobId=42")).toBe(true);
    expect(pareceOferta("Dev", largo, "https://www.bumeran.com.ar/empleos/dev-react-acme-1116.html")).toBe(true);
    expect(pareceOferta("Empleos", largo, "https://www.bumeran.com.ar/empleos-busqueda-react.html")).toBe(false);
    expect(pareceOferta("Dev", largo, "https://job-boards.greenhouse.io/vercel/jobs/1")).toBe(true);
  });
  it("indeed y seeds por URL; el panel de Computrabajo cuenta por 'enfocada'", () => {
    const largo = fx("computrabajo.html");
    expect(pareceOferta("Dev", largo, "https://ar.indeed.com/jobs?q=react&vjk=59d1")).toBe(true);
    expect(pareceOferta("Dev", largo, "https://ar.indeed.com/viewjob?jk=59d1")).toBe(true);
    expect(pareceOferta("Empleos", largo, "https://ar.indeed.com/")).toBe(false);
    expect(pareceOferta("Dev", largo, "https://jobs.weareseeds.com/posicion/ab-inbev-bi")).toBe(true);
    expect(pareceOferta("Seeds", largo, "https://jobs.weareseeds.com/")).toBe(false);
    expect(pareceOferta("36 Ofertas", largo, "https://ar.computrabajo.com/trabajo-de-react")).toBe(false);
    expect(pareceOferta("Dev React", largo, "https://ar.computrabajo.com/trabajo-de-react", true)).toBe(true);
  });
  it("una URL de oferta con un muro de verificación (Cloudflare) no es una oferta", () => {
    // TEXTO LARGO DE UN MURO ANTIBOT: PASA LOS CHEQUEOS DE TEXTO, PERO LA URL DE OFERTA NO ALCANZA SOLA
    const muro = "Additional Verification Required. Your Ray ID for this request is a4aabf72. Return home. Troubleshooting Cloudflare Errors. Need more help? Contact us. ".repeat(3);
    expect(pareceOferta("Additional Verification Required", muro, "https://ar.indeed.com/viewjob?jk=59d1")).toBe(false);
  });
  it("universia: oferta por URL propia o por selectedJob", () => {
    const largo = fx("computrabajo.html");
    expect(pareceOferta("Dev", largo, "https://www.universia.net/ar/empleo/ed82bd18-272d-4453-a9e3-c6e8f997fb18/dev.html")).toBe(true);
    expect(pareceOferta("Dev", largo, "https://www.universia.net/ar/empleo?roles=Dev&selectedJob=ab2418c5")).toBe(true);
    expect(pareceOferta("Empleo", largo, "https://www.universia.net/ar/empleo")).toBe(false);
  });
});

