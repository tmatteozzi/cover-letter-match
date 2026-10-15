# Plan: Extensión de Chrome "Cover Letter Match"

> **Nombre:** Cover Letter Match. Cruza tu CV con la oferta y escribe la carta que matchea con el puesto.
>
> **Lo que la diferencia:** es gratis, no necesita clave de API, tus datos no salen de tu compu y escribe en español o inglés según la oferta.

Extensión de Chrome que, al abrirla sobre una oferta laboral, lee la oferta y escribe una carta de presentación (o un mensaje para el reclutador) usando los datos del CV guardado.

---

## 1. Objetivo

- El usuario carga su CV **una sola vez** y queda guardado (sensación de "sesión iniciada").
- Abre una oferta en cualquier sitio (LinkedIn, Computrabajo, Bumeran, Zonajobs u otro).
- Abre el panel lateral de la extensión.
- La extensión extrae los datos de la oferta y genera una carta personalizada.
- El usuario la edita, la regenera o la copia.

**Principios:**

- **Gratis:** IA local de Chrome (Gemini Nano). Sin backend.
- **Privado:** el CV y las ofertas no salen de la compu.
- **Honesto:** la carta solo usa información que está en el CV. Nunca inventa experiencia.

---

## 2. Stack

| Parte | Tecnología |
| --- | --- |
| Formato de extensión | Manifest V3 |
| Lenguaje | TypeScript |
| Interfaz | React + Vite (con CRXJS o WXT para empaquetar la extensión) |
| Ubicación de la UI | Panel lateral (`chrome.sidePanel`) |
| Lectura de PDF | pdf.js |
| Almacenamiento | `chrome.storage.local` |
| IA principal | Prompt API de Chrome (Gemini Nano, local) |
| Tests | Vitest |
| CI | GitHub Actions (lint + tests en cada push) |

**Requisitos para probar:** Chrome 138 o superior en una compu de escritorio (Windows, Mac o Linux). La primera vez, Chrome descarga el modelo, así que hace falta espacio libre en disco.

---

## 3. Arquitectura

```
┌──────────────────────────┐
│  Panel lateral (React)   │
│  - Pantalla de CV        │
│  - Pantalla de carta     │
└──────────┬───────────────┘
           │ chrome.scripting.executeScript
           ▼
┌──────────────────────────┐
│  Pestaña activa          │
│  - Extractor de oferta   │  → devuelve { puesto, empresa, descripcion, url }
└──────────────────────────┘

┌──────────────────────────┐      ┌──────────────────────────┐
│  chrome.storage.local    │      │  Prompt API (Gemini Nano)│
│  - perfil (CV resumido)  │      │  - resumir CV            │
│  - cvTexto               │      │  - generar carta         │
│  - preferencias          │      └──────────────────────────┘
│  - historial (v3)        │
└──────────────────────────┘
```

---

## 4. Estructura de carpetas

```
coverlettermatch/
├── src/
│   ├── manifest.ts
│   ├── background/
│   │   └── index.ts              # abre el panel al hacer clic en el ícono
│   ├── sidepanel/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── screens/
│   │       ├── CvScreen.tsx      # cargar / editar CV
│   │       └── LetterScreen.tsx  # generar / editar / copiar carta
│   ├── extractors/
│   │   ├── index.ts              # elige el extractor según la URL
│   │   ├── linkedin.ts
│   │   ├── computrabajo.ts
│   │   ├── bumeran.ts
│   │   └── generic.ts            # fallback: texto principal de la página
│   ├── ai/
│   │   ├── availability.ts       # chequea si Gemini Nano está disponible
│   │   ├── summarizeCv.ts
│   │   ├── generateLetter.ts
│   │   └── prompts.ts
│   ├── storage/
│   │   └── index.ts              # helpers tipados sobre chrome.storage
│   ├── pdf/
│   │   └── extractText.ts        # versión 2
│   └── types.ts
├── tests/
│   ├── extractors/               # HTML de ejemplo de cada sitio + tests
│   └── prompts.test.ts
├── .github/workflows/ci.yml
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 5. Modelos de datos

```ts
// types.ts

export interface Perfil {
  nombre: string;
  titulo: string;               // ej: "Desarrollador Full Stack"
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

export interface Oferta {
  puesto: string;
  empresa: string;
  descripcion: string;
  url: string;
  sitio: "linkedin" | "computrabajo" | "bumeran" | "zonajobs" | "otro";
  idiomaDetectado: "es" | "en" | "otro";
  pideIngles: boolean;          // la oferta menciona "inglés avanzado", "English", etc.
}

export type Tono = "formal" | "cercano";
export type Formato = "carta" | "mensaje-corto";
export type Idioma = "auto" | "es" | "en";

export interface Preferencias {
  tono: Tono;
  formato: Formato;
  idioma: Idioma;               // "auto" usa el idioma detectado de la oferta
}
```

---

## 6. Manifest

```ts
// manifest.ts (resumen)
{
  manifest_version: 3,
  name: "Cover Letter Match",
  version: "0.1.0",
  permissions: ["sidePanel", "storage", "activeTab", "scripting"],
  host_permissions: [
    "https://www.linkedin.com/*",
    "https://ar.computrabajo.com/*",
    "https://www.bumeran.com.ar/*",
    "https://www.zonajobs.com.ar/*"
  ],
  side_panel: { default_path: "src/sidepanel/index.html" },
  background: { service_worker: "src/background/index.ts", type: "module" },
  action: { default_title: "Cover Letter Match" }
}
```

**Por qué hay `host_permissions` además de `activeTab`:** `activeTab` da acceso a la pestaña solo cuando hacés clic en el ícono, y ese acceso se pierde al navegar a otra página. Como el panel lateral queda abierto mientras pasás de una oferta a otra, para los sitios principales conviene tener permiso fijo. Para cualquier otro sitio queda `activeTab` (el usuario vuelve a hacer clic en el ícono).

```ts
// background/index.ts
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
```

---

## 7. IA: prompts

### 7.1 Chequear disponibilidad

```ts
// ai/availability.ts
export async function nanoDisponible() {
  if (!("LanguageModel" in self)) return "no-soportado";
  return await LanguageModel.availability(); // "available" | "downloadable" | "downloading" | "unavailable"
}
```

La UI tiene que mostrar un mensaje claro para cada estado (por ejemplo: "Descargando el modelo de IA, puede tardar unos minutos").

### 7.2 Resumir el CV (se hace una sola vez)

Pedir la respuesta en JSON con el esquema de `Perfil` (usando `responseConstraint` de la Prompt API).

```
Sos un asistente que extrae información de currículums.
Leé el siguiente CV y devolvé SOLO un JSON con este formato: {esquema}.
Usá únicamente información que aparezca en el CV. Si un dato no está, dejalo vacío.

CV:
{cvTexto}
```

Mostrar el resultado en la pantalla de CV para que el usuario lo revise y corrija antes de guardarlo.

### 7.3 Detectar el idioma de la oferta

Usar la **Language Detector API** de Chrome (local, gratis, no usa Gemini Nano):

```ts
// ai/detectLanguage.ts
export async function detectarIdioma(texto: string): Promise<"es" | "en" | "otro"> {
  const detector = await LanguageDetector.create();
  const [mejor] = await detector.detect(texto.slice(0, 2000));
  if (mejor?.detectedLanguage === "es") return "es";
  if (mejor?.detectedLanguage === "en") return "en";
  return "otro";
}
```

Reglas para decidir el idioma final:

1. Si el usuario eligió "es" o "en", usar ese.
2. Si eligió "auto", usar el idioma detectado ("otro" → español).
3. Si la oferta está en español y `pideIngles` es true, mostrar la sugerencia: "Esta oferta pide inglés. ¿Querés la carta en inglés?"

Al crear la sesión de la Prompt API, indicar el idioma de salida esperado (`expectedOutputs` con `languages: ["es"]` o `["en"]`).

### 7.4 Generar la carta

El prompt se escribe en el mismo idioma que la carta, porque el modelo responde mejor así. Versión en español:

```
Escribí una {formato} de presentación en español rioplatense, con tono {tono},
para postularse al puesto "{oferta.puesto}" en "{oferta.empresa}".

Reglas:
- Usá SOLO información del perfil. No inventes experiencia, empresas ni tecnologías.
- Destacá las 2 o 3 coincidencias más fuertes entre el perfil y la oferta.
- Si la oferta pide algo que el perfil no tiene, no lo menciones.
- Largo: {"entre 150 y 250 palabras" | "máximo 3 oraciones"}.
- No uses frases genéricas como "soy una persona proactiva".

Perfil:
{perfil en JSON}

Oferta:
{oferta.descripcion}
```

Versión en inglés:

```
Write a {format} for the position "{oferta.puesto}" at "{oferta.empresa}", in a {tone} tone.

Rules:
- Use ONLY information from the profile. Do not invent experience, companies or technologies.
- Highlight the 2 or 3 strongest matches between the profile and the job posting.
- If the posting asks for something the profile doesn't have, don't mention it.
- Length: {"150 to 250 words" | "3 sentences max"}.
- Avoid generic phrases like "I am a highly motivated individual".

Profile:
{perfil en JSON}

Job posting:
{oferta.descripcion}
```

El perfil se guarda en español, pero el modelo lo usa igual para escribir en inglés. Generar con streaming (`promptStreaming`) para que el texto aparezca de a poco.

---

## 8. Fases

### Versión 1: MVP (funciona de punta a punta)

- [x] Crear el proyecto con Vite + React + TypeScript y el plugin de extensiones.
- [x] Configurar el manifest y cargar la extensión en `chrome://extensions` (modo desarrollador).
- [ ] Panel lateral que se abre al hacer clic en el ícono. (código y service worker verificados; falta el clic manual)
- [x] Chequeo de disponibilidad de Gemini Nano con mensajes para cada estado.
- [x] Pantalla de CV: pegar el CV como texto y guardarlo en `chrome.storage.local`.
- [x] Resumir el CV con IA, mostrar el perfil y permitir editarlo antes de guardar.
- [x] Extractor genérico: leer el texto principal de la pestaña activa.
- [x] Generar la carta con streaming.
- [x] Área de texto editable + botón "Copiar".
- [x] Probar la calidad de las cartas en español con 5 ofertas reales.

**Listo cuando:** abrís una oferta, abrís el panel y en menos de un minuto tenés una carta copiable basada en tu CV.

### Versión 2: mejor experiencia

- [x] Subir el CV en PDF (pdf.js, con el worker empaquetado dentro de la extensión).
- [x] Extractores específicos para LinkedIn, Computrabajo y Bumeran (puesto, empresa y descripción por separado). (Computrabajo verificado con HTML real; LinkedIn y Bumeran con selectores supuestos + fallback por título y extractor genérico)
- [x] Detectar si la página no es una oferta y avisar.
- [x] Elegir tono (formal / cercano) y formato (carta / mensaje corto), guardados como preferencia.
- [x] Selector de idioma: Automático / Español / English, guardado como preferencia.
- [x] Detectar el idioma de la oferta con la Language Detector API y mostrarlo en el panel ("Oferta en inglés").
- [x] Detectar si la oferta pide inglés y sugerir la carta en inglés.
- [x] Probar la calidad de las cartas en inglés con 5 ofertas reales.
- [x] Botón "Generar otra".
- [x] Tests de los extractores con HTML de ejemplo guardado en `tests/`.
- [x] GitHub Actions: lint + tests en cada push.

### Versión 3: extras para el portfolio

- [x] Historial de cartas generadas por empresa. (pantalla "Historial": agrupado por empresa, buscador, copiar/eliminar; máx. 100; guarda la versión editada al copiar)
- [ ] ~~Botón para guardar la oferta en el Google Sheet de "BÚSQUEDA LABORAL" (API de Sheets + `chrome.identity`).~~ (descartado por decisión del usuario)
- [ ] ~~Respaldo con la API de Gemini (plan gratis) si Gemini Nano no está disponible, con aviso al usuario de que en ese caso el texto sale de la compu.~~ (descartado por decisión del usuario)
- [x] Indicador de coincidencia: qué tecnologías de la oferta están en el CV y cuáles faltan. (determinista, `src/match.ts`, sin IA)

---

## 9. Riesgos y cómo manejarlos

| Riesgo | Cómo manejarlo |
| --- | --- |
| La compu no soporta Gemini Nano | Mensaje claro con los requisitos (no hay respaldo en la nube) |
| Calidad pobre en español | Probar temprano (fin de v1); ajustar prompts |
| Gemini Nano acepta textos cortos | Usar el perfil resumido, no el CV completo; recortar la descripción de la oferta |
| Los sitios cambian su HTML | Extractor genérico como fallback siempre; tests con HTML guardado |
| La IA inventa experiencia | Regla explícita en el prompt + el usuario siempre revisa antes de copiar |
| Se pierde el acceso a la pestaña al navegar | `host_permissions` para los sitios principales |

---

## 10. Privacidad

- El CV, el perfil y las cartas se guardan solo en `chrome.storage.local`.
- Con Gemini Nano, nada sale de la compu (no hay respaldo en la nube ni integraciones externas).
- El historial también queda solo en `chrome.storage.local`; "Borrar mis datos" lo elimina.
- Opción "Borrar mis datos" en la pantalla de CV.

---

## 11. README para el portfolio

- GIF o video corto de la extensión funcionando.
- Diagrama de arquitectura (sección 3).
- Decisiones técnicas: por qué IA local, por qué panel lateral, por qué estos permisos.
- Cómo instalarla en modo desarrollador.
- Escrito en inglés.
