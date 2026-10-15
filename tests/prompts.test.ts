// TESTS DE LOS PROMPTS (CARTA Y CV), LA NORMALIZACIÓN DEL PERFIL Y LA LIMPIEZA DE LA CARTA GENERADA.
import { describe, it, expect, vi } from "vitest";
import { buildCvPrompt, buildLetterPrompt } from "../src/ai/prompts";
import { aniosDesdePeriodos, normalizePerfil, perfilSchema, summarizeCv, unirTecnologias } from "../src/ai/summarizeCv";
import type { Oferta, Perfil } from "../src/types";

const perfil: Perfil = {
  nombre: "Ana Pérez", titulo: "Dev", aniosExperiencia: 3, tecnologias: ["React", "TypeScript"],
  experiencias: [], proyectos: [], estudios: [], idiomas: [],
};
const oferta: Oferta = {
  puesto: "Frontend Dev", empresa: "Acme", descripcion: "Buscamos React", url: "https://x.com",
  sitio: "otro", idiomaDetectado: "es", pideIngles: false,
};

describe("buildLetterPrompt", () => {
  it("es carta", () => {
    const p = buildLetterPrompt(perfil, oferta, { tono: "formal", formato: "carta" }, "es");
    for (const s of ["Frontend Dev", "Acme", "Ana Pérez", "TypeScript", "NUNCA inventes", "entre 150 y 250 palabras", "carta", "formal"]) {
      expect(p).toContain(s);
    }
  });
  it("es mensaje corto", () => {
    const p = buildLetterPrompt(perfil, oferta, { tono: "cercano", formato: "mensaje-corto" }, "es");
    expect(p).toContain("máximo 3 oraciones");
    expect(p).toContain("mensaje corto");
    expect(p).toContain("cercano");
  });
  it("limita tecnologías y prohíbe placeholders", () => {
    const p = buildLetterPrompt(perfil, oferta, { tono: "formal", formato: "carta" }, "es");
    expect(p).toContain("Las únicas tecnologías, herramientas y metodologías que podés mencionar son: React, TypeScript.");
    expect(p).toContain("sin campos entre corchetes");
    expect(p).toContain('firmá con "Ana Pérez"');
  });
  it("firma en formato nombre propio si el CV lo tiene en mayúsculas", () => {
    const p = buildLetterPrompt({ ...perfil, nombre: "TOMÁS AGUSTÍN MATTEOZZI" }, oferta, { tono: "formal", formato: "carta" }, "es");
    expect(p).toContain('firmá con "Tomás Agustín Matteozzi"');
    expect(p).toContain("NUNCA nombres una tecnología o metodología que pide la oferta");
  });
  it("fallback empresa", () => {
    expect(buildLetterPrompt(perfil, { ...oferta, empresa: "" }, { tono: "formal", formato: "carta" }, "es")).toContain("la empresa");
  });
  it("en", () => {
    const p = buildLetterPrompt(perfil, oferta, { tono: "cercano", formato: "mensaje-corto" }, "en");
    expect(p).toContain("NEVER invent");
    expect(p).toContain("3 sentences max");
    expect(p).toContain("friendly");
  });
  it("en tiene las mismas reglas que es", () => {
    const p = buildLetterPrompt({ ...perfil, idiomas: ["Inglés B2"] }, oferta, { tono: "formal", formato: "carta" }, "en");
    expect(p).toContain("The only technologies, tools and methodologies you may mention are: React, TypeScript.");
    expect(p).toContain("Profile languages: Inglés B2");
    expect(p).toContain("no placeholders in brackets");
    expect(p).toContain("no markdown");
    expect(p).toContain('Start with exactly "Dear Acme team," and sign with "Ana Pérez"');
    expect(buildLetterPrompt(perfil, oferta, { tono: "cercano", formato: "carta" }, "en")).toContain('"Hi Acme team,"');
  });
});

describe("buildCvPrompt", () => {
  it("incluye CV y esquema", () => {
    const p = buildCvPrompt("MI CV TEXTO", perfilSchema);
    expect(p).toContain("MI CV TEXTO");
    expect(p).toContain(JSON.stringify(perfilSchema));
    expect(p).toContain("como máximo 3 logros");
    expect(p).toContain("Inglés B2");
  });
});

describe("normalizePerfil", () => {
  it("rellena defaults", () => {
    const p = normalizePerfil({ nombre: "X", tecnologias: ["a", 1], experiencias: [{ empresa: "E" }] });
    expect(p.nombre).toBe("X");
    expect(p.titulo).toBe("");
    expect(p.aniosExperiencia).toBe(0);
    expect(p.tecnologias).toEqual(["a"]);
    expect(p.experiencias[0]).toEqual({ empresa: "E", puesto: "", periodo: "", logros: [] });
    expect(normalizePerfil(null).idiomas).toEqual([]);
  });
});

describe("aniosDesdePeriodos", () => {
  it("calcula desde el primer año hasta actualidad", () => {
    expect(aniosDesdePeriodos(["2022 – actualidad", "2020 – 2022"], 2026)).toBe(6);
    expect(aniosDesdePeriodos(["2015 - 2018"], 2026)).toBe(3);
    expect(aniosDesdePeriodos(["", "sin fechas"], 2026)).toBeNull();
  });
});

import { limpiarCarta } from "../src/ai/generateLetter";
describe("limpiarCarta", () => {
  it("saca corchetes de dominios pero deja placeholders reales", () => {
    expect(limpiarCarta("work on [clickturno.com] and [Tu Nombre]\n\n\n\nBye")).toBe("work on clickturno.com and [Tu Nombre]\n\nBye");
  });
});

describe("normalizePerfil dedupe", () => {
  it("saca experiencias y proyectos repetidos", () => {
    const e = { empresa: "InnQube", puesto: "QA", periodo: "2025", logros: [] };
    const r = normalizePerfil({ experiencias: [e, e, { ...e, periodo: "2026" }], proyectos: [{ nombre: "x" }, { nombre: "x" }] });
    expect(r.experiencias).toHaveLength(2);
    expect(r.proyectos).toHaveLength(1);
  });
});

describe("tecnologías del CV que el modelo omite", () => {
  const cv = "Desarrollador. Stack: React, TypeScript, Git y GitHub. También ReactJS y node.";

  it("unirTecnologias agrega las del texto sin duplicar, primero las del modelo", () => {
    expect(unirTecnologias(["TypeScript", "ReactJS"], cv)).toEqual(["TypeScript", "ReactJS", "Git", "GitHub", "Node.js"]);
    expect(unirTecnologias([], "")).toEqual([]);
  });

  it("summarizeCv suma Git y GitHub aunque Nano no los devuelva", async () => {
    // MOCK DE LanguageModel (GEMINI NANO): DEVUELVE UN PERFIL SIN Git NI GitHub Y EXPONE destroy PARA VERIFICAR LA LIMPIEZA
    const salida = JSON.stringify({ ...perfil, tecnologias: ["React", "TypeScript"] });
    const destroy = vi.fn();
    vi.stubGlobal("LanguageModel", {
      create: async () => ({
        promptStreaming: () => new ReadableStream({ start(c) { c.enqueue(salida); c.close(); } }),
        destroy,
      }),
    });
    try {
      const r = await summarizeCv(cv);
      expect(r.tecnologias).toEqual(["React", "TypeScript", "Git", "GitHub", "Node.js"]);
      expect(destroy).toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("normalizePerfil dedupe por empresa + período", () => {
  it("misma empresa y período con puesto escrito distinto es el mismo trabajo", () => {
    const r = normalizePerfil({ experiencias: [
      { empresa: "InnQube", puesto: "Desarrollador Fullstack y QA (Proyecto Microbrew)", periodo: "03/2026 - 08/2026", logros: [] },
      { empresa: "InnQube", puesto: "Desarrollador Fullstack y QA", periodo: "03/2026 - 08/2026", logros: [] },
      { empresa: "InnQube", puesto: "Desarrollador Fullstack y QA", periodo: "04/2025 - 11/2025", logros: [] },
    ] });
    expect(r.experiencias).toHaveLength(2);
  });
});

describe("limpiarCarta doble punto", () => {
  it("saca el punto duplicado tras una abreviatura pero respeta los puntos suspensivos", () => {
    expect(limpiarCarta("en Yuhmak S.A.. Mi experiencia... sigue")).toBe("en Yuhmak S.A. Mi experiencia... sigue");
  });
});
