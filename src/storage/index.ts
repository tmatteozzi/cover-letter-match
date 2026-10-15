// ACCESO A chrome.storage.local: CV, PERFIL, PREFERENCIAS E HISTORIAL.
import type { EntradaHistorial, Perfil, Preferencias } from "../types";
import { actualizarCarta, agregarEntrada, quitarEntrada } from "../historial";

// VALORES POR DEFECTO SI EL USUARIO AÚN NO GUARDÓ PREFERENCIAS
const DEFAULT_PREFS: Preferencias = { tono: "formal", formato: "carta", idioma: "auto" };

// TEXTO CRUDO DEL CV ("" SI NO HAY)
export async function getCvTexto(): Promise<string> {
  const { cvTexto } = await chrome.storage.local.get("cvTexto");
  return (cvTexto as string | undefined) ?? "";
}

export async function setCvTexto(t: string): Promise<void> {
  await chrome.storage.local.set({ cvTexto: t });
}

// PERFIL EXTRAÍDO DEL CV (null SI NO HAY)
export async function getPerfil(): Promise<Perfil | null> {
  const { perfil } = await chrome.storage.local.get("perfil");
  return (perfil as Perfil | undefined) ?? null;
}

export async function setPerfil(p: Perfil): Promise<void> {
  await chrome.storage.local.set({ perfil: p });
}

// PREFERENCIAS GUARDADAS SOBRE LOS VALORES POR DEFECTO
export async function getPreferencias(): Promise<Preferencias> {
  const { preferencias } = await chrome.storage.local.get("preferencias");
  return { ...DEFAULT_PREFS, ...(preferencias as Partial<Preferencias> | undefined) };
}

// BORRA TODO: CV, PERFIL, PREFERENCIAS E HISTORIAL
export async function clearAll(): Promise<void> {
  await chrome.storage.local.clear();
}

export async function setPreferencias(p: Preferencias): Promise<void> {
  await chrome.storage.local.set({ preferencias: p });
}

// ----- HISTORIAL (v3) -----
// LISTA GUARDADA; TOLERA UN VALOR AUSENTE O CORRUPTO
export async function getHistorial(): Promise<EntradaHistorial[]> {
  const { historial } = await chrome.storage.local.get("historial");
  return Array.isArray(historial) ? (historial as EntradaHistorial[]) : [];
}

// LEE, APLICA UNA TRANSFORMACIÓN PURA, GUARDA Y DEVUELVE LA LISTA NUEVA
async function editarHistorial(f: (l: EntradaHistorial[]) => EntradaHistorial[]): Promise<EntradaHistorial[]> {
  const nuevo = f(await getHistorial());
  await chrome.storage.local.set({ historial: nuevo });
  return nuevo;
}

export const agregarAlHistorial = (e: EntradaHistorial) => editarHistorial((l) => agregarEntrada(l, e));
export const actualizarHistorial = (id: string, carta: string) => editarHistorial((l) => actualizarCarta(l, id, carta));
export const eliminarDelHistorial = (id: string) => editarHistorial((l) => quitarEntrada(l, id));
