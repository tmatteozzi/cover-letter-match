// DETECTA EL IDIOMA DE LA OFERTA (API LanguageDetector O HEURÍSTICA) Y RESUELVE EL IDIOMA FINAL.
import type { Idioma, Oferta } from "../types";

type Detectado = Oferta["idiomaDetectado"];

// PALABRAS FRECUENTES POR IDIOMA PARA LA HEURÍSTICA
const ES = /\b(el|la|los|las|de|del|que|y|en|con|para|por|una|un|es|se|experiencia|requisitos|buscamos)\b/gi;
const EN = /\b(the|and|of|to|in|with|for|is|are|we|you|our|experience|requirements|looking)\b/gi;

// RESPALDO SI NO HAY LanguageDetector: CUENTA STOPWORDS COMUNES DE CADA IDIOMA
export function idiomaPorStopwords(texto: string): Detectado {
  const es = texto.match(ES)?.length ?? 0;
  const en = texto.match(EN)?.length ?? 0;
  if (es + en < 3) return "otro";
  return es >= en ? "es" : "en";
}

// DETECTA EL IDIOMA CON LanguageDetector SOBRE UNA MUESTRA; SI FALLA, USA LA HEURÍSTICA
export async function detectarIdioma(texto: string): Promise<Detectado> {
  const muestra = texto.slice(0, 2000);
  try {
    if ("LanguageDetector" in self && (await LanguageDetector.availability()) === "available") {
      const detector = await LanguageDetector.create();
      try {
        const [mejor] = await detector.detect(muestra);
        if (mejor?.detectedLanguage === "es") return "es";
        if (mejor?.detectedLanguage === "en") return "en";
        if (mejor && mejor.confidence > 0.5) return "otro";
      } finally {
        detector.destroy();
      }
    }
  } catch {
    // SIN DETECTOR O ERROR: SE CAE A LA HEURÍSTICA
  }
  return idiomaPorStopwords(muestra);
}

// LA ELECCIÓN EXPLÍCITA GANA; CON "auto" SE USA EL IDIOMA DETECTADO ("otro" -> es)
export function idiomaFinal(elegido: Idioma, detectado: Detectado): "es" | "en" {
  if (elegido !== "auto") return elegido;
  return detectado === "en" ? "en" : "es";
}
