// TESTS DE LA ELECCIÓN FINAL DE IDIOMA Y DE LA DETECCIÓN POR STOPWORDS (src/ai/detectLanguage).
import { describe, it, expect } from "vitest";
import { detectarIdioma, idiomaFinal, idiomaPorStopwords } from "../src/ai/detectLanguage";

describe("idiomaFinal (plan 7.3)", () => {
  it("la elección explícita gana", () => {
    expect(idiomaFinal("es", "en")).toBe("es");
    expect(idiomaFinal("en", "es")).toBe("en");
  });
  it("auto usa el detectado y 'otro' cae a español", () => {
    expect(idiomaFinal("auto", "en")).toBe("en");
    expect(idiomaFinal("auto", "es")).toBe("es");
    expect(idiomaFinal("auto", "otro")).toBe("es");
  });
});

describe("detección de idioma sin LanguageDetector", () => {
  it("heurística de stopwords", () => {
    expect(idiomaPorStopwords("Buscamos un desarrollador con experiencia en React para el equipo de la empresa")).toBe("es");
    expect(idiomaPorStopwords("We are looking for a developer with experience in React to join the team")).toBe("en");
    expect(idiomaPorStopwords("React TypeScript")).toBe("otro");
  });
  it("detectarIdioma cae a la heurística si la API no existe", async () => {
    expect(await detectarIdioma("You will work with our team and the product owners")).toBe("en");
  });
});
