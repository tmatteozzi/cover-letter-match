// HOOK QUE VIGILA LA DISPONIBILIDAD DE LA IA LOCAL (GEMINI NANO) Y DEVUELVE LOS AVISOS A MOSTRAR.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import { descargarModelo, nanoDisponible, type EstadoIA } from "../ai/availability";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Aviso } from "./Aviso";

// ESTADO DE LA IA LOCAL (GEMINI NANO). SI ESTÁ LISTA NO MUESTRA NADA: SOLO PROBLEMAS O ACCIONES NECESARIAS.
// NOTIFICA EL ESTADO AL PADRE POR onEstado.
export function useAiStatus(onEstado: (e: EstadoIA) => void): { avisos: ReactNode } {
  const [estado, setEstado] = useState<EstadoIA | null>(null);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [error, setError] = useState("");

  // VUELVE A CONSULTAR LA DISPONIBILIDAD Y PROPAGA EL RESULTADO
  const chequear = useCallback(async () => {
    const e = await nanoDisponible();
    setEstado(e);
    onEstado(e);
    return e;
  }, [onEstado]);

  // DESCARGA EL MODELO CON PROGRESO (0 A 1) Y AL FINAL RE-CHEQUEA EL ESTADO
  const descargar = useCallback(async () => {
    setError("");
    setProgreso(0);
    try {
      await descargarModelo(setProgreso);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar el modelo.");
    }
    setProgreso(null);
    await chequear();
  }, [chequear]);

  // CHEQUEO INICIAL; SI CHROME YA ESTÁ DESCARGANDO EL MODELO, SE ENGANCHA AL PROGRESO
  useEffect(() => {
    let cancel = false;
    nanoDisponible().then((e) => {
      if (cancel) return;
      setEstado(e);
      onEstado(e);
      if (e === "downloading") void descargar();
    });
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!estado || estado === "available") return { avisos: error ? <Aviso tipo="error">{error}</Aviso> : null };

  // BARRA DE PROGRESO DE DESCARGA (SOLO SI HAY UNA EN CURSO)
  const barra = progreso !== null && (
    <div className="grid w-full gap-1">
      <Progress className="h-1" value={Math.round(progreso * 100)} aria-label="Progreso de descarga del modelo" />
      <span className="t-meta text-muted-foreground">{Math.round(progreso * 100)}%</span>
    </div>
  );

  const avisos = (
    <>
      {(estado === "no-soportado" || estado === "unavailable") && (
        <Aviso tipo="error">
          {estado === "no-soportado"
            ? "Tu navegador no soporta la IA local de Chrome. Necesitás Chrome 138 o superior en una compu de escritorio."
            : "Gemini Nano no está disponible en este equipo (revisá requisitos de hardware y espacio en disco)."}
        </Aviso>
      )}
      {estado === "downloadable" && (
        <Aviso tipo="warn">
          <p>Falta descargar el modelo de IA local (Gemini Nano) para poder usar la extensión.</p>
          {progreso === null && (
            <Button size="sm" variant="outline" className="h-8 bg-background t-sec" onClick={descargar}><Download aria-hidden="true" />Descargar modelo de IA</Button>
          )}
          {barra}
        </Aviso>
      )}
      {estado === "downloading" && (
        <Aviso tipo="info" busy>
          <p>Descargando el modelo de IA, puede tardar unos minutos.</p>
          {barra}
        </Aviso>
      )}
      {error && <Aviso tipo="error">{error}</Aviso>}
    </>
  );

  return { avisos };
}
