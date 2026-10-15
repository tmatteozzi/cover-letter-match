// FUNCIONES PURAS PARA MANEJAR LA LISTA DEL HISTORIAL DE CARTAS (AGREGAR, FILTRAR, AGRUPAR).
import type { EntradaHistorial } from "../types";

export const MAX_HISTORIAL = 100;

// AGREGA AL PRINCIPIO (MÁS NUEVA PRIMERO), REEMPLAZA UNA CON IGUAL id Y LIMITA A max
export function agregarEntrada(lista: EntradaHistorial[], e: EntradaHistorial, max = MAX_HISTORIAL): EntradaHistorial[] {
  return [e, ...lista.filter((x) => x.id !== e.id)].slice(0, max);
}

// REEMPLAZA EL TEXTO DE LA CARTA DE LA ENTRADA CON ESE id
export function actualizarCarta(lista: EntradaHistorial[], id: string, carta: string): EntradaHistorial[] {
  return lista.map((x) => (x.id === id ? { ...x, carta } : x));
}

export function quitarEntrada(lista: EntradaHistorial[], id: string): EntradaHistorial[] {
  return lista.filter((x) => x.id !== id);
}

// NORMALIZA PARA COMPARAR: SIN TILDES, MINÚSCULAS Y SIN ESPACIOS EXTREMOS
const plano = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

// FILTRA POR EMPRESA O PUESTO, SIN DISTINGUIR MAYÚSCULAS NI TILDES
export function filtrarHistorial(lista: EntradaHistorial[], q: string): EntradaHistorial[] {
  const t = plano(q);
  if (!t) return lista;
  return lista.filter((x) => plano(`${x.empresa} ${x.puesto}`).includes(t));
}

export const SIN_EMPRESA = "Sin empresa";

// LOS GRUPOS CONSERVAN EL ORDEN DE SU ENTRADA MÁS NUEVA
// EMPRESAS AGRUPADAS SIN DISTINGUIR MAYÚSCULAS NI TILDES
export function agruparPorEmpresa(lista: EntradaHistorial[]): { empresa: string; entradas: EntradaHistorial[] }[] {
  const grupos = new Map<string, { empresa: string; entradas: EntradaHistorial[] }>();
  for (const e of lista) {
    const nombre = e.empresa.trim() || SIN_EMPRESA;
    const k = plano(nombre);
    const g = grupos.get(k) ?? { empresa: nombre, entradas: [] };
    g.entradas.push(e);
    grupos.set(k, g);
  }
  return [...grupos.values()];
}

// ID ÚNICO; randomUUID SI EXISTE (CONTEXTOS SIN ÉL USAN FECHA + AZAR)
export function nuevoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
