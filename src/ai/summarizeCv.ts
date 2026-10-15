// RESUME EL CV EN UN Perfil CON GEMINI NANO (SALIDA JSON RESTRINGIDA) Y CORRIGE SUS ERRORES COMUNES.
import type { Perfil } from "../types";
import { buildCvPrompt } from "./prompts";
import { normalizarTecnologia, tecnologiasEnTexto } from "../match";

// JSON SCHEMA DEL Perfil, USADO COMO responseConstraint Y DENTRO DEL PROMPT
const str = { type: "string" };
const strs = { type: "array", items: str };

export const perfilSchema = {
  type: "object",
  properties: {
    nombre: str,
    titulo: str,
    aniosExperiencia: { type: "number" },
    tecnologias: strs,
    experiencias: {
      type: "array",
      items: {
        type: "object",
        properties: { empresa: str, puesto: str, periodo: str, logros: strs },
        required: ["empresa", "puesto", "periodo", "logros"],
      },
    },
    proyectos: {
      type: "array",
      items: {
        type: "object",
        properties: { nombre: str, descripcion: str, tecnologias: strs },
        required: ["nombre", "descripcion", "tecnologias"],
      },
    },
    estudios: strs,
    idiomas: strs,
  },
  required: ["nombre", "titulo", "aniosExperiencia", "tecnologias", "experiencias", "proyectos", "estudios", "idiomas"],
};

// COERCIONES DEFENSIVAS: LA SALIDA DEL MODELO NO ES CONFIABLE
const s = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strArr = (v: unknown): string[] => arr(v).filter((x): x is string => typeof x === "string");
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

// CONVIERTE EL JSON CRUDO DEL MODELO EN UN Perfil VÁLIDO, DESCARTANDO VACÍOS Y DUPLICADOS
export function normalizePerfil(raw: unknown): Perfil {
  const r = obj(raw);
  return {
    nombre: s(r.nombre),
    titulo: s(r.titulo),
    aniosExperiencia: typeof r.aniosExperiencia === "number" && isFinite(r.aniosExperiencia) ? r.aniosExperiencia : 0,
    tecnologias: strArr(r.tecnologias),
    experiencias: arr(r.experiencias).map((e) => {
      const o = obj(e);
      return { empresa: s(o.empresa), puesto: s(o.puesto), periodo: s(o.periodo), logros: strArr(o.logros) };
    }).filter((e, i, all) => (e.empresa || e.puesto) &&
      // NANO A VECES ENTRA EN BUCLE Y REPITE ENTRADAS COMPLETAS
      all.findIndex((o) => o.empresa === e.empresa && (e.periodo ? o.periodo === e.periodo : o.puesto === e.puesto)) === i),
    proyectos: arr(r.proyectos).map((p) => {
      const o = obj(p);
      return { nombre: s(o.nombre), descripcion: s(o.descripcion), tecnologias: strArr(o.tecnologias) };
    }).filter((p, i, all) => p.nombre && all.findIndex((o) => o.nombre === p.nombre) === i),
    estudios: strArr(r.estudios),
    idiomas: strArr(r.idiomas),
  };
}

// NANO CALCULA MAL LAS FECHAS: LOS AÑOS SE SACAN DE LOS PERÍODOS ("2020 – 2022", "2022 – actualidad")
export function aniosDesdePeriodos(periodos: string[], hoy = new Date().getFullYear()): number | null {
  const anios = periodos.flatMap((p) => [
    ...(p.match(/\b(19|20)\d{2}\b/g) ?? []).map(Number),
    ...(/actual|presente|hoy|present|current/i.test(p) ? [hoy] : []),
  ]);
  return anios.length ? Math.max(...anios) - Math.min(...anios) : null;
}

// REEMPLAZA aniosExperiencia POR EL CÁLCULO DE LOS PERÍODOS, SI SE PUEDE
const conAnios =(perfil: Perfil): Perfil => ({
  ...perfil,
  aniosExperiencia: aniosDesdePeriodos(perfil.experiencias.map((e) => e.periodo)) ?? perfil.aniosExperiencia,
});

// NANO A VECES OMITE TECNOLOGÍAS DEL CV (EJ. Git, GitHub): SE AGREGAN LAS CONOCIDAS HALLADAS EN EL TEXTO
// LISTA DEL MODELO PRIMERO, LUEGO LAS FALTANTES; DUPLICADOS COMPARADOS POR NOMBRE CANÓNICO
export function unirTecnologias(delModelo: string[], cvTexto: string): string[] {
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const t of [...delModelo, ...tecnologiasEnTexto(cvTexto)]) {
    const k = normalizarTecnologia(t).toLowerCase();
    if (!t.trim() || vistas.has(k)) continue;
    vistas.add(k);
    out.push(t);
  }
  return out;
}

// POSPROCESO: TECNOLOGÍAS FALTANTES + AÑOS DE EXPERIENCIA CALCULADOS
const completar =(perfil: Perfil, cvTexto: string): Perfil =>
  conAnios({ ...perfil, tecnologias: unirTecnologias(perfil.tecnologias, cvTexto) });

// STREAMEA EL JSON DEL PERFIL; onProgress RECIBE LA CANTIDAD DE CARACTERES RECIBIDOS
export async function summarizeCv(cvTexto: string, onProgress?: (chars: number) => void): Promise<Perfil> {
  // LOS LINKS MARKDOWN "[texto](url)" SE REDUCEN A "texto" PARA NO CONFUNDIR AL MODELO
  const prompt = buildCvPrompt(cvTexto.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1"), perfilSchema);
  const session = await LanguageModel.create({ expectedOutputs: [{ type: "text", languages: ["es"] }] });
  try {
    const reader = session
      .promptStreaming(prompt, {
        responseConstraint: perfilSchema,
        omitResponseConstraintInput: true,
      })
      .getReader();
    let out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      // LOS CHUNKS SON DELTAS
      out += value;
      onProgress?.(out.length);
    }
    return completar(normalizePerfil(JSON.parse(out)), cvTexto);
  } finally {
    session.destroy();
  }
}
