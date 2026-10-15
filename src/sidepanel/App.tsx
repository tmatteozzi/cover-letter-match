// COMPONENTE RAÍZ DEL SIDE PANEL: ELIGE LA PANTALLA SEGÚN EL PERFIL Y LA NAVEGACIÓN, Y MUESTRA AVISOS DE IA.
import { useCallback, useEffect, useState } from "react";
import { History, RotateCw, User, type LucideIcon } from "lucide-react";
import type { Perfil } from "../types";
import type { EstadoIA } from "../ai/availability";
import { getPerfil } from "../storage";
import { Button } from "@/components/ui/button";
import { useAiStatus } from "./AiStatus";
import CvScreen from "./screens/CvScreen";
import LetterScreen from "./screens/LetterScreen";
import HistoryScreen from "./screens/HistoryScreen";

type Pantalla = "cargando" | "onboarding" | "perfil" | "historial" | "carta";
type Sub = null | "perfil" | "historial";

export default function App() {
  // undefined = TODAVÍA CARGANDO DEL STORAGE; null = AÚN NO HAY PERFIL (ONBOARDING)
  const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined);
  const [sub, setSub] = useState<Sub>(null);
  const [estadoIA, setEstadoIA] = useState<EstadoIA | null>(null);
  // SE INCREMENTA CUANDO EL USUARIO PIDE VOLVER A LEER LA OFERTA DE LA PÁGINA
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    getPerfil().then(setPerfil);
  }, []);

  const iaLista = estadoIA === "available";
  const nanoImposible = estadoIA === "no-soportado" || estadoIA === "unavailable";

  // CALLBACKS DE LAS PANTALLAS DE PERFIL: GUARDADO, BORRADO Y VOLVER
  const guardado = (p: Perfil) => {
    setPerfil(p);
    setSub(null);
  };
  const borrado = () => {
    setPerfil(null);
    setSub(null);
  };
  const volver = () => setSub(null);
  const onEstado = useCallback((e: EstadoIA) => setEstadoIA(e), []);
  const ia = useAiStatus(onEstado);

  // PANTALLA ACTIVA: SIN PERFIL = ONBOARDING; CON PERFIL = SUBPANTALLA ELEGIDA O LA CARTA
  const pantalla: Pantalla =
    perfil === undefined ? "cargando" : perfil === null ? "onboarding" : sub ?? "carta";

  // AL CAMBIAR DE PANTALLA VUELVE ARRIBA DE TODO
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pantalla]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col bg-background">
      {/* RECARGAR A LA IZQUIERDA, HISTORIAL/PERFIL A LA DERECHA; LAS DEMÁS PANTALLAS TIENEN SU "Volver" */}
      {pantalla === "carta" && (
        <header className="sticky top-0 z-20 flex h-11 shrink-0 items-center justify-between border-b bg-background px-4">
          {/* SITIOS COMO Computrabajo O Seeds ABREN LA OFERTA EN UN MODAL SIN RECARGAR: SE RELEE A PEDIDO */}
          <Button variant="ghost" size="sm" className="-ml-2 h-8 gap-1.5 px-2 t-sec text-muted-foreground" title="Volver a leer la oferta de la página"
            onClick={() => setRecarga((n) => n + 1)}>
            <RotateCw className="size-4" aria-hidden="true" />Recargar oferta
          </Button>
          <nav className="-mr-1 flex items-center gap-1" aria-label="Secciones">
            <HeaderBtn label="Historial" icono={History} onClick={() => setSub("historial")} />
            <HeaderBtn label="Perfil" titulo="Editar tu perfil y CV" icono={User} onClick={() => setSub("perfil")} />
          </nav>
        </header>
      )}
      {ia.avisos && <div className="grid gap-2 px-4 pt-3 empty:hidden">{ia.avisos}</div>}
      {pantalla !== "cargando" && (
        <main key={pantalla} className="flex min-w-0 flex-1 flex-col animate-screen-in motion-reduce:animate-none">
          {pantalla === "onboarding" ? (
            <CvScreen onboarding iaLista={iaLista} nanoImposible={nanoImposible} onPerfilSaved={guardado} onCleared={borrado} />
          ) : pantalla === "perfil" ? (
            <CvScreen iaLista={iaLista} nanoImposible={nanoImposible} onPerfilSaved={guardado} onCleared={borrado} onBack={volver} />
          ) : pantalla === "historial" ? (
            <HistoryScreen onBack={volver} />
          ) : (
            <LetterScreen perfil={perfil!} iaLista={iaLista} recarga={recarga} />
          )}
        </main>
      )}
    </div>
  );
}

// ACCIÓN DE CABECERA SOLO ÍCONO (32px, ÍCONO 18px). EL TEXTO sr-only CONSERVA "Historial" / "Perfil".
function HeaderBtn({ label, titulo, icono: Icono, onClick }: { label: string; titulo?: string; icono: LucideIcon; onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label} title={titulo ?? label} onClick={onClick} className="text-muted-foreground">
      <Icono className="size-[18px]" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
