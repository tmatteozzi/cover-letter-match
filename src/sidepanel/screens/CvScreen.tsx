// PANTALLA DE PERFIL/CV: ONBOARDING (SUBIR PDF Y RESUMIR CON IA) Y EDICIÓN DEL PERFIL GUARDADO.
import { useEffect, useState, type ReactNode } from "react";
import { Briefcase, ChevronDown, FileText, FolderOpen, Plus, Trash2, Upload, User } from "lucide-react";
import type { Perfil } from "../../types";
import { clearAll, getCvTexto, getPerfil, setCvTexto, setPerfil } from "../../storage";
import { summarizeCv } from "../../ai/summarizeCv";
import { Button, buttonVariants } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Aviso } from "../Aviso";
import { Avatar, Bloque, BotonIcono, Hero, PANEL, Pantalla, Pestanas, Seccion, Volver } from "../Layout";

interface Props {
  // GEMINI NANO ESTÁ DISPONIBLE
  iaLista: boolean;
  // NANO NO PUEDE CORRER EN ESTE EQUIPO (NO ES SOLO "TODAVÍA NO DESCARGADO")
  nanoImposible: boolean;
  // PRIMER USO: AÚN NO HAY PERFIL GUARDADO
  onboarding?: boolean;
  onPerfilSaved: (p: Perfil) => void;
  onCleared: () => void;
  onBack?: () => void;
}

// CONVERSIONES ENTRE LISTAS DE TEXTO Y CAMPOS (UNO POR LÍNEA O SEPARADOS POR COMA)
const toLines = (a: string[]) => a.join("\n");
const fromLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const toCsv = (a: string[]) => a.join(", ");
const fromCsv = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

// CLASES COMUNES DE LOS INPUTS DE TEXTO
const CONTROL = "h-9 bg-background t-sec";

// INPUT PARA CAMPOS DE LISTA: CONSERVA EL TEXTO CRUDO PARA QUE ESCRIBIR COMAS/SALTOS NO SE PIERDA.
function ListInput({ id, value, onChange, csv, multiline }: { id?: string; value: string[]; onChange: (v: string[]) => void; csv?: boolean; multiline?: boolean }) {
  const [txt, setTxt] = useState(csv ? toCsv(value) : toLines(value));
  const parse = csv ? fromCsv : fromLines;
  const change = (s: string) => {
    setTxt(s);
    onChange(parse(s));
  };
  return multiline ? (
    <Textarea id={id} className="min-h-18 bg-background t-sec" value={txt} onChange={(e) => change(e.target.value)} />
  ) : (
    <Input id={id} className={CONTROL} value={txt} onChange={(e) => change(e.target.value)} />
  );
}

// ETIQUETA DE 12px SOBRE SU CONTROL, A 8px DE DISTANCIA.
function Campo({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id} className="t-meta">{label}</Label>
      {children}
    </div>
  );
}

// SOLO PARA MOSTRAR: "ANA PÉREZ" / "ana pérez" -> "Ana Pérez"; SI YA MEZCLA MAYÚSCULAS SE DEJA COMO ESTÁ.
const nombreLindo = (s: string) => {
  const t = s.trim().replace(/\s+/g, " ");
  if (t !== t.toUpperCase() && t !== t.toLowerCase()) return t;
  return t.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, l: string) => sep + l.toUpperCase());
};
// INICIALES DEL AVATAR: PRIMERA LETRA DE LA PRIMERA Y DE LA ÚLTIMA PALABRA
const iniciales = (s: string) => {
  const w = s.trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
};

// BLOQUE DESPLEGABLE PARA UNA EXPERIENCIA/PROYECTO: TÍTULO + META DE 12px, CAMPOS ADENTRO, QUITAR A LA DERECHA.
function ItemEditable({ titulo, meta, abierto, onQuitar, children }: {
  titulo: string; meta: string; abierto: boolean; onQuitar: () => void; children: ReactNode;
}) {
  return (
    <Collapsible defaultOpen={abierto} className="group/item min-w-0 rounded-lg bg-muted/50">
      <div className="flex items-center gap-1 pr-1">
        <CollapsibleTrigger className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <span className="grid min-w-0 flex-1">
            <span className="truncate t-body font-medium">{titulo}</span>
            {meta && <span className="truncate t-meta font-normal text-muted-foreground">{meta}</span>}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]/item:rotate-180" aria-hidden="true" />
        </CollapsibleTrigger>
        <BotonIcono icono={Trash2} label="Quitar" onClick={onQuitar} className="hover:bg-destructive/10 hover:text-destructive" />
      </div>
      <CollapsibleContent className="grid gap-3 px-3 pt-1 pb-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

// PERFIL EN BLANCO PARA COMPLETAR A MANO
const vacio: Perfil = {
  nombre: "", titulo: "", aniosExperiencia: 0, tecnologias: [],
  experiencias: [], proyectos: [], estudios: [], idiomas: [],
};

// EN ONBOARDING MUESTRA LA BIENVENIDA Y LUEGO LA REVISIÓN DEL PERFIL; SI NO, LA EDICIÓN CON PESTAÑAS
export default function CvScreen({ iaLista, nanoImposible, onboarding, onPerfilSaved, onCleared, onBack }: Props) {
  const [cv, setCv] = useState("");
  const [perfil, setPerfilState] = useState<Perfil | null>(null);
  // SE INCREMENTA PARA REMONTAR LOS INPUTS DE LISTA CUANDO SE REEMPLAZA EL PERFIL
  const [version, setVersion] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [leyendoPdf, setLeyendoPdf] = useState(false);
  const [tab, setTab] = useState("datos");

  useEffect(() => {
    getCvTexto().then(setCv);
    getPerfil().then(setPerfilState);
  }, []);

  // p = PERFIL EN EDICIÓN (O VACÍO); upd APLICA UN CAMBIO PARCIAL
  const p = perfil ?? vacio;
  const upd = (patch: Partial<Perfil>) => setPerfilState({ ...p, ...patch });
  // MENSAJE DE ÉXITO TEMPORAL (2,5 s)
  const nota = (m: string) => {
    setAviso(m);
    setTimeout(() => setAviso(""), 2500);
  };

  // EXTRAE EL TEXTO DEL PDF (import DINÁMICO PARA NO CARGAR LA LIBRERÍA ANTES DE NECESITARLA) Y LO GUARDA
  const cargarPdf = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setLeyendoPdf(true);
    try {
      const { extractPdfText } = await import("../../pdf/extractText");
      const texto = await extractPdfText(file);
      if (!texto.trim()) {
        throw new Error(`El PDF no tiene texto seleccionable (¿es un escaneo?). ${onboarding ? "Probá con otro PDF o completá el perfil a mano." : "Probá con otro PDF."}`);
      }
      setCv(texto);
      await setCvTexto(texto);
      // ONBOARDING: EL TEXTO DEL PDF NO SE MUESTRA; PASA DIRECTO AL RESUMEN CON IA QUE LLENA EL PERFIL
      if (onboarding) {
        setLeyendoPdf(false);
        await resumir(texto);
      } else {
        nota("CV cargado. Tocá «Resumir con IA» para regenerar el perfil.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el PDF.");
    } finally {
      setLeyendoPdf(false);
    }
  };

  // RESUME EL TEXTO DEL CV CON IA LOCAL Y REEMPLAZA EL PERFIL EN EDICIÓN
  const resumir = async (texto = cv) => {
    if (!iaLista || !texto.trim()) return;
    setError("");
    setCargando(true);
    try {
      await setCvTexto(texto);
      setPerfilState(await summarizeCv(texto));
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo resumir el CV.");
    } finally {
      setCargando(false);
    }
  };

  // PERSISTE EL PERFIL Y AVISA AL PADRE
  const guardarPerfil = async () => {
    if (!perfil) return;
    await setPerfil(perfil);
    onPerfilSaved(perfil);
  };

  // BORRA TODOS LOS DATOS (SE CONFIRMA ANTES CON EL AlertDialog)
  const borrar = async () => {
    await clearAll();
    setCv("");
    setPerfilState(null);
    setVersion((v) => v + 1);
    onCleared();
  };

  // EDITAN UN CAMPO DE LA EXPERIENCIA / PROYECTO EN LA POSICIÓN i
  const setExp = (i: number, patch: Partial<Perfil["experiencias"][number]>) =>
    upd({ experiencias: p.experiencias.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const setProy = (i: number, patch: Partial<Perfil["proyectos"][number]>) =>
    upd({ proyectos: p.proyectos.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  // INPUT DE ARCHIVO OCULTO; SE ACTIVA DESDE LA ETIQUETA VISIBLE (pdfLabel). SE LIMPIA PARA PODER ELEGIR EL MISMO PDF
  const pdfInput = (
    <input id="pdf" className="peer sr-only" type="file" accept="application/pdf,.pdf" disabled={leyendoPdf || cargando}
      onChange={(e) => { void cargarPdf(e.target.files?.[0]); e.target.value = ""; }} />
  );
  // EL INPUT DE ARCHIVO NATIVO SOLO ESTÁ EN INGLÉS ("Choose File"): SU ETIQUETA ES EL BOTÓN VISIBLE
  const PEER = "cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-disabled:pointer-events-none peer-disabled:opacity-50";
  const pdfLabel = (modo: "primario" | "icono" | "secundario") =>
    modo === "icono" ? (
      <Button asChild variant="outline" size="icon" className={cn("size-10 shrink-0 rounded-lg text-muted-foreground", PEER)}>
        <label htmlFor="pdf" title="Elegir archivo PDF"><Upload aria-hidden="true" /><span className="sr-only">Elegir archivo PDF</span></label>
      </Button>
    ) : (
      <Button asChild variant={modo === "primario" ? "default" : "outline"} size={modo === "primario" ? "lg" : "sm"}
        className={cn(modo === "primario" ? "w-full" : "h-9 t-sec", PEER)}>
        <label htmlFor="pdf"><Upload aria-hidden="true" />Elegir archivo PDF</label>
      </Button>
    );

  // BOTÓN "Resumir con IA" (primario = VERSIÓN GRANDE DE LA BARRA INFERIOR)
  const resumirBtn = (primario: boolean) => (
    <Button variant={primario ? "default" : "outline"} size={primario ? "lg" : "sm"} className={primario ? "min-w-0 flex-1" : "h-9 t-sec"}
      onClick={() => void resumir()} disabled={!cv.trim() || !iaLista || cargando}>
      {cargando ? "Resumiendo…" : "Resumir con IA"}
    </Button>
  );

  // ESTADO DE LA OPERACIÓN: LECTURA DE PDF, PROGRESO DEL RESUMEN, IA NO LISTA, ERROR Y ÉXITO
  const estado = (
    <>
      {leyendoPdf && <Aviso tipo="info" busy>Leyendo el PDF…</Aviso>}
      {cargando && (
        <div className="grid gap-2" role="status">
          <Progress className="h-1" value={null} aria-label="Resumiendo el CV" />
          <p className="t-meta font-normal text-muted-foreground">
            Leyendo tu CV… Con CVs largos puede tardar 1–2 minutos.
          </p>
        </div>
      )}
      {!iaLista && (
        <p className="t-meta font-normal text-muted-foreground">
          {nanoImposible
            ? "La IA local no está disponible en este equipo: completá el perfil a mano."
            : "La IA local no está lista todavía, por eso no se puede resumir."}
        </p>
      )}
      {error && <Aviso tipo="error">{error}</Aviso>}
      {aviso && <Aviso tipo="success">{aviso}</Aviso>}
    </>
  );

  // SALIDA SIN IA: EMPEZAR CON UN PERFIL VACÍO
  const manual = (
    <Button variant="link" size="sm" className="h-auto px-0 py-1 t-sec" onClick={() => setPerfilState(vacio)}>Completar perfil a mano</Button>
  );

  const nombre = nombreLindo(p.nombre);
  const avatar = <Avatar texto={iniciales(nombre) || <User className="size-6" />} />;

  // SECCIÓN "Datos" DEL PERFIL (SOLO SI HAY PERFIL)
  const datos = perfil && (
    <Seccion icono={User} titulo="Datos">
      <div className="grid gap-3">
        <Campo id="pf-nombre" label="Nombre">
          <Input id="pf-nombre" className={CONTROL} value={p.nombre} onChange={(e) => upd({ nombre: e.target.value })} />
        </Campo>
        <Campo id="pf-titulo" label="Título">
          <Input id="pf-titulo" className={CONTROL} value={p.titulo} onChange={(e) => upd({ titulo: e.target.value })} />
        </Campo>
        <Campo id="pf-anios" label="Años de experiencia">
          <Input id="pf-anios" className={CONTROL} type="number" min={0} value={p.aniosExperiencia}
            onChange={(e) => upd({ aniosExperiencia: Number(e.target.value) || 0 })} />
        </Campo>
        <Campo id="pf-tecnologias" label="Tecnologías (separadas por coma)">
          <ListInput id="pf-tecnologias" csv value={p.tecnologias} onChange={(v) => upd({ tecnologias: v })} />
        </Campo>
        <Campo id="pf-estudios" label="Estudios (uno por línea)">
          <ListInput id="pf-estudios" multiline value={p.estudios} onChange={(v) => upd({ estudios: v })} />
        </Campo>
        <Campo id="pf-idiomas" label="Idiomas (separados por coma)">
          <ListInput id="pf-idiomas" csv value={p.idiomas} onChange={(v) => upd({ idiomas: v })} />
        </Campo>
      </div>
    </Seccion>
  );

  // SECCIONES "Experiencia" Y "Proyectos": LISTAS EDITABLES. AL QUITAR SE INCREMENTA version PARA REMONTAR LOS INPUTS
  const agregar = "h-9 w-full justify-start gap-2 rounded-lg px-3 t-sec text-primary hover:text-primary has-[>svg]:px-3";
  const experiencia = perfil && (
    <>
      <Seccion icono={Briefcase} titulo="Experiencia">
        <div className="grid gap-2">
          {p.experiencias.map((x, i) => (
            <ItemEditable key={i} abierto={!x.puesto && !x.empresa}
              titulo={x.puesto || "Nueva experiencia"} meta={[x.empresa, x.periodo].filter(Boolean).join(" · ")}
              onQuitar={() => { upd({ experiencias: p.experiencias.filter((_, j) => j !== i) }); setVersion((v) => v + 1); }}>
              <Campo id={`exp-${i}-puesto`} label="Puesto">
                <Input id={`exp-${i}-puesto`} className={CONTROL} value={x.puesto} onChange={(e) => setExp(i, { puesto: e.target.value })} />
              </Campo>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-3">
                <Campo id={`exp-${i}-empresa`} label="Empresa">
                  <Input id={`exp-${i}-empresa`} className={CONTROL} value={x.empresa} onChange={(e) => setExp(i, { empresa: e.target.value })} />
                </Campo>
                <Campo id={`exp-${i}-periodo`} label="Período">
                  <Input id={`exp-${i}-periodo`} className={CONTROL} value={x.periodo} onChange={(e) => setExp(i, { periodo: e.target.value })} />
                </Campo>
              </div>
              <Campo id={`exp-${i}-logros`} label="Logros (uno por línea)">
                <ListInput id={`exp-${i}-logros`} multiline value={x.logros} onChange={(v) => setExp(i, { logros: v })} />
              </Campo>
            </ItemEditable>
          ))}
          <Button variant="ghost" size="sm" className={agregar}
            onClick={() => upd({ experiencias: [...p.experiencias, { empresa: "", puesto: "", periodo: "", logros: [] }] })}>
            <Plus aria-hidden="true" />Agregar experiencia
          </Button>
        </div>
      </Seccion>

      <Seccion icono={FolderOpen} titulo="Proyectos">
        <div className="grid gap-2">
          {p.proyectos.map((x, i) => (
            <ItemEditable key={i} abierto={!x.nombre} titulo={x.nombre || "Nuevo proyecto"} meta={x.tecnologias.join(", ")}
              onQuitar={() => { upd({ proyectos: p.proyectos.filter((_, j) => j !== i) }); setVersion((v) => v + 1); }}>
              <Campo id={`proy-${i}-nombre`} label="Nombre">
                <Input id={`proy-${i}-nombre`} className={CONTROL} value={x.nombre} onChange={(e) => setProy(i, { nombre: e.target.value })} />
              </Campo>
              <Campo id={`proy-${i}-descripcion`} label="Descripción">
                <Textarea id={`proy-${i}-descripcion`} className="min-h-18 bg-background t-sec" value={x.descripcion}
                  onChange={(e) => setProy(i, { descripcion: e.target.value })} />
              </Campo>
              <Campo id={`proy-${i}-tecnologias`} label="Tecnologías (separadas por coma)">
                <ListInput id={`proy-${i}-tecnologias`} csv value={x.tecnologias} onChange={(v) => setProy(i, { tecnologias: v })} />
              </Campo>
            </ItemEditable>
          ))}
          <Button variant="ghost" size="sm" className={agregar}
            onClick={() => upd({ proyectos: [...p.proyectos, { nombre: "", descripcion: "", tecnologias: [] }] })}>
            <Plus aria-hidden="true" />Agregar proyecto
          </Button>
        </div>
      </Seccion>
    </>
  );

  // ONBOARDING: REVISIÓN DEL PERFIL YA GENERADO, O BIENVENIDA CON SUBIDA DE PDF
  if (onboarding) {
    if (perfil) {
      return (
        <Pantalla barra={<Button size="lg" className="w-full" onClick={guardarPerfil}>Guardar y empezar</Button>}>
          <Hero avatar={avatar} titulo="Revisá tu perfil" subtitulo="Corregí lo que haga falta antes de guardar." />
          <Tabs key={version} value={tab === "cv" ? "datos" : tab} onValueChange={setTab} className="mt-5 gap-0">
            <Pestanas items={[{ value: "datos", label: "Datos" }, { value: "experiencia", label: "Experiencia" }]} />
            <TabsContent value="datos" forceMount className={PANEL}>{datos}</TabsContent>
            <TabsContent value="experiencia" forceMount className={PANEL}>{experiencia}</TabsContent>
          </Tabs>
        </Pantalla>
      );
    }
    // SE LEYÓ UN PDF PERO NO SE PUDO RESUMIR (IA NO LISTA O FALLÓ): PERMITE REINTENTAR SIN VOLVER A SUBIRLO
    const reintentar = !!cv.trim() && !cargando && !leyendoPdf;
    return (
      <Pantalla className="flex flex-col justify-center"
        barra={reintentar ? <>{pdfInput}{pdfLabel("icono")}{resumirBtn(true)}</> : <>{pdfInput}{pdfLabel("primario")}</>}>
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="/icons/icon-128.png" alt="" width={96} height={96} className="size-24" />
          <div className="grid gap-2">
            <h1 className="t-welcome">Bienvenido/a</h1>
            <p className="mx-auto max-w-[32ch] t-body text-muted-foreground">
              Subí tu CV en PDF una sola vez: la IA arma tu perfil automáticamente. Todo queda en tu compu.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          {estado}
          <div className="flex justify-center">{manual}</div>
        </div>
      </Pantalla>
    );
  }

  // PERFIL: SECCIÓN DEL CV GUARDADO Y PANTALLA DE EDICIÓN CON PESTAÑAS
  const seccionCv = (
    <Seccion icono={FileText} titulo="Tu CV">
      <Bloque className="grid gap-1">
        <span className="t-body">{cv.trim() ? "CV guardado" : "Todavía no hay un CV guardado"}</span>
        <span className="t-meta font-normal text-muted-foreground">
          {cv.trim()
            ? "Subí un PDF nuevo para reemplazarlo y volvé a resumirlo para actualizar el perfil."
            : "Subí tu CV en PDF."}
        </span>
      </Bloque>
      <div className="flex flex-wrap gap-2">
        {pdfInput}{pdfLabel("secundario")}{resumirBtn(false)}
      </div>
      {estado}
    </Seccion>
  );

  return (
    <Pantalla barra={<Button size="lg" className="w-full" onClick={guardarPerfil} disabled={!perfil}>Guardar perfil</Button>}>
      <Volver onClick={onBack} />
      <div className="mt-2">
        <Hero avatar={avatar} titulo={nombre || "Tu perfil"} subtitulo={p.titulo || "El CV y los datos que se usan para tus cartas."} />
      </div>
      {perfil ? (
        <Tabs key={version} value={tab} onValueChange={setTab} className="mt-5 gap-0">
          <Pestanas items={[{ value: "datos", label: "Datos" }, { value: "experiencia", label: "Experiencia" }, { value: "cv", label: "CV" }]} />
          <TabsContent value="datos" forceMount className={PANEL}>
            {datos}
            <div className="grid justify-items-start gap-1 border-t pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="link" size="sm" className="h-auto px-0 py-1 t-sec text-destructive">Borrar mis datos</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Borrar todos tus datos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminan el CV, el perfil y el historial de cartas guardados en este navegador. No se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={() => void borrar()}>
                      Borrar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="t-meta font-normal text-muted-foreground">Elimina el CV, el perfil y el historial de cartas guardados en este navegador.</p>
            </div>
          </TabsContent>
          <TabsContent value="experiencia" forceMount className={PANEL}>{experiencia}</TabsContent>
          <TabsContent value="cv" forceMount className={PANEL}>{seccionCv}</TabsContent>
        </Tabs>
      ) : (
        <div className="mt-5 grid gap-5">
          {seccionCv}
          <div>{manual}</div>
        </div>
      )}
    </Pantalla>
  );
}
