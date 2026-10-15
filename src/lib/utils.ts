// UTILIDADES COMPARTIDAS DE LA UI.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// COMBINA CLASES CONDICIONALES (clsx) Y RESUELVE CONFLICTOS DE TAILWIND (twMerge)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
