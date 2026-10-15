// PANTALLA PRINCIPAL: LEE LA OFERTA DE LA PESTAÑA, MUESTRA COINCIDENCIAS CON EL CV Y GENERA LA CARTA CON IA.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignLeft, Check, CircleCheck, CircleDashed, Copy, FileText, ListChecks, LoaderCircle, RefreshCw,
  RotateCcw, SearchX, SlidersHorizontal, Square,
} from "lucide-react";
import type { Formato, Idioma, Oferta, Perfil, Preferencias, Tono } from "../../types";
import { actualizarHistorial, agregarAlHistorial, getPreferencias, setPreferencias } from "../../storage";
import { extractOferta } from "../../extractors";
import { pareceOferta } from "../../extractors/esOferta";
import { generateLetter } from "../../ai/generateLetter";
import { idiomaFinal } from "../../ai/detectLanguage";
import { nuevoId } from "../../historial";
import { calcularMatch } from "../../match";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Aviso } from "../Aviso";
import { Avatar, Bloque, BotonIcono, Fila, Hero, PANEL, Pantalla, Pestanas, Seccion } from "../Layout";

interface Props {
  perfil: Perfil;
  // GEMINI NANO ESTÁ DISPONIBLE
  iaLista: boolean;
  // SE INCREMENTA CON EL BOTÓN "Recargar oferta" DE LA CABECERA
  recarga?: number;
}

// PARÁMETROS CON LOS QUE SE GENERÓ UNA CARTA (PARA PODER REPETIRLA CON "Generar otra")
interface Generacion {
  oferta: Oferta;
  prefs: Pick<Preferencias, "tono" | "formato">;
  idioma: "es" | "en";
}

const NOMBRE_IDIOMA = { es: "español", en: "inglés", otro: "otro idioma" } as const;
const NOMBRE_SITIO: Record<Oferta["sitio"], string> = {
  linkedin: "LinkedIn", computrabajo: "Computrabajo", bumeran: "Bumeran", zonajobs: "ZonaJobs", indeed: "Indeed", seeds: "Seeds", universia: "Universia", otro: "",
};
// LA PESTAÑA "Oferta" MUESTRA EL TEXTO LEÍDO, RECORTADO A ESTE LARGO
const MAX_DESCRIPCION = 4000;

// NOMBRE LEGIBLE DEL SITIO; SI ES DESCONOCIDO USA EL HOSTNAME DE LA URL
const nombreSitio = (o: Oferta) => {
  if (NOMBRE_SITIO[o.sitio]) return NOMBRE_SITIO[o.sitio];
  try {
    return new URL(o.url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

interface Opcion<T extends string> {
  value: T;
  label: string;
}

// ETIQUETA + CONTROL SEGMENTADO DE ELECCIÓN ÚNICA (Radix ToggleGroup: ITEMS role="radio", NAVEGA CON FLECHAS).
function Opciones<T extends string>({
  id, label, value, opciones, onChange,
}: { id: string; label: string; value: T; opciones: Opcion<T>[]; onChange: (v: T) => void }) {
  const labelId = `${id}-label`;
  // Radix ENVÍA "" AL DESELECCIONAR: SE IGNORA PARA QUE SIEMPRE HAYA UNA OPCIÓN ELEGIDA
  return (
    <div className="grid min-w-0 gap-2">
      <span id={labelId} className="t-meta text-muted-foreground">{label}</span>
      <ToggleGroup id={id} type="single" className="h-9 w-full gap-0 rounded-lg bg-muted p-1" aria-labelledby={labelId}
        value={value} onValueChange={(v) => { if (v) onChange(v as T); }}>
        {opciones.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value}
            className="h-7 min-w-0 flex-1 rounded-md px-2 t-sec font-medium text-muted-foreground transition-[color,background-color,box-shadow] duration-150 first:rounded-md last:rounded-md hover:bg-transparent hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs">
            <span className="truncate">{o.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

// ESTADO DE CARGA MIENTRAS SE LEE LA OFERTA POR PRIMERA VEZ
const Leyendo = () => (
  <Pantalla>
    <div className="flex flex-col items-center gap-3" aria-label="Oferta detectada">
      <Skeleton className="size-16 rounded-full bg-muted" />
      <Skeleton className="h-5 w-2/3 bg-muted" />
      <Skeleton className="h-3.5 w-1/3 bg-muted" />
      <p className="flex items-center gap-2 t-sec text-muted-foreground" role="status">
        <LoaderCircle className="size-3.5 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
        Leyendo la oferta de la pestaña…
      </p>
    </div>
  </Pantalla>
);

// LISTA DE TECNOLOGÍAS COMO ETIQUETAS: "ok" = FIGURAN EN EL CV, "falta" = NO FIGURAN
function Chips({ items, tipo }: { items: string[]; tipo: "ok" | "falta" }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((t) => (
        <li key={t} className={cn("rounded-md border px-2 py-0.5 t-meta",
          tipo === "ok" ? "border-success/25 bg-success/10 text-success-foreground" : "border-border bg-muted/50 text-muted-foreground")}>
          {t}
        </li>
      ))}
    </ul>
  );
}

// PANTALLA DE LA CARTA: ESTADO VACÍO SI NO HAY OFERTA; SI NO, HERO + PESTAÑAS Carta / Coincidencias / Oferta
export default function LetterScreen({ perfil, iaLista, recarga }: Props) {
  // ENTRADA DEL HISTORIAL DE LA ÚLTIMA CARTA TERMINADA (+ TEXTO GUARDADO), PARA ACTUALIZARLA SI SE EDITA AL COPIAR
  const entradaRef = useRef<{ id: string; carta: string } | null>(null);
  const [prefs, setPrefs] = useState<Preferencias | null>(null);
  const [oferta, setOferta] = useState<Oferta | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  // FUERZA INGLÉS UNA SOLA VEZ, DESDE LA SUGERENCIA "pide inglés"
  const [usarIngles, setUsarIngles] = useState(false);
  const [carta, setCarta] = useState("");
  const [generando, setGenerando] = useState(false);
  // ESPEJO DE generando PARA LEERLO DENTRO DE EFECTOS SIN AGREGARLO A SUS DEPENDENCIAS
  const generandoRef = useRef(false);
  generandoRef.current = generando;
  const [error, setError] = useState("");
  // NO SE PUDO LEER LA PESTAÑA (chrome://, SIN ACCESO...)
  const [errorLectura, setErrorLectura] = useState("");
  // "Generar igual": MUESTRA EL FORMULARIO EN UNA PÁGINA QUE NO PARECE UNA OFERTA
  const [forzar, setForzar] = useState(false);
  const [copiada, setCopiada] = useState(false);
  const [ultima, setUltima] = useState<Generacion | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // EL FORZADO A INGLÉS SOLO VALE PARA LA OFERTA EN LA QUE SE ELIGIÓ
  const urlRef = useRef("");
  const [tab, setTab] = useState("carta");

  // LEE LA OFERTA DE LA PESTAÑA ACTIVA; RESETEA LOS OVERRIDES SI CAMBIÓ LA URL. DEVUELVE LA OFERTA O null
  const leerOferta = useCallback(async () => {
    setError("");
    setErrorLectura("");
    setLeyendo(true);
    try {
      const of = await extractOferta();
      if (urlRef.current !== of.url) {
        setUsarIngles(false);
        setForzar(false);
      }
      urlRef.current = of.url;
      setOferta(of);
      return of;
    } catch (e) {
      setOferta(null);
      setForzar(false);
      urlRef.current = "";
      setErrorLectura(e instanceof Error ? e.message : "No se pudo leer la oferta.");
      return null;
    } finally {
      setLeyendo(false);
    }
  }, []);

  useEffect(() => {
    getPreferencias().then(setPrefs);
    void leerOferta();
  }, [leerOferta]);

  // BOTÓN "Recargar oferta" DE LA CABECERA: RELEE LA PÁGINA (NO MIENTRAS SE ESCRIBE UNA CARTA)
  useEffect(() => {
    if (recarga && !generandoRef.current) void leerOferta();
  }, [recarga, leerOferta]);

  // COINCIDENCIAS ENTRE LAS TECNOLOGÍAS DE LA OFERTA Y EL CV
  const match = useMemo(() => {
    if (!oferta) return null;
    const m = calcularMatch(oferta.descripcion, perfil);
    // LA EMPRESA QUE CONTRATA ("Vercel") NO ES UNA HABILIDAD QUE FALTE EN EL CV
    const empresa = oferta.empresa.trim().toLowerCase();
    return { ...m, faltan: m.faltan.filter((t) => t.toLowerCase() !== empresa) };
  }, [oferta, perfil]);

  // ACTUALIZA Y PERSISTE LAS PREFERENCIAS (TONO, FORMATO, IDIOMA)
  const cambiarPrefs = (patch: Partial<Preferencias>) => {
    // ACTUALIZACIÓN FUNCIONAL: DOS CAMBIOS SEGUIDOS (tono Y LUEGO formato) NO DEBEN PISARSE
    setPrefs((actual) => {
      if (!actual) return actual;
      const nuevas = { ...actual, ...patch };
      void setPreferencias(nuevas);
      return nuevas;
    });
    if (patch.idioma) setUsarIngles(false);
  };

  // GENERA LA CARTA EN STREAMING Y, SI TERMINA SIN CANCELAR, LA GUARDA EN EL HISTORIAL
  const correr = async (g: Generacion) => {
    if (!iaLista) return;
    setError("");
    setCarta("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setGenerando(true);
    setUltima(g);
    try {
      const final = await generateLetter(perfil, g.oferta, g.prefs, g.idioma, setCarta, ctrl.signal);
      if (final.trim() && !ctrl.signal.aborted) {
        const id = nuevoId();
        entradaRef.current = { id, carta: final };
        void agregarAlHistorial({
          id, fecha: new Date().toISOString(), empresa: g.oferta.empresa, puesto: g.oferta.puesto,
          url: g.oferta.url, sitio: g.oferta.sitio, idioma: g.idioma, tono: g.prefs.tono, formato: g.prefs.formato, carta: final,
        });
      }
    } catch (e) {
      if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "No se pudo generar la carta.");
    } finally {
      setGenerando(false);
      abortRef.current = null;
    }
  };

  // BOTÓN "Generar carta": ASEGURA TENER OFERTA (LA LEE SI HACE FALTA) Y ARMA LOS PARÁMETROS
  const generar = async () => {
    if (!prefs) return;
    const of = oferta ?? (await leerOferta());
    if (!of) return;
    await correr({
      oferta: of,
      prefs: { tono: prefs.tono, formato: prefs.formato },
      idioma: usarIngles ? "en" : idiomaFinal(prefs.idioma, of.idiomaDetectado),
    });
  };

  // COPIA LA CARTA AL PORTAPAPELES (INCLUIDAS LAS EDICIONES DEL USUARIO)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(carta);
      setCopiada(true);
      // SI EL USUARIO EDITÓ LA CARTA ANTES DE COPIAR, GUARDA LA VERSIÓN EDITADA EN EL HISTORIAL
      const e = entradaRef.current;
      if (e && carta.trim() && carta !== e.carta) {
        e.carta = carta;
        void actualizarHistorial(e.id, carta);
      }
      setTimeout(() => setCopiada(false), 2000);
    } catch {
      setError("No se pudo copiar al portapapeles.");
    }
  };

  // NO RENDERIZA NADA HASTA TENER LAS PREFERENCIAS CARGADAS
  if (!prefs) return null;

  const idiomaCarta = oferta ? (usarIngles ? "en" : idiomaFinal(prefs.idioma, oferta.idiomaDetectado)) : null;
  const releer = () => void leerOferta();
  const iconoReleer = leyendo
    ? <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
    : <RefreshCw aria-hidden="true" />;

  // PRIMERA LECTURA EN CURSO: SOLO LA CARGA, PARA QUE EL FORMULARIO NO PARPADEE ANTES DEL ESTADO VACÍO
  if (leyendo && !oferta) return <Leyendo />;

  // ESTADO VACÍO: ERROR DE LECTURA, SIN OFERTA O PÁGINA QUE NO PARECE OFERTA (SALVO QUE SE FUERCE)
  const noEsOferta = !!oferta && !pareceOferta(oferta.puesto, oferta.descripcion, oferta.url, oferta.enfocada);
  if (!generando && !carta && (errorLectura || !oferta || (noEsOferta && !forzar))) {
    return (
      <Pantalla className="flex flex-col justify-center"
        barra={<Button size="lg" className="w-full" onClick={releer} disabled={leyendo}>{iconoReleer}Volver a leer la pestaña</Button>}>
        <div className="grid gap-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
              <SearchX className="size-6" />
            </div>
            <div className="grid gap-1">
              <h1 className="t-hero">No hay una oferta en esta página</h1>
              <p className="t-sec text-muted-foreground">
                Abrí una postulación en LinkedIn, Computrabajo, Bumeran u otro sitio de empleo y volvé a leer la pestaña.
              </p>
            </div>
            {errorLectura && (
              <p className="t-meta text-muted-foreground [overflow-wrap:anywhere]" role="alert">{errorLectura}</p>
            )}
          </div>
          {!errorLectura && noEsOferta && (
            <div className="flex justify-center">
              <Button variant="link" size="sm" className="h-auto px-0 py-1 t-meta text-muted-foreground" onClick={() => setForzar(true)}>Generar igual</Button>
            </div>
          )}
        </div>
      </Pantalla>
    );
  }

  // VALORES DERIVADOS PARA LA VISTA: SUBTÍTULO, INICIAL DEL AVATAR Y TEXTO DE LA OFERTA RECORTADO
  const sinTecnologias =!!match && match.coincidencias.length + match.faltan.length === 0;
  const empresaSitio = oferta ? [oferta.empresa, nombreSitio(oferta)].filter(Boolean).join(" · ") : "";
  const inicial = (oferta?.empresa.trim() || oferta?.puesto.trim() || "?").charAt(0).toUpperCase();
  const descripcion = oferta
    ? oferta.descripcion.length > MAX_DESCRIPCION ? `${oferta.descripcion.slice(0, MAX_DESCRIPCION).trimEnd()}…` : oferta.descripcion
    : "";

  // BARRA INFERIOR: RELEER LA PESTAÑA + GENERAR / DETENER
  const barra = (
    <>
      <Button variant="outline" size="icon" className="size-10 shrink-0 rounded-lg text-muted-foreground" title="Volver a leer la pestaña"
        onClick={releer} disabled={leyendo || generando}>
        {iconoReleer}<span className="sr-only">Volver a leer la pestaña</span>
      </Button>
      {generando ? (
        <Button size="lg" className="min-w-0 flex-1" onClick={() => abortRef.current?.abort()}>
          <Square className="size-3.5 fill-current" aria-hidden="true" />Detener
        </Button>
      ) : (
        <Button size="lg" className="min-w-0 flex-1" onClick={() => { setTab("carta"); void generar(); }} disabled={!iaLista || leyendo}>
          Generar carta
        </Button>
      )}
    </>
  );

  return (
    <Pantalla barra={barra}>
      {oferta && (
        <Hero id="oferta-h" avatar={<Avatar texto={inicial} imagen={oferta?.logo} />}
          titulo={oferta.puesto || "Puesto sin detectar"} subtitulo={empresaSitio || undefined} />
      )}

      <Tabs value={tab} onValueChange={setTab} className="mt-5 gap-0">
        <Pestanas items={[{ value: "carta", label: "Carta" }, { value: "coincidencias", label: "Coincidencias" }, { value: "oferta", label: "Oferta" }]} />

        <TabsContent value="carta" forceMount className={PANEL}>
          <Seccion icono={SlidersHorizontal} titulo="Opciones">
            <div className="grid gap-3">
              <Opciones id="tono" label="Tono" value={prefs.tono} onChange={(v: Tono) => cambiarPrefs({ tono: v })}
                opciones={[{ value: "formal", label: "Formal" }, { value: "cercano", label: "Cercano" }]} />
              <Opciones id="formato" label="Formato" value={prefs.formato} onChange={(v: Formato) => cambiarPrefs({ formato: v })}
                opciones={[{ value: "carta", label: "Carta" }, { value: "mensaje-corto", label: "Mensaje corto" }]} />
              <Opciones id="idioma" label="Idioma" value={prefs.idioma} onChange={(v: Idioma) => cambiarPrefs({ idioma: v })}
                opciones={[{ value: "auto", label: "Automático" }, { value: "es", label: "Español" }, { value: "en", label: "English" }]} />
              {usarIngles && (
                <Button variant="link" size="sm" className="h-auto justify-self-start p-0 t-meta" onClick={() => setUsarIngles(false)}>Volver a español</Button>
              )}
              {oferta?.idiomaDetectado === "es" && oferta.pideIngles && idiomaCarta === "es" && (
                <Aviso tipo="info">
                  <p>
                    Esta oferta pide inglés.{" "}
                    <Button variant="link" size="sm" className="h-auto p-0 t-sec" onClick={() => setUsarIngles(true)}>Sí, escribir en inglés</Button>
                  </p>
                </Aviso>
              )}
            </div>
          </Seccion>

          {/* LA SECCIÓN DE LA CARTA SOLO EXISTE TRAS PEDIRLA; LUEGO LLEGA POR STREAMING EN EL MISMO LUGAR */}
          {(carta || generando) && (
            <Seccion icono={FileText} titulo={<label htmlFor="carta">Tu carta</label>}>
              <Bloque className={cn("grid gap-1 px-0 pt-1 pb-0 transition-shadow focus-within:ring-2 focus-within:ring-primary/30", generando && "ring-1 ring-primary/30")}>
                <div className="flex min-h-8 items-center gap-1 pr-1 pl-3">
                  <p className="min-w-0 flex-1 truncate t-meta font-normal text-muted-foreground">
                    {generando ? "Escribiendo…" : "Podés editarla antes de copiarla."}
                  </p>
                  {!generando && (
                    <>
                      <BotonIcono icono={copiada ? Check : Copy} label={copiada ? "¡Copiada!" : "Copiar"} onClick={copiar} disabled={!carta}
                        className={cn(copiada && "text-success-foreground hover:text-success-foreground")} />
                      {ultima && (
                        <BotonIcono icono={RotateCcw} label="Generar otra" onClick={() => void correr(ultima)} disabled={!iaLista} />
                      )}
                    </>
                  )}
                </div>
                <Textarea id="carta" aria-busy={generando} value={carta} onChange={(e) => setCarta(e.target.value)}
                  className="min-h-72 resize-y rounded-none border-0 bg-transparent px-3 pt-0 pb-3 t-body leading-relaxed field-sizing-fixed focus-visible:ring-0" />
              </Bloque>
              {/* AVISA SI QUEDARON MARCADORES [ENTRE CORCHETES] SIN COMPLETAR */}
              {!generando && /\[[^\]]+\]/.test(carta) && (
                <Aviso tipo="warn">La carta tiene partes [entre corchetes] para completar o borrar antes de enviarla.</Aviso>
              )}
            </Seccion>
          )}
          {error && <Aviso tipo="error">{error}</Aviso>}
        </TabsContent>

        {/* PESTAÑA COINCIDENCIAS: TECNOLOGÍAS DE LA OFERTA QUE FIGURAN O NO EN EL CV */}
        <TabsContent value="coincidencias" forceMount className={PANEL}>
          {!match || sinTecnologias ? (
            <Seccion icono={ListChecks} titulo="Tecnologías">
              <Bloque><p className="t-sec text-muted-foreground">No se detectaron tecnologías conocidas en la oferta.</p></Bloque>
            </Seccion>
          ) : (
            <>
              <Seccion icono={CircleCheck} titulo="En tu CV">
                {match.coincidencias.length
                  ? <Chips items={match.coincidencias} tipo="ok" />
                  : <p className="t-sec text-muted-foreground">Ninguna</p>}
              </Seccion>
              {match.faltan.length > 0 && (
                <Seccion icono={CircleDashed} titulo="No figuran en tu CV">
                  <Chips items={match.faltan} tipo="falta" />
                </Seccion>
              )}
            </>
          )}
        </TabsContent>

        {/* PESTAÑA OFERTA: DATOS DETECTADOS Y TEXTO LEÍDO DE LA PÁGINA */}
        <TabsContent value="oferta" forceMount className={PANEL}>
          {oferta && (
            <>
              <Bloque className="grid">
                <Fila label="Sitio">{nombreSitio(oferta) || "Otro"}</Fila>
                <Fila label="Idioma de la oferta">{NOMBRE_IDIOMA[oferta.idiomaDetectado]}{oferta.pideIngles ? " · pide inglés" : ""}</Fila>
              </Bloque>
              <Seccion icono={AlignLeft} titulo="Texto leído">
                <Bloque tabIndex={0} aria-label="Texto de la oferta leído de la pestaña"
                  className="max-h-80 overflow-y-auto t-sec whitespace-pre-wrap text-muted-foreground outline-none [overflow-wrap:anywhere] focus-visible:ring-2 focus-visible:ring-primary/40">
                  {descripcion || "No se pudo leer el texto de la oferta."}
                </Bloque>
              </Seccion>
            </>
          )}
        </TabsContent>
      </Tabs>
    </Pantalla>
  );
}
