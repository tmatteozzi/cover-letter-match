// COMPONENTES DE LAYOUT COMPARTIDOS DEL SIDE PANEL: PANTALLA, BARRA, HERO, AVATAR, SECCIONES Y PESTAÑAS.
import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// PANTALLA = CUERPO CON SCROLL + BARRA INFERIOR FIJA OPCIONAL. PADDING HORIZONTAL 16px, SUPERIOR 20px.
export function Pantalla({ children, barra, className }: { children: ReactNode; barra?: ReactNode; className?: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className={cn("min-w-0 flex-1 px-4 pt-5 pb-6", className)}>{children}</div>
      {barra && <Barra>{barra}</Barra>}
    </div>
  );
}

// BARRA INFERIOR PEGAJOSA PARA LAS ACCIONES PRINCIPALES DE UNA PANTALLA
export function Barra({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t bg-background px-4 py-3">{children}</div>
  );
}

// BLOQUE DE IDENTIDAD CENTRADO: AVATAR DE 64px + TÍTULO DE 17px + SUBTÍTULO DE 13px.
export function Hero({ avatar, titulo, subtitulo, id }: { avatar: ReactNode; titulo: ReactNode; subtitulo?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {avatar}
      <div className="grid min-w-0 gap-1">
        <h1 id={id} className="t-hero [overflow-wrap:anywhere]">{titulo}</h1>
        {subtitulo && <p className="t-sec text-muted-foreground [overflow-wrap:anywhere]">{subtitulo}</p>}
      </div>
    </div>
  );
}

// MUESTRA LA IMAGEN SI EXISTE Y CARGA; SI NO, QUEDA EL TEXTO (UNA INICIAL).
export function Avatar({ texto, imagen, className }: { texto: ReactNode; imagen?: string; className?: string }) {
  // GUARDA LA URL QUE FALLÓ, ASÍ UNA IMAGEN NUEVA SE VUELVE A INTENTAR
  const [fallo, setFallo] = useState<string | null>(null);
  const conImagen = !!imagen && fallo !== imagen;
  return (
    <div aria-hidden="true"
      className={cn("flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-[22px] font-semibold text-primary select-none",
        conImagen ? "bg-white" : "bg-accent", className)}>
      {conImagen ? (
        <img src={imagen} alt="" referrerPolicy="no-referrer" className="size-full object-cover" onError={() => setFallo(imagen)} />
      ) : texto}
    </div>
  );
}

// SECCIÓN: ÍCONO EN BALDOSA DE 20px + ETIQUETA GRIS DE 13px, 8px ARRIBA DE SU CONTENIDO.
export function Seccion({ icono: Icono, titulo, accion, children, className }: {
  icono: LucideIcon; titulo: ReactNode; accion?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={cn("grid min-w-0 gap-2", className)}>
      <div className="flex min-h-5 items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground" aria-hidden="true">
          <Icono className="size-3.5" />
        </span>
        <h2 className="min-w-0 flex-1 t-sec font-medium text-muted-foreground">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

// BLOQUE INTERNO SUAVE (SIN BORDES DUROS).
export function Bloque({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("min-w-0 rounded-lg bg-muted/50 px-3 py-2.5", className)} {...props} />;
}

// FILA DE LISTA: ETIQUETA GRIS DE 12px SOBRE UN VALOR DE 14px.
export function Fila({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1 py-2 first:pt-0 last:pb-0">
      <span className="t-meta text-muted-foreground">{label}</span>
      <span className="t-body [overflow-wrap:anywhere]">{children}</span>
    </div>
  );
}

// BOTÓN SOLO ÍCONO DE 32px; LA ETIQUETA ES sr-only PARA QUE SU textContent SEA EL NOMBRE DE LA ACCIÓN.
export function BotonIcono({ icono: Icono, label, className, ...props }: ComponentProps<typeof Button> & { icono: LucideIcon; label: string }) {
  return (
    <Button variant="ghost" size="icon-sm" title={label} className={cn("text-muted-foreground", className)} {...props}>
      <Icono className="size-4" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

// BOTÓN "VOLVER" DE LAS SUBPANTALLAS
export function Volver({ onClick }: { onClick?: () => void }) {
  return (
    <Button variant="ghost" size="sm" aria-label="Volver" className="-ml-2 h-8 gap-1 px-2 t-sec text-muted-foreground has-[>svg]:px-2"
      onClick={onClick}>
      <ChevronLeft className="size-4" aria-hidden="true" />
      <span className="sr-only">← </span>Volver
    </Button>
  );
}

// CONTROL SEGMENTADO DE PESTAÑAS: PISTA GRIS, PESTAÑA ACTIVA BLANCA CON SOMBRA FINA.
export function Pestanas({ items }: { items: { value: string; label: string }[] }) {
  return (
    <TabsList className="h-9 w-full rounded-lg bg-muted p-1">
      {items.map((i) => (
        <TabsTrigger key={i.value} value={i.value}
          className="h-7 min-w-0 rounded-md px-2 t-sec font-medium text-muted-foreground shadow-none transition-[color,background-color,box-shadow] duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
          <span className="truncate">{i.label}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

// LOS PANELES DE PESTAÑA QUEDAN MONTADOS (forceMount) PARA CONSERVAR EDICIONES Y SCROLL; LOS INACTIVOS SE OCULTAN.
export const PANEL = "mt-5 grid min-w-0 content-start gap-5 data-[state=active]:animate-screen-in data-[state=inactive]:hidden motion-reduce:animate-none";
