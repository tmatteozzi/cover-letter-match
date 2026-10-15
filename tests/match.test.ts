// TESTS DE src/match: NORMALIZACIÓN DE ALIAS, DETECCIÓN DE TECNOLOGÍAS EN TEXTO Y CÁLCULO DE MATCH.
import { describe, it, expect } from "vitest";
import { calcularMatch, normalizarTecnologia, tecnologiasEnTexto } from "../src/match";

describe("normalizarTecnologia", () => {
  it("resuelve alias", () => {
    expect(normalizarTecnologia("ReactJS")).toBe("React");
    expect(normalizarTecnologia("react js")).toBe("React");
    expect(normalizarTecnologia(" React.js ")).toBe("React");
    expect(normalizarTecnologia("NodeJS")).toBe("Node.js");
    expect(normalizarTecnologia("Node")).toBe("Node.js");
    expect(normalizarTecnologia("Postgres")).toBe("PostgreSQL");
    expect(normalizarTecnologia("JS")).toBe("JavaScript");
    expect(normalizarTecnologia("K8s")).toBe("Kubernetes");
    expect(normalizarTecnologia("golang")).toBe("Go");
  });
  it("devuelve desconocidas recortadas", () => {
    expect(normalizarTecnologia("  FooBarLang ")).toBe("FooBarLang");
    expect(normalizarTecnologia("")).toBe("");
  });
});

describe("tecnologiasEnTexto", () => {
  it("detecta alias", () => {
    expect(tecnologiasEnTexto("Buscamos ReactJS, NodeJS y Postgres")).toEqual([
      "React",
      "Node.js",
      "PostgreSQL",
    ]);
    expect(tecnologiasEnTexto("JS y K8s")).toEqual(["JavaScript", "Kubernetes"]);
  });
  it("maneja nombres con simbolos", () => {
    expect(tecnologiasEnTexto("Experiencia en C# y C++.")).toEqual(["C#", "C++"]);
    expect(tecnologiasEnTexto("Stack: .NET, CI/CD")).toEqual([".NET", "CI/CD"]);
    expect(tecnologiasEnTexto("Next.js y Node.js")).toEqual(["Next.js", "Node.js"]);
  });
  it("tolera puntuacion final", () => {
    expect(tecnologiasEnTexto("usamos React.")).toEqual(["React"]);
    expect(tecnologiasEnTexto("Usamos Node.")).toEqual(["Node.js"]);
    expect(tecnologiasEnTexto("(Python), Java;")).toEqual(["Python", "Java"]);
  });
  it("Node.js no genera duplicados", () => {
    expect(tecnologiasEnTexto("Node.js, node y NodeJS")).toEqual(["Node.js"]);
  });
  it("es insensible a mayusculas", () => {
    expect(tecnologiasEnTexto("typescript, DOCKER y postgresql")).toEqual([
      "TypeScript",
      "Docker",
      "PostgreSQL",
    ]);
  });
  it("no confunde Java con JavaScript ni SQL con MySQL", () => {
    expect(tecnologiasEnTexto("JavaScript")).toEqual(["JavaScript"]);
    expect(tecnologiasEnTexto("MySQL")).toEqual(["MySQL"]);
  });
  it("evita falsos positivos", () => {
    expect(tecnologiasEnTexto("go to the office")).toEqual([]);
    expect(tecnologiasEnTexto("vamos a ir")).toEqual([]);
    expect(tecnologiasEnTexto("Express your ideas, express yourself")).toEqual(["Express"]);
    expect(tecnologiasEnTexto("express your ideas")).toEqual([]);
    expect(tecnologiasEnTexto("the rest of the team, swift and rust-free")).toEqual([]);
    expect(tecnologiasEnTexto("R&D team")).toEqual([]);
    expect(tecnologiasEnTexto("spring is here")).toEqual([]);
  });
  it("respeta casos exactos de palabras ambiguas", () => {
    expect(tecnologiasEnTexto("Go, Rust, Swift y R")).toEqual(["Go", "Rust", "Swift", "R"]);
    expect(tecnologiasEnTexto("golang o GOLANG")).toEqual(["Go"]);
    expect(tecnologiasEnTexto("Express.js y expressjs")).toEqual(["Express"]);
    expect(tecnologiasEnTexto("Spring Boot")).toEqual(["Spring Boot"]);
  });
  it("React Native vs React", () => {
    expect(tecnologiasEnTexto("Experiencia con React Native")).toEqual(["React Native"]);
    expect(tecnologiasEnTexto("React Native y React")).toEqual(["React Native", "React"]);
  });
  it("deduplica y mantiene orden de aparicion", () => {
    expect(tecnologiasEnTexto("Docker, AWS, docker, React, aws")).toEqual(["Docker", "AWS", "React"]);
  });
  it("detecta metodologias en espanol", () => {
    expect(tecnologiasEnTexto("Trabajamos con metodologías ágiles y Scrum")).toEqual(["Agile", "Scrum"]);
    expect(tecnologiasEnTexto("API REST y RESTful")).toEqual(["REST"]);
  });
  it("entradas vacias", () => {
    expect(tecnologiasEnTexto("")).toEqual([]);
    expect(tecnologiasEnTexto("   ")).toEqual([]);
  });
});

describe("calcularMatch", () => {
  const perfil = {
    tecnologias: ["ReactJS", "TypeScript"],
    proyectos: [{ nombre: "P", descripcion: "d", tecnologias: ["Postgres", "node"] }],
  };
  it("usa tecnologias del perfil y proyectos con alias", () => {
    expect(calcularMatch("React, Node.js, PostgreSQL, Docker y Kubernetes", perfil)).toEqual({
      coincidencias: ["React", "Node.js", "PostgreSQL"],
      faltan: ["Docker", "Kubernetes"],
    });
  });
  it("entradas vacias", () => {
    expect(calcularMatch("", perfil)).toEqual({ coincidencias: [], faltan: [] });
    expect(calcularMatch("Docker", { tecnologias: [], proyectos: [] })).toEqual({
      coincidencias: [],
      faltan: ["Docker"],
    });
  });
});

describe("Go en frases en inglés", () => {
  it("no confunde imperativos con el lenguaje Go", () => {
    expect(tecnologiasEnTexto("Go to market strategy. Go live in Q3.")).not.toContain("Go");
    expect(tecnologiasEnTexto("Backend en Go y Python")).toContain("Go");
  });
});
