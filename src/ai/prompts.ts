// CONSTRUYE LOS PROMPTS PARA GEMINI NANO: EXTRACCIÓN DEL CV Y REDACCIÓN DE LA CARTA.
import type { Oferta, Perfil, Preferencias } from "../types";

// LOS PROMPTS APUNTAN A GEMINI NANO (MODELO LOCAL PEQUEÑO): ESTRUCTURA PLANA, REGLAS CRÍTICAS AL
// PRINCIPIO Y REPETIDAS AL FINAL, ESQUEMA DE SALIDA EXPLÍCITO, DATOS EN BLOQUES DELIMITADOS Y JSON COMPACTO

// PROMPT QUE PIDE CONVERTIR EL TEXTO DEL CV EN JSON SEGÚN schema
export function buildCvPrompt(cvTexto: string, schema: object): string {
  const anio = new Date().getFullYear();
  return `Sos un extractor de datos de currículums. Tu única tarea es convertir el CV de abajo en un JSON.

REGLAS (obligatorias):
1. Usá SOLO información que aparece en el CV. NUNCA inventes ni completes datos. Si un dato no está, dejalo vacío ("" o []).
2. NUNCA repitas una experiencia o un proyecto. NUNCA agregues entradas vacías.
3. Copiá nombres de empresas, puestos, tecnologías y períodos tal como aparecen.

CAMPOS:
- nombre: nombre completo de la persona.
- titulo: título profesional principal (ej: "Desarrollador Fullstack").
- aniosExperiencia: años desde el inicio del primer trabajo hasta ${anio} ("Actualidad" = ${anio}).
- tecnologias: lenguajes, frameworks, bases de datos y herramientas mencionados en el CV.
- experiencias: un elemento por trabajo, con como máximo 3 logros. Cada logro es una frase corta (máximo 15 palabras) que conserva cifras y nombres concretos.
- proyectos: como máximo 4, cada uno con una descripción de una frase.
- estudios: título e institución.
- idiomas: idioma con su nivel tal como aparece (ej: "Inglés B2").

FORMATO DE SALIDA: SOLO el JSON, sin texto antes ni después, con este esquema:
${JSON.stringify(schema)}

<cv>
${cvTexto}
</cv>`;
}

// "TOMÁS AGUSTÍN MATTEOZZI" -> "Tomás Agustín Matteozzi"; LOS NOMBRES EN MAYÚSCULAS Y MINÚSCULAS SE DEJAN IGUAL
function nombreFirma(nombre: string): string {
  return nombre === nombre.toUpperCase()
    ? nombre.toLowerCase().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase())
    : nombre;
}

// PROMPT DE LA CARTA, EN ES O EN SEGÚN idioma; LIMITA LAS TECNOLOGÍAS A LAS DEL PERFIL PARA EVITAR INVENTOS
export function buildLetterPrompt(
  perfil: Perfil,
  oferta: Oferta,
  prefs: Pick<Preferencias, "tono" | "formato">,
  idioma: "es" | "en",
): string {
  const corta = prefs.formato === "mensaje-corto";
  const formal = prefs.tono === "formal";
  const firma = nombreFirma(perfil.nombre);
  // LISTA PERMITIDA: TECNOLOGÍAS DEL PERFIL + LAS DE SUS PROYECTOS, SIN REPETIDAS
  const tecs = [...new Set([...perfil.tecnologias, ...perfil.proyectos.flatMap((p) => p.tecnologias)])].join(", ");
  const perfilJson = JSON.stringify(perfil);

  // RAMA EN INGLÉS; DEBAJO, LA RAMA EN ESPAÑOL
  if (idioma === "en") {
    const saludo = `${formal ? "Dear" : "Hi"} ${oferta.empresa || "Hiring"} team,`;
    return `You are a career writer who writes honest, specific cover letters for software developers.

TASK: Write a ${corta ? "short message" : "cover letter"} in English, in a ${formal ? "formal" : "friendly"} tone, applying for the position "${oferta.puesto}" at "${oferta.empresa || "the company"}".

HONESTY RULES (most important):
- Use ONLY information from the profile. NEVER invent experience, companies, numbers or achievements.
- The only technologies, tools and methodologies you may mention are: ${tecs}.
- NEVER name a technology or methodology the posting asks for that is not in that list, not even to say you know it or are learning it. If the posting asks for something the profile doesn't have, leave it out.
- NEVER claim language levels, availability or leadership roles that are not literally in the profile. Profile languages: ${perfil.idiomas.join(", ") || "none"}.

CONTENT:
- Highlight the 2 or 3 strongest matches between the profile and the posting, each backed by a concrete fact from the profile (project, achievement, number).
- The profile is in Spanish: translate job titles and descriptions into natural English ("Freelance" means self-employed, "red social" means social network).
- NEVER use generic phrases like "I am a highly motivated individual".

OUTPUT FORMAT (plain text, no markdown, no subject line, no address, no date, no placeholders in brackets):
${corta
  ? `${saludo}
[2 or 3 sentences: interest in the role + the strongest match]
${firma}`
  : `${saludo}

[Paragraph 1: interest in the role, 1-2 sentences]

[Paragraph 2: the 2-3 strongest matches with concrete facts]

[Paragraph 3: short closing, 1-2 sentences]

${firma}`}
Length: ${corta ? "3 sentences max" : "150 to 250 words"}. Start with exactly "${saludo}" and sign with "${firma}".

<profile>
${perfilJson}
</profile>

<job_posting>
${oferta.descripcion}
</job_posting>

Remember: only facts from the profile, only these technologies: ${tecs}.`;
  }

  const saludo = `${formal ? "Estimado equipo de" : "Hola, equipo de"} ${oferta.empresa || "selección"}:`;
  return `Sos un redactor de carreras que escribe cartas de presentación honestas y concretas para desarrolladores de software.

TAREA: Escribí ${corta ? "un mensaje corto" : "una carta"} de presentación en español rioplatense, con tono ${formal ? "formal" : "cercano"}, para postularse al puesto "${oferta.puesto}" en "${oferta.empresa || "la empresa"}".

REGLAS DE HONESTIDAD (las más importantes):
- Usá SOLO información del perfil. NUNCA inventes experiencia, empresas, cifras ni logros.
- Las únicas tecnologías, herramientas y metodologías que podés mencionar son: ${tecs}.
- NUNCA nombres una tecnología o metodología que pide la oferta y no está en esa lista, ni siquiera para decir que la conocés o la estás aprendiendo. Si la oferta pide algo que el perfil no tiene, no lo menciones.
- NUNCA afirmes niveles de idioma, disponibilidad ni cargos de liderazgo que no estén textualmente en el perfil. Idiomas del perfil: ${perfil.idiomas.join(", ") || "ninguno"}.

CONTENIDO:
- Destacá las 2 o 3 coincidencias más fuertes entre el perfil y la oferta, cada una con un dato concreto del perfil (proyecto, logro, cifra).
- NUNCA uses frases genéricas como "soy una persona proactiva".

FORMATO DE SALIDA (texto plano, sin markdown, sin asunto, sin dirección, sin fecha, sin campos entre corchetes para completar):
${corta
  ? `${saludo}
[2 o 3 oraciones: interés en el puesto + la coincidencia más fuerte]
${firma}`
  : `${saludo}

[Párrafo 1: interés en el puesto, 1-2 oraciones]

[Párrafo 2: las 2-3 coincidencias más fuertes con datos concretos]

[Párrafo 3: cierre breve, 1-2 oraciones]

${firma}`}
Largo: ${corta ? "máximo 3 oraciones" : "entre 150 y 250 palabras"}. Empezá exactamente con "${saludo}" y firmá con "${firma}".

<perfil>
${perfilJson}
</perfil>

<oferta>
${oferta.descripcion}
</oferta>

Recordá: solo datos del perfil, solo estas tecnologías: ${tecs}.`;
}
