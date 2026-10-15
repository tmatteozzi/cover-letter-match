// EXTRAE EL TEXTO PLANO DE UN PDF (EL CV) CON pdfjs-dist.
import * as pdfjs from "pdfjs-dist";
// EL WORKER VA EMPAQUETADO EN LA EXTENSIÓN (MV3 PROHÍBE CÓDIGO REMOTO)
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// LEE TODAS LAS PÁGINAS Y UNE EL TEXTO RESPETANDO LOS SALTOS DE LÍNEA DEL PDF
export async function extractPdfText(file: File): Promise<string> {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  try {
    const paginas: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const { items } = await (await pdf.getPage(i)).getTextContent();
      paginas.push(items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join(""));
    }
    return paginas.join("\n").replace(/[ \t]+\n/g, "\n").trim();
  } finally {
    await pdf.destroy();
  }
}
