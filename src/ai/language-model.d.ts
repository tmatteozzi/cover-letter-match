// TIPOS MÍNIMOS DE LA API PROMPT DE CHROME (138+) Y DE LA API LanguageDetector.
type LanguageModelAvailability = "unavailable" | "downloadable" | "downloading" | "available";

// MODALIDAD Y IDIOMAS ESPERADOS DE ENTRADA O SALIDA DEL MODELO
interface LanguageModelExpected {
  type: "text" | "image" | "audio";
  languages?: string[];
}

interface LanguageModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// MONITOR DE LA DESCARGA DEL MODELO; EMITE "downloadprogress" CON LO CARGADO
interface LanguageModelCreateMonitor extends EventTarget {
  addEventListener(
    type: "downloadprogress",
    listener: (e: Event & { loaded: number; total: number }) => void,
  ): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

// OPCIONES AL CREAR UNA SESIÓN (signal CANCELA; monitor SIGUE LA DESCARGA)
interface LanguageModelCreateOptions {
  initialPrompts?: LanguageModelMessage[];
  expectedInputs?: LanguageModelExpected[];
  expectedOutputs?: LanguageModelExpected[];
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
  monitor?: (m: LanguageModelCreateMonitor) => void;
}

// responseConstraint FUERZA LA SALIDA A UN JSON SCHEMA
interface LanguageModelPromptOptions {
  responseConstraint?: object;
  omitResponseConstraintInput?: boolean;
  signal?: AbortSignal;
}

// SESIÓN DEL MODELO: prompt DEVUELVE TODO; promptStreaming EMITE DELTAS; destroy LIBERA RECURSOS
interface LanguageModelSession {
  prompt(input: string, options?: LanguageModelPromptOptions): Promise<string>;
  promptStreaming(input: string, options?: LanguageModelPromptOptions): ReadableStream<string>;
  destroy(): void;
}

// OBJETO GLOBAL LanguageModel: CONSULTA DISPONIBILIDAD Y CREA SESIONES
declare const LanguageModel: {
  availability(options?: Omit<LanguageModelCreateOptions, "monitor" | "signal" | "initialPrompts">): Promise<LanguageModelAvailability>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
};

// TIPOS MÍNIMOS DE LA API LanguageDetector DE CHROME (138+)
interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
}

interface LanguageDetectorSession {
  detect(input: string): Promise<LanguageDetectionResult[]>;
  destroy(): void;
}

// OBJETO GLOBAL LanguageDetector
declare const LanguageDetector: {
  availability(): Promise<LanguageModelAvailability>;
  create(): Promise<LanguageDetectorSession>;
};
