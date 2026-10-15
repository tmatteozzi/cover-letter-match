// @vitest-environment happy-dom
// SMOKE TESTS DE LA UI DEL PANEL: PANTALLA PRINCIPAL, HISTORIAL, PERFIL Y ONBOARDING.
import { it, expect } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

// CANTIDAD DE VECES QUE EL PANEL LEYÓ LA PESTAÑA ACTIVA
let lecturas = 0;
// MOCK EN MEMORIA DE chrome.storage.local, chrome.tabs Y chrome.scripting (OFERTA CON React Y Node)
const store: Record<string, unknown> = {
  perfil: { nombre: "Ana", titulo: "Dev", aniosExperiencia: 2, tecnologias: ["ReactJS"], experiencias: [], proyectos: [], estudios: [], idiomas: [] },
  historial: [{ id: "1", fecha: "2026-10-01T00:00:00Z", empresa: "Acme", puesto: "Front", url: "https://a", sitio: "otro", idioma: "es", tono: "formal", formato: "carta", carta: "Hola" }],
};
(globalThis as any).chrome = {
  storage: { local: {
    get: async (k: string | string[]) => Object.fromEntries((Array.isArray(k) ? k : [k]).map((x) => [x, store[x]])),
    set: async (o: object) => Object.assign(store, o), remove: async () => {}, clear: async () => {},
  }, onChanged: { addListener() {}, removeListener() {} } },
  tabs: { query: async () => { lecturas++; return [{ id: 1, url: "https://example.com/job" }]; } },
  scripting: { executeScript: async () => [{ result: { titulo: "Frontend Dev", h1: "Frontend Dev", empresa: "Globex", texto: "Buscamos React y Node con experiencia en TypeScript. ".repeat(10) } }] },
  runtime: { getManifest: () => ({}) },
};
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

it("renders main, historial and perfil", async () => {
  const { default: App } = await import("../src/sidepanel/App");
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => { root.render(createElement(App)); });
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  const txt = () => div.textContent ?? "";
  // HEADER: SOLO LAS ACCIONES, SIN NOMBRE NI ÍCONO DE LA APP
  expect(txt()).not.toContain("Cover Letter Match");
  expect(document.querySelector("header img")).toBeNull();
  for (const s of ["Historial", "Perfil", "Generar carta", "Formal", "Cercano", "Mensaje corto", "Automático", "English", "Coincidencias", "React", "No figuran en tu CV", "Volver a leer la pestaña"]) expect(txt()).toContain(s);
  // TONO / FORMATO / IDIOMA SON ToggleGroup DE shadcn: LOS ITEMS DE RADIX SON BOTONES CON role="radio"
  const radios = [...div.querySelectorAll('[role="radio"]')];
  expect(radios.map((r) => r.textContent)).toEqual(["Formal", "Cercano", "Carta", "Mensaje corto", "Automático", "Español", "English"]);
  expect(radios.filter((r) => r.getAttribute("aria-checked") === "true").length).toBe(3);
  // PANTALLA PRINCIPAL: TABS SEGMENTADOS (PANELES SIGUEN MONTADOS), ACCIONES DEL HEADER SOLO CON ÍCONO
  // Y SIN BADGE DE ESTADO DE LA IA CUANDO TODO ESTÁ BIEN
  expect([...div.querySelectorAll('[role="tab"]')].map((t) => t.textContent)).toEqual(["Carta", "Coincidencias", "Oferta"]);
  expect(div.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe("Carta");
  expect([...div.querySelectorAll("header button")].map((b) => b.getAttribute("aria-label") ?? b.textContent)).toEqual(["Recargar oferta", "Historial", "Perfil"]);
  // "Recargar oferta" VUELVE A LEER LA OFERTA DE LA PÁGINA (EJ. UNA NUEVA ABIERTA EN UN MODAL)
  const antes = lecturas;
  const recargar = [...div.querySelectorAll("header button")].find((b) => b.textContent === "Recargar oferta") as HTMLButtonElement;
  await act(async () => { recargar.click(); await new Promise((r) => setTimeout(r, 50)); });
  expect(lecturas).toBeGreaterThan(antes);
  expect(txt()).not.toMatch(/IA local lista|Chequeando la IA|beta|powered by/i);
  // "Tu carta" SOLO APARECE CUANDO SE ESTÁ GENERANDO UNA CARTA
  expect(txt()).not.toContain("Tu carta");
  expect(txt()).not.toContain("se va a escribir");
  expect(txt()).not.toContain("Tocá Generar carta");
  expect(div.querySelector("#carta")).toBeNull();
  // ELEGIR UNA OPCIÓN ACTUALIZA LA SELECCIÓN Y PERSISTE LA PREFERENCIA
  const cercano = radios.find((r) => r.textContent === "Cercano") as HTMLButtonElement;
  await act(async () => { cercano.click(); await new Promise((r) => setTimeout(r, 10)); });
  expect(cercano.getAttribute("aria-checked")).toBe("true");
  expect((store.preferencias as { tono?: string } | undefined)?.tono).toBe("cercano");
  const btn = (t: string) => [...div.querySelectorAll("button")].find((b) => b.textContent === t)!;
  expect(txt()).not.toMatch(/Sheets/i);
  await act(async () => { btn("Historial").click(); await new Promise((r) => setTimeout(r, 20)); });
  expect(txt()).toContain("Acme"); expect(txt()).toContain("← Volver");
  // LAS ENTRADAS DEL HISTORIAL SON COLAPSABLES: ABRIRLA MUESTRA LA CARTA Y SUS ACCIONES
  const trigger = [...div.querySelectorAll("button")].find((b) => b.textContent?.includes("Front"))!;
  await act(async () => { trigger.click(); });
  expect(txt()).toContain("Hola"); expect(btn("Copiar")).toBeTruthy(); expect(btn("Eliminar")).toBeTruthy();
  await act(async () => { btn("← Volver").click(); });
  await act(async () => { btn("Perfil").click(); await new Promise((r) => setTimeout(r, 20)); });
  for (const s of ["Guardar perfil", "Borrar mis datos", "Elegir archivo PDF", "Resumir con IA"]) expect(txt()).toContain(s);
  expect([...div.querySelectorAll('[role="tab"]')].map((t) => t.textContent)).toEqual(["Datos", "Experiencia", "CV"]);
  expect((div.querySelector("#pf-nombre") as HTMLInputElement).value).toBe("Ana");
  for (const s of ["Guardar perfil", "Borrar mis datos", "Resumir con IA", "← Volver"]) expect(btn(s)).toBeTruthy();
  // "Borrar mis datos" PIDE CONFIRMACIÓN EN UN AlertDialog ANTES DE BORRAR NADA
  await act(async () => { btn("Borrar mis datos").click(); await new Promise((r) => setTimeout(r, 10)); });
  const dialog = document.querySelector('[role="alertdialog"]');
  expect(dialog).toBeTruthy();
  expect([...dialog!.querySelectorAll("button")].some((b) => b.textContent === "Borrar")).toBe(true);
  expect(store.perfil).toBeTruthy();
  await act(async () => { [...dialog!.querySelectorAll("button")].find((b) => b.textContent === "Cancelar")!.click(); await new Promise((r) => setTimeout(r, 10)); });
  // PERFIL: CV SOLO COMO PDF (SIN CAJA DE TEXTO NI "Guardar CV") Y SIN INTEGRACIONES Sheets / Gemini
  expect(div.querySelector("#cv")).toBeNull(); expect(div.querySelector("#pdf")).toBeTruthy();
  expect(div.querySelector("#gemini-key")).toBeNull();
  for (const s of [/Sheets/i, /Integraciones/i, /API key/i, /Gemini en la nube/i, /Guardar CV/]) expect(txt()).not.toMatch(s);
  root.unmount();
});

it("onboarding: only PDF upload, no pasted-text option", async () => {
  // SIN PERFIL GUARDADO, EL PANEL ARRANCA EN ONBOARDING
  delete store.perfil;
  delete store.cvTexto;
  const { default: App } = await import("../src/sidepanel/App");
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => { root.render(createElement(App)); });
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  const btn = (t: string) => [...div.querySelectorAll("button")].find((b) => b.textContent === t);
  // EL PDF ES LA ÚNICA ENTRADA: SIN CAJA DE TEXTO, SIN PEGAR TEXTO, SIN CONFIRMAR ANTES DEL RESUMEN IA
  expect(div.querySelector("#pdf")).toBeTruthy();
  expect(div.querySelector("#cv")).toBeNull();
  expect(div.querySelector("textarea")).toBeNull();
  for (const s of ["Bienvenido/a", "Completar perfil a mano", "Elegir archivo PDF"]) expect(div.textContent).toContain(s);
  expect(div.textContent).not.toMatch(/Pegar el texto|Pegá/);
  expect(btn("Resumir con IA")).toBeUndefined(); // SOLO SE MUESTRA PARA REINTENTAR TRAS LEER UN PDF
  expect(div.querySelector("#gemini-key")).toBeNull();
  expect(div.textContent).not.toMatch(/API key|Gemini en la nube/i);
  // "Completar perfil a mano" ABRE EL PASO DE REVISIÓN
  await act(async () => { btn("Completar perfil a mano")!.click(); });
  expect(btn("Guardar y empezar")).toBeTruthy();
  expect([...div.querySelectorAll('[role="tab"]')].map((t) => t.textContent)).toEqual(["Datos", "Experiencia"]);
  root.unmount();
});
