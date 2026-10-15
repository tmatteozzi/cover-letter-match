// CATÁLOGO DE TECNOLOGÍAS CONOCIDAS Y CÁLCULO DE COINCIDENCIAS ENTRE UNA OFERTA Y EL PERFIL.
import type { Perfil } from "./types";

// coincidencias = TECNOLOGÍAS DE LA OFERTA QUE EL PERFIL TIENE; faltan = LAS QUE NO
export interface MatchResult {
  coincidencias: string[];
  faltan: string[];
}

// ENTRADA DEL CATÁLOGO: NOMBRE CANÓNICO + ALIAS
interface Entrada {
  nombre: string;
  alias?: string[];
  // TÉRMINOS QUE SOLO COINCIDEN RESPETANDO MAYÚSCULAS/MINÚSCULAS (PALABRAS COMUNES AMBIGUAS)
  caseSensitive?: string[];
}

// ATAJO PARA DECLARAR ENTRADAS DEL CATÁLOGO
const e = (nombre: string, alias: string[] = [], caseSensitive: string[] = []): Entrada => ({
  nombre,
  alias,
  caseSensitive,
});

// LISTA DE TECNOLOGÍAS RECONOCIBLES, AGRUPADA POR CATEGORÍA
const CATALOGO: Entrada[] = [
  // LENGUAJES
  e("JavaScript", ["JS", "Javascript", "ECMAScript"]),
  e("TypeScript", ["TS"]),
  e("Python"),
  e("Java"),
  e("C#", ["CSharp", "C Sharp"]),
  e("C++", ["Cpp"]),
  e("C", [], ["C"]),
  e("Objective-C"),
  e("Go", ["Golang"], ["Go"]),
  e("Rust", [], ["Rust"]),
  e("PHP"),
  e("Ruby"),
  e("Kotlin"),
  e("Swift", [], ["Swift"]),
  e("Dart"),
  e("Scala"),
  e("R", [], ["R"]),
  e("Perl"),
  e("Elixir"),
  e("Bash", ["Shell scripting"]),
  e("PowerShell"),
  // FRONTEND
  e("HTML", ["HTML5"]),
  e("CSS", ["CSS3"]),
  e("Sass", ["SCSS"]),
  e("React", ["React.js", "ReactJS", "React JS"]),
  e("Next.js", ["NextJS", "Next JS"]),
  e("Vue.js", ["Vue", "VueJS", "Vue JS"]),
  e("Nuxt", ["Nuxt.js", "NuxtJS"]),
  e("Angular", ["AngularJS", "Angular.js"]),
  e("Svelte", ["SvelteKit"]),
  e("Redux"),
  e("jQuery"),
  e("Tailwind CSS", ["Tailwind", "TailwindCSS"]),
  e("Bootstrap"),
  e("Webpack"),
  e("Vite"),
  e("Storybook"),
  // BACKEND
  e("Node.js", ["Node", "NodeJS", "Node JS"]),
  e("Express", ["Express.js", "ExpressJS"], ["Express"]),
  e("NestJS", ["Nest.js", "Nest JS"]),
  e("Deno"),
  e(".NET", [".NET Core", "dotnet", "ASP.NET", "ASP.NET Core"]),
  e("Spring Boot", ["SpringBoot"]),
  e("Spring", [], ["Spring"]),
  e("Hibernate"),
  e("Django"),
  e("Flask"),
  e("FastAPI"),
  e("Laravel"),
  e("Ruby on Rails", ["Rails"], ["Rails"]),
  e("REST", ["REST API", "REST APIs", "RESTful", "API REST", "APIs REST"], ["REST"]),
  e("GraphQL"),
  e("gRPC"),
  e("WebSocket", ["WebSockets"]),
  e("Microservicios", ["Microservices", "Microservicio"]),
  e("OAuth", ["OAuth2", "OAuth 2.0"]),
  e("JWT"),
  // BASES DE DATOS
  e("SQL"),
  e("PostgreSQL", ["Postgres", "PostgresSQL", "Postgre"]),
  e("MySQL"),
  e("MariaDB"),
  e("SQL Server", ["MSSQL", "Microsoft SQL Server"]),
  e("SQLite"),
  e("Oracle"),
  e("MongoDB", ["Mongo"]),
  e("Redis"),
  e("DynamoDB"),
  e("Cassandra"),
  e("Elasticsearch", ["Elastic Search"]),
  e("Firebase"),
  e("Supabase"),
  e("Prisma"),
  e("Neo4j"),
  // CLOUD Y DEVOPS
  e("AWS", ["Amazon Web Services"]),
  e("Azure", ["Microsoft Azure"]),
  e("GCP", ["Google Cloud", "Google Cloud Platform"]),
  e("Docker"),
  e("Kubernetes", ["K8s"]),
  e("Terraform"),
  e("Ansible"),
  e("Jenkins"),
  e("CI/CD", ["CICD", "CI-CD"]),
  e("DevOps"),
  e("Nginx"),
  e("Linux"),
  e("Kafka", ["Apache Kafka"]),
  e("RabbitMQ"),
  e("Grafana"),
  e("Prometheus"),
  e("Heroku"),
  e("Vercel"),
  e("Netlify"),
  // TESTING
  e("Jest"),
  e("Vitest"),
  e("Cypress"),
  e("Playwright"),
  e("Selenium"),
  e("Mocha"),
  e("Pytest"),
  e("JUnit"),
  e("Postman"),
  e("Swagger", ["OpenAPI"]),
  e("TDD", ["Test Driven Development"]),
  // MOBILE
  e("React Native"),
  e("Flutter"),
  e("Android"),
  e("iOS"),
  e("SwiftUI"),
  e("Jetpack Compose"),
  e("Xamarin"),
  e("Ionic"),
  e("Electron"),
  // DATOS / ML
  e("Pandas"),
  e("NumPy"),
  e("TensorFlow"),
  e("PyTorch"),
  e("scikit-learn", ["sklearn", "scikit learn"]),
  e("Apache Spark", ["PySpark"], ["Spark"]),
  e("Hadoop"),
  e("Airflow", ["Apache Airflow"]),
  e("Snowflake"),
  e("BigQuery"),
  e("Power BI", ["PowerBI"]),
  e("Tableau"),
  e("Machine Learning", ["ML", "Aprendizaje automatico"]),
  // DISEÑO
  e("Figma"),
  e("Adobe XD"),
  e("Photoshop"),
  e("Sketch", [], ["Sketch"]),
  // HERRAMIENTAS Y METODOLOGÍAS
  e("Git"),
  e("GitHub"),
  e("GitLab"),
  e("Bitbucket"),
  e("Jira"),
  e("Trello"),
  e("Confluence"),
  e("Scrum"),
  e("Agile", ["Ágil", "Agil", "metodologías ágiles", "metodologias agiles", "metodología ágil", "metodologia agil"]),
  e("Kanban"),
  e("WordPress"),
  e("Shopify"),
  e("Salesforce"),
  e("SAP", [], ["SAP"]),
];

// REGEX COMPILADA DE UN TÉRMINO; largo ORDENA PARA PRIORIZAR LOS TÉRMINOS MÁS LARGOS
interface Patron {
  canonico: string;
  regex: RegExp;
  largo: number;
}

// LÍMITES DE PALABRA PROPIOS: \b FALLA CON "C++", "C#" Y ".NET"
const ANTES = String.raw`(?<![\p{L}\p{N}_+#.])`;
const DESPUES = String.raw`(?![\p{L}\p{N}_+#])(?!\.[\p{L}\p{N}])`;

// ESCAPA UN TÉRMINO PARA REGEX; LOS ESPACIOS ADMITEN CUALQUIER ESPACIADO
function escaparRegex(termino: string): string {
  return termino
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"))
    .join(String.raw`\s+`);
}

// UN PATRÓN POR NOMBRE Y ALIAS; LOS TÉRMINOS caseSensitive SE COMPILAN SIN LA BANDERA "i"
function construirPatrones(): Patron[] {
  const patrones: Patron[] = [];
  for (const entrada of CATALOGO) {
    const cs = new Set(entrada.caseSensitive ?? []);
    const insensibles = [entrada.nombre, ...(entrada.alias ?? [])].filter((t) => !cs.has(t));
    const agregar = (termino: string, sensible: boolean): void => {
      // EVITA FALSOS POSITIVOS: "R&D" Y VERBOS EN INGLÉS COMO "Go to market", "Go beyond", "Go live"
      const extra =
        sensible && termino === "R" ? String.raw`(?!\s*&)`
        : sensible && termino === "Go" ? String.raw`(?!\s+(?:to|beyond|ahead|live|back|for|out|get)\b)`
        : "";
      patrones.push({
        canonico: entrada.nombre,
        regex: new RegExp(
          `${ANTES}${escaparRegex(termino)}${DESPUES}${extra}`,
          sensible ? "gu" : "giu",
        ),
        largo: termino.length,
      });
    };
    for (const t of new Set(insensibles)) agregar(t, false);
    for (const t of cs) agregar(t, true);
  }
  // MÁS LARGOS PRIMERO: "Spring Boot" DEBE GANAR A "Spring"
  return patrones.sort((a, b) => b.largo - a.largo);
}

const PATRONES = construirPatrones();

// CLAVE DE BÚSQUEDA: MINÚSCULAS Y ESPACIOS COLAPSADOS
function clave(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ").toLowerCase();
}

// CLAVE SIN ESPACIOS, PUNTOS NI GUIONES ("Node JS" = "node.js")
function compacta(nombre: string): string {
  return clave(nombre).replace(/[\s.\-_]/g, "");
}

// ÍNDICES DE NORMALIZACIÓN: TÉRMINO -> NOMBRE CANÓNICO (EL PRIMERO DEL CATÁLOGO GANA)
const POR_CLAVE = new Map<string, string>();
const POR_COMPACTA = new Map<string, string>();
for (const entrada of CATALOGO) {
  for (const t of [entrada.nombre, ...(entrada.alias ?? []), ...(entrada.caseSensitive ?? [])]) {
    if (!POR_CLAVE.has(clave(t))) POR_CLAVE.set(clave(t), entrada.nombre);
    // ".NET" QUEDA FUERA DE LA CLAVE COMPACTA PARA NO CHOCAR CON "NET"
    if (!t.startsWith(".") &&!POR_COMPACTA.has(compacta(t))) {
      POR_COMPACTA.set(compacta(t), entrada.nombre);
    }
  }
}

// DEVUELVE EL NOMBRE CANÓNICO DE UNA TECNOLOGÍA, O EL TEXTO ORIGINAL SI NO ESTÁ EN EL CATÁLOGO
export function normalizarTecnologia(nombre: string): string {
  const recortado = nombre.trim();
  return (
    POR_CLAVE.get(clave(recortado)) ??
    (compacta(recortado).length > 0 ? POR_COMPACTA.get(compacta(recortado)) : undefined) ??
    recortado
  );
}

// TECNOLOGÍAS DEL CATÁLOGO HALLADAS EN EL TEXTO, EN ORDEN DE APARICIÓN Y SIN REPETIR
export function tecnologiasEnTexto(texto: string): string[] {
  if (!texto) return [];
  const ocupados: Array<[number, number]> = [];
  const hallazgos: Array<{ indice: number; canonico: string }> = [];
  for (const p of PATRONES) {
    p.regex.lastIndex = 0;
    for (const m of texto.matchAll(p.regex)) {
      const ini = m.index ?? 0;
      const fin = ini + m[0].length;
      // DESCARTA HALLAZGOS SOLAPADOS CON OTRO MÁS LARGO YA REGISTRADO
      if (ocupados.some(([a, b]) => ini < b && fin > a)) continue;
      ocupados.push([ini, fin]);
      hallazgos.push({ indice: ini, canonico: p.canonico });
    }
  }
  hallazgos.sort((a, b) => a.indice - b.indice);
  return [...new Set(hallazgos.map((h) => h.canonico))];
}

// COMPARA LAS TECNOLOGÍAS DE LA OFERTA CONTRA LAS DEL PERFIL (INCLUIDAS LAS DE SUS PROYECTOS)
export function calcularMatch(
  descripcion: string,
  perfil: Pick<Perfil, "tecnologias" | "proyectos">,
): MatchResult {
  const propias = new Set<string>();
  const todas = [...perfil.tecnologias, ...perfil.proyectos.flatMap((p) => p.tecnologias)];
  for (const t of todas) propias.add(normalizarTecnologia(t).toLowerCase());

  const coincidencias: string[] = [];
  const faltan: string[] = [];
  for (const t of tecnologiasEnTexto(descripcion)) {
    (propias.has(t.toLowerCase()) ? coincidencias : faltan).push(t);
  }
  return { coincidencias, faltan };
}
