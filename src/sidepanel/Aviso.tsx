// AVISO EN LÍNEA (INFO, ÉXITO, ADVERTENCIA, ERROR) REUTILIZADO POR TODAS LAS PANTALLAS.
import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Tipo = "info" | "success" | "warn" | "error";

// ÍCONO POR TIPO DE AVISO
const ICONO = {
  info: <Info className="text-primary" />,
  success: <CircleCheck className="text-success-foreground" />,
  warn: <TriangleAlert className="text-warning" />,
  error: <CircleAlert className="text-destructive" />,
};

// COLORES DE FONDO Y TEXTO POR TIPO DE AVISO
const FONDO: Record<Tipo, string> = {
  info: "bg-accent/60 text-foreground",
  success: "bg-success/10 text-success-foreground",
  warn: "bg-warning/8 text-foreground",
  error: "bg-destructive/6 text-destructive",
};

// AVISO FINO EN LÍNEA. LOS ERRORES USAN role="alert" (ASSERTIVE), EL RESTO role="status".
// CON busy MUESTRA UN SPINNER EN VEZ DEL ÍCONO DEL TIPO.
export function Aviso({ tipo, busy, children, className }: { tipo: Tipo; busy?: boolean; children: ReactNode; className?: string }) {
  return (
    <div role={tipo === "error" ? "alert" : "status"}
      className={cn("flex min-w-0 items-start gap-2 rounded-lg px-3 py-2.5 t-sec [&>svg]:mt-[3px] [&>svg]:size-3.5 [&>svg]:shrink-0", FONDO[tipo], className)}>
      {busy ? <LoaderCircle className="animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" /> : ICONO[tipo]}
      <div className="grid min-w-0 flex-1 justify-items-start gap-2 [overflow-wrap:anywhere]">{children}</div>
    </div>
  );
}
