// TIPOS COMPARTIDOS: PERFIL DEL CV, OFERTA DE TRABAJO, PREFERENCIAS E HISTORIAL.

// DATOS ESTRUCTURADOS EXTRAÍDOS DEL CV
export interface Perfil {
  nombre: string;
  titulo: string;
  aniosExperiencia: number;
  tecnologias: string[];
  experiencias: {
    empresa: string;
    puesto: string;
    periodo: string;
    logros: string[];
  }[];
  proyectos: {
    nombre: string;
    descripcion: string;
    tecnologias: string[];
  }[];
  estudios: string[];
  idiomas: string[];
}

// OFERTA LEÍDA DE LA PÁGINA ACTIVA
export interface Oferta {
  puesto: string;
  empresa: string;
  descripcion: string;
  url: string;
  sitio: "linkedin" | "computrabajo" | "bumeran" | "zonajobs" | "indeed" | "seeds" | "universia" | "otro";
  // URL DEL LOGO DE LA EMPRESA, SI HAY (LA UI USA LA INICIAL SI FALTA)
  logo?: string;
  // UN SCRAPER DEL SITIO ENCONTRÓ EL EMPLEO SELECCIONADO (TÍTULO + DESCRIPCIÓN), NO SOLO LA PÁGINA
  enfocada?: boolean;
  idiomaDetectado: "es" | "en" | "otro";
  pideIngles: boolean;
}

export type Tono = "formal" | "cercano";
export type Formato = "carta" | "mensaje-corto";
// "auto" = SEGÚN EL IDIOMA DETECTADO DE LA OFERTA
export type Idioma = "auto" | "es" | "en";

export interface Preferencias {
  tono: Tono;
  formato: Formato;
  idioma: Idioma;
}

// CARTA GENERADA GUARDADA EN EL HISTORIAL
export interface EntradaHistorial {
  id: string;
  fecha: string; // ISO
  empresa: string;
  puesto: string;
  url: string;
  sitio: Oferta["sitio"];
  idioma: "es" | "en";
  tono: Tono;
  formato: Formato;
  carta: string;
}
