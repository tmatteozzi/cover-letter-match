# Política de privacidad — Cover Letter Match

*Última actualización: 15 de octubre de 2026*

Cover Letter Match es una extensión de Chrome que lee la oferta laboral abierta en tu navegador y escribe una carta de presentación a partir de tu CV. Está diseñada para que **tus datos nunca salgan de tu computadora**.

## Resumen

- **No recopilamos, enviamos ni vendemos ningún dato.** No hay servidores propios, cuentas, analíticas ni telemetría.
- **Todo se procesa en tu equipo**, con la IA integrada de Chrome (Gemini Nano), que funciona de forma local.
- **Podés borrar todo en cualquier momento** desde la extensión (**Perfil → Borrar mis datos**) o desinstalándola.

## Qué datos maneja la extensión

| Dato | Para qué se usa | Dónde se guarda |
|---|---|---|
| **Tu CV** (el texto del PDF que subís) | Armar tu perfil con la IA local | Solo en tu navegador (`chrome.storage.local`) |
| **Tu perfil** (nombre, título, experiencia, tecnologías, estudios, idiomas) | Escribir cartas que usen solo información real tuya | Solo en tu navegador |
| **La oferta laboral** (puesto, empresa, descripción y logo de la página abierta) | Adaptar la carta a esa oferta y mostrar las coincidencias | No se guarda; se lee cuando abrís el panel o tocás **Recargar oferta** / **Generar carta** |
| **Las cartas generadas** (historial) | Que puedas volver a verlas y copiarlas | Solo en tu navegador (máximo 100) |
| **Tus preferencias** (tono, formato, idioma) | Recordar tus opciones | Solo en tu navegador |

La extensión **no** lee tu historial de navegación, contraseñas, cookies, correos ni ninguna otra página que no sea la oferta que tenés abierta cuando usás la extensión.

## Procesamiento con IA

El resumen del CV y la redacción de las cartas usan la **Prompt API de Chrome con Gemini Nano**, un modelo que Chrome descarga y ejecuta **en tu propio equipo**. Ni tu CV ni las ofertas se envían a Google ni a ningún otro servicio para generar las cartas.

## Conexiones de red

La extensión no se conecta a servidores propios. Las únicas solicitudes de red son:

- **Logos de empresas:** el panel muestra el logo de la empresa cargándolo desde el mismo sitio de empleo donde está la oferta (la misma imagen que ya ves en esa página). La solicitud se hace sin enviar la dirección de la página de origen.
- **Modelo de IA:** si Gemini Nano no está instalado, Chrome lo descarga desde Google cuando tocás **Descargar modelo de IA**. Esa descarga la gestiona Chrome, no la extensión, y no incluye tus datos.

## Permisos y por qué se piden

- **`sidePanel`**: mostrar la interfaz en el panel lateral de Chrome.
- **`storage`**: guardar localmente tu CV, perfil, preferencias e historial.
- **`activeTab`** y **`scripting`**: leer la oferta de la pestaña actual cuando usás la extensión.
- **Acceso a LinkedIn, Computrabajo, Bumeran, ZonaJobs, Indeed, Seeds y Universia**: volver a leer la oferta cuando cambiás de aviso dentro de esos sitios (por ejemplo, en un panel o un modal) sin tener que volver a tocar el ícono. La página solo se lee cuando vos lo pedís.

## Compartir con terceros

No compartimos, vendemos ni transferimos datos a terceros, y no los usamos para publicidad, perfiles de usuario, evaluación crediticia ni ningún fin ajeno a la función de la extensión.

## Conservación y eliminación

Los datos quedan en tu navegador hasta que los borres. Podés eliminarlos:

- desde la extensión: **Perfil → Borrar mis datos**, o
- desinstalando la extensión desde `chrome://extensions` (Chrome borra su almacenamiento local).

## Menores de edad

La extensión no está dirigida a menores de 13 años y no recopila datos de forma consciente de ellos.

## Cambios en esta política

Si esta política cambia, se va a publicar la versión actualizada en este mismo archivo, con la fecha de la última actualización.

## Contacto

Para consultas sobre privacidad, abrí un *issue* en el repositorio del proyecto: <https://github.com/tmatteozzi/cover-letter-match/issues>.
