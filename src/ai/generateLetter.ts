// GENERA LA CARTA DE PRESENTACIÓN EN STREAMING CON GEMINI NANO Y LIMPIA ARTEFACTOS DEL MODELO.
import type { Oferta, Perfil, Preferencias } from "../types";
import { buildLetterPrompt } from "./prompts";

// EL MODELO COPIA CORCHETES DE LINKS MARKDOWN DEL CV: "[clickturno.com]" -> "clickturno.com"
// LOS PLACEHOLDERS REALES SE CONSERVAN
export const limpiarCarta = (t: string) => t.replace(/\[([\w.-]+\.[a-z]{2,})\]/gi, "$1").replace(/\n{3,}/g, "\n\n")
  // "Yuhmak S.A.." -> "Yuhmak S.A." (CONSERVA "...")
  .replace(/(?<!\.)\.\.(?!\.)/g, ".");

// STREAMEA LA CARTA; onText RECIBE EL TEXTO ACUMULADO Y LIMPIO; signal PERMITE CANCELAR
export async function generateLetter(
  perfil: Perfil,
  oferta: Oferta,
  prefs: Pick<Preferencias, "tono" | "formato">,
  idioma: "es" | "en",
  onText: (textSoFar: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const session = await LanguageModel.create({ expectedOutputs: [{ type: "text", languages: [idioma] }], signal });
  try {
    const reader = session
      .promptStreaming(buildLetterPrompt(perfil, oferta, prefs, idioma), { signal })
      .getReader();
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += value;
      onText(limpiarCarta(text));
    }
    return limpiarCarta(text).trimEnd();
  } finally {
    // SIEMPRE LIBERA LA SESIÓN, TAMBIÉN AL CANCELAR O FALLAR
    session.destroy();
  }
}
