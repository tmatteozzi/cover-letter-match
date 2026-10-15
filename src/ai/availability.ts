// CONSULTA LA DISPONIBILIDAD DE GEMINI NANO Y DESCARGA EL MODELO CON PROGRESO.
export type EstadoIA = "no-soportado" | LanguageModelAvailability;

// DEVUELVE EL ESTADO DEL MODELO LOCAL; "no-soportado" SI EL NAVEGADOR NO EXPONE LanguageModel
export async function nanoDisponible(): Promise<EstadoIA> {
  if (!("LanguageModel" in self)) return "no-soportado";
  try {
    return await LanguageModel.availability({ expectedOutputs: [{ type: "text", languages: ["es"] }] });
  } catch {
    return "unavailable";
  }
}

// FUERZA LA DESCARGA DEL MODELO CREANDO Y DESTRUYENDO UNA SESIÓN; onProgress RECIBE 0..1
export async function descargarModelo(onProgress: (fraction: number) => void): Promise<void> {
  const session = await LanguageModel.create({
    expectedOutputs: [{ type: "text", languages: ["es"] }],
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => onProgress(e.loaded));
    },
  });
  session.destroy();
}
