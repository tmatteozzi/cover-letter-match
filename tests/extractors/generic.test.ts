// TESTS DE LAS UTILIDADES GENÉRICAS: detectSitio, pideIngles Y recortar.
import { describe, it, expect } from "vitest";
import { detectSitio, pideIngles, recortar } from "../../src/extractors/generic";

describe("detectSitio", () => {
  it("detecta sitios", () => {
    expect(detectSitio("https://www.linkedin.com/jobs/view/1")).toBe("linkedin");
    expect(detectSitio("https://ar.computrabajo.com/oferta")).toBe("computrabajo");
    expect(detectSitio("https://www.bumeran.com.ar/empleos/x")).toBe("bumeran");
    expect(detectSitio("https://www.zonajobs.com.ar/x")).toBe("zonajobs");
    expect(detectSitio("https://example.com")).toBe("otro");
    expect(detectSitio("no es url")).toBe("otro");
  });
});

describe("pideIngles", () => {
  it("positivos", () => {
    expect(pideIngles("Inglés avanzado")).toBe(true);
    expect(pideIngles("ingles intermedio")).toBe(true);
    expect(pideIngles("Fluent English required")).toBe(true);
    expect(pideIngles("perfil bilingüe")).toBe(true);
  });
  it("negativos", () => {
    expect(pideIngles("Buscamos desarrollador React")).toBe(false);
  });
});

describe("recortar", () => {
  it("colapsa espacios y corta", () => {
    expect(recortar("  a   b \n\n\n\n c  ")).toBe("a b\n\nc");
    expect(recortar("x".repeat(5000)).length).toBe(4000);
    expect(recortar("abcdef", 3)).toBe("abc");
  });
});
