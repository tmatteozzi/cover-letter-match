// TESTS DE LAS FUNCIONES PURAS DEL HISTORIAL: AGREGAR, ACTUALIZAR, QUITAR, AGRUPAR Y FILTRAR.
import { describe, it, expect } from "vitest";
import { actualizarCarta, agregarEntrada, agruparPorEmpresa, filtrarHistorial, quitarEntrada, MAX_HISTORIAL } from "../src/historial";
import type { EntradaHistorial } from "../src/types";

// FÁBRICA DE ENTRADAS DE HISTORIAL DE PRUEBA
const e = (id: string, empresa: string, puesto = "Dev"): EntradaHistorial => ({
  id, fecha: "2026-10-14T12:00:00.000Z", empresa, puesto, url: `https://x.com/${id}`, sitio: "otro",
  idioma: "es", tono: "formal", formato: "carta", carta: `carta ${id}`,
});

describe("historial", () => {
  it("agrega primero y respeta el máximo", () => {
    let l: EntradaHistorial[] = [];
    for (let i = 0; i < MAX_HISTORIAL + 5; i++) l = agregarEntrada(l, e(String(i), "Acme"));
    expect(l).toHaveLength(MAX_HISTORIAL);
    expect(l[0].id).toBe(String(MAX_HISTORIAL + 4));
  });
  it("actualiza la carta editada y elimina", () => {
    const l = [e("a", "Acme"), e("b", "Globex")];
    expect(actualizarCarta(l, "b", "editada")[1].carta).toBe("editada");
    expect(actualizarCarta(l, "b", "editada")[0].carta).toBe("carta a");
    expect(quitarEntrada(l, "a").map((x) => x.id)).toEqual(["b"]);
  });
  it("agrupa por empresa sin distinguir mayúsculas/acentos, en orden de la más nueva", () => {
    const g = agruparPorEmpresa([e("1", "Mercado Libre"), e("2", "Globex"), e("3", "mercado libre"), e("4", "")]);
    expect(g.map((x) => x.empresa)).toEqual(["Mercado Libre", "Globex", "Sin empresa"]);
    expect(g[0].entradas.map((x) => x.id)).toEqual(["1", "3"]);
  });
  it("filtra por empresa o puesto", () => {
    const l = [e("1", "Acme", "Frontend"), e("2", "Globex", "Backend"), e("3", "Tecnología SA", "QA")];
    expect(filtrarHistorial(l, "front").map((x) => x.id)).toEqual(["1"]);
    expect(filtrarHistorial(l, "GLOBEX").map((x) => x.id)).toEqual(["2"]);
    expect(filtrarHistorial(l, "tecnologia").map((x) => x.id)).toEqual(["3"]);
    expect(filtrarHistorial(l, "  ")).toHaveLength(3);
  });
});
