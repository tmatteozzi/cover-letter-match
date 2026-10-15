// PANTALLA DE HISTORIAL: LISTA, BUSCA, COPIA Y ELIMINA LAS CARTAS GENERADAS, AGRUPADAS POR EMPRESA.
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Copy, ExternalLink, FileText, Search, Trash2 } from "lucide-react";
import type { EntradaHistorial } from "../../types";
import { eliminarDelHistorial, getHistorial } from "../../storage";
import { agruparPorEmpresa, filtrarHistorial } from "../../historial";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Aviso } from "../Aviso";
import { Bloque, BotonIcono, Pantalla, Volver } from "../Layout";

// FORMATEA UNA FECHA ISO COMO "15 oct 2026"; DEVUELVE "" SI NO ES VÁLIDA
const fechaCorta =(iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
};

// ENTRADA DESPLEGABLE DEL HISTORIAL: PUESTO Y METADATOS; AL ABRIR MUESTRA LA CARTA Y SUS ACCIONES
function Item({ e, n, onEliminar }: { e: EntradaHistorial; n: number; onEliminar: () => void }) {
  const [copiada, setCopiada] = useState(false);
  const [error, setError] = useState("");
  // COPIA LA CARTA Y MUESTRA "¡Copiada!" 2 SEGUNDOS
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(e.carta);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2000);
    } catch {
      setError("No se pudo copiar al portapapeles.");
    }
  };
  // LÍNEA DE METADATOS: EMPRESA · FECHA · IDIOMA · FORMATO (OMITE LOS VACÍOS)
  const meta = [e.empresa, fechaCorta(e.fecha), e.idioma === "en" ? "inglés" : "español", e.formato === "mensaje-corto" ? "mensaje corto" : ""]
    .filter(Boolean).join(" · ");
  return (
    <Collapsible asChild className="group/item">
      <li className="min-w-0">
        <CollapsibleTrigger className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2 py-2 text-left outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/40 group-data-[state=open]/item:bg-muted/50">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted t-meta text-muted-foreground" aria-hidden="true">{n}</span>
          <span className="grid min-w-0 flex-1">
            <span className="truncate t-body font-medium">{e.puesto || "Puesto sin detectar"}</span>
            <span className="truncate t-meta font-normal text-muted-foreground">{meta}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]/item:rotate-180" aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent className="grid gap-2 pt-1 pb-2 pl-11">
          <Bloque className="grid gap-1 px-0 pt-1 pb-0">
            <div className="flex min-h-8 items-center justify-end gap-1 pr-1">
              {e.url && (
                <Button variant="ghost" size="icon-sm" asChild className="text-muted-foreground">
                  <a href={e.url} target="_blank" rel="noreferrer" title="Ver oferta">
                    <ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only">Ver oferta</span>
                  </a>
                </Button>
              )}
              <BotonIcono icono={copiada ? Check : Copy} label={copiada ? "¡Copiada!" : "Copiar"} onClick={copiar}
                className={cn(copiada && "text-success-foreground hover:text-success-foreground")} />
              <BotonIcono icono={Trash2} label="Eliminar" onClick={onEliminar} className="hover:bg-destructive/10 hover:text-destructive" />
            </div>
            <p className="px-3 pb-3 t-sec leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{e.carta}</p>
          </Bloque>
          {error && <Aviso tipo="error">{error}</Aviso>}
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}

// PANTALLA DE HISTORIAL; onBack VUELVE A LA CARTA
export default function HistoryScreen({ onBack }: { onBack: () => void }) {
  // null = TODAVÍA CARGANDO; q = TEXTO DEL BUSCADOR
  const [lista, setLista] = useState<EntradaHistorial[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    getHistorial().then(setLista);
  }, []);

  const grupos = useMemo(() => agruparPorEmpresa(filtrarHistorial(lista ?? [], q)), [lista, q]);

  // BORRA UNA ENTRADA Y REEMPLAZA LA LISTA CON LA QUE DEVUELVE EL STORAGE
  const eliminar = async (id: string) => {
    setLista(await eliminarDelHistorial(id));
  };

  return (
    <Pantalla>
      <Volver onClick={onBack} />
      <div className="mt-2 grid gap-1">
        <h1 className="t-hero">Historial</h1>
        <p className="t-sec text-muted-foreground">Las cartas que generaste, agrupadas por empresa.</p>
      </div>

      {lista && lista.length > 0 && (
        <div className="relative mt-5">
          <Label htmlFor="buscar-historial" className="sr-only">Buscar por empresa o puesto</Label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="buscar-historial" type="search" className="h-9 border-transparent bg-muted pl-9 t-sec" placeholder="Buscar por empresa o puesto…"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}

      {/* ESTADO VACÍO: TODAVÍA NO HAY CARTAS */}
      {lista && lista.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
            <FileText className="size-6" />
          </div>
          <div className="grid gap-1">
            <h2 className="t-body font-semibold">Sin cartas todavía</h2>
            <p className="t-sec text-muted-foreground">Cuando generes una carta, va a aparecer acá.</p>
          </div>
        </div>
      )}
      {lista && lista.length > 0 && grupos.length === 0 && (
        <p className="py-6 text-center t-sec text-muted-foreground" role="status">Nada coincide con “{q}”.</p>
      )}

      {/* UNA SECCIÓN POR EMPRESA, CON SUS CARTAS NUMERADAS */}
      <div className="mt-5 grid gap-5">
        {grupos.map((g) => (
          <section key={g.empresa} className="grid min-w-0 gap-1" aria-label={g.empresa}>
            <h2 className="flex items-baseline gap-1 px-2 t-sec font-medium text-muted-foreground [overflow-wrap:anywhere]">
              {g.empresa}
              <span className="t-meta font-normal">· {g.entradas.length} {g.entradas.length === 1 ? "carta" : "cartas"}</span>
            </h2>
            <ol className="grid gap-1">
              {g.entradas.map((e, i) => (
                <Item key={e.id} e={e} n={i + 1} onEliminar={() => void eliminar(e.id)} />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </Pantalla>
  );
}
