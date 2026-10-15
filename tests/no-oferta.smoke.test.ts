// @vitest-environment happy-dom
// SMOKE TEST DEL PANEL EN UNA PÁGINA QUE NO ES UNA OFERTA: ESTADO VACÍO Y ERROR DE LECTURA.
import { it, expect } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

// MOCK EN MEMORIA DE chrome.storage.local, chrome.tabs Y chrome.scripting
const store: Record<string, unknown> = {
  perfil: { nombre: "Ana", titulo: "Dev", aniosExperiencia: 2, tecnologias: ["ReactJS"], experiencias: [], proyectos: [], estudios: [], idiomas: [] },
  historial: [],
};
(globalThis as any).chrome = {
  storage: { local: {
    get: async (k: string | string[]) => Object.fromEntries((Array.isArray(k) ? k : [k]).map((x) => [x, store[x]])),
    set: async (o: object) => Object.assign(store, o), remove: async () => {}, clear: async () => {},
  }, onChanged: { addListener() {}, removeListener() {} } },
  tabs: {
    query: async () => [{ id: 1, url: "https://example.com/blog/receta" }],
  },
  // PÁGINA COMÚN: TEXTO CORTO, NADA QUE PAREZCA UNA OFERTA LABORAL
  scripting: { executeScript: async () => [{ result: { titulo: "Receta de tarta", h1: "Receta de tarta", empresa: "", texto: "Mezclá harina, huevos y manteca. Horno 180 grados." } }] },
  runtime: { getManifest: () => ({}) },
};
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

it("shows the empty state on a page that is not a job post, and 'Generar igual' reveals the form", async () => {
  const { default: App } = await import("../src/sidepanel/App");
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => { root.render(createElement(App)); });
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  const txt = () => div.textContent ?? "";
  const btn = (t: string) => [...div.querySelectorAll("button")].find((b) => b.textContent === t);

  expect(txt()).toContain("No hay una oferta en esta página");
  expect(txt()).not.toContain("Generar carta");
  expect(txt()).not.toContain("No parece una oferta laboral");
  expect(txt()).toContain("Volver a leer la pestaña");
  // SIN LINKS DE RECOMENDACIÓN DE SITIOS DE EMPLEO EN ESTA PANTALLA
  expect(div.querySelector('nav[aria-label="Sitios de empleo"]')).toBeNull();
  expect(txt()).not.toContain("Buscar en LinkedIn");
  expect(btn("Volver a leer la pestaña")).toBeTruthy();


  await act(async () => { btn("Generar igual")!.click(); });
  expect(txt()).toContain("Generar carta");
  expect(txt()).not.toContain("No hay una oferta en esta página");
  expect([...div.querySelectorAll('[role="radio"]')].map((r) => r.textContent))
    .toEqual(["Formal", "Cercano", "Carta", "Mensaje corto", "Automático", "Español", "English"]);
  root.unmount();
});

it("shows the read error under the empty state when the tab can't be read", async () => {
  // UNA URL chrome:// NO SE PUEDE LEER: EL PANEL DEBE MOSTRAR EL ERROR DE LECTURA
  (globalThis as any).chrome.tabs.query = async () => [{ id: 2, url: "chrome://extensions" }];
  const { default: App } = await import("../src/sidepanel/App");
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => { root.render(createElement(App)); });
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  expect(div.textContent).toContain("No hay una oferta en esta página");
  expect(div.textContent).toContain("Esta pestaña no se puede leer");
  expect(div.textContent).not.toContain("Generar igual");
  expect(div.textContent).not.toContain("Generar carta");
  root.unmount();
});
