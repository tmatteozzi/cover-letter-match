# Ficha para la Chrome Web Store

Textos para copiar y pegar en el [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). Las imágenes están en esta misma carpeta.

---

## 1. Paquete

- **Archivo a subir:** `cover-letter-match.zip` (en la raíz del proyecto; se genera con el comando del final).

---

## 2. Ficha de la tienda (Store listing)

**Idioma:** Español

**Nombre** (sale del manifest): Cover Letter Match

**Descripción breve** (sale del manifest, máx. 132 caracteres):

```
Escribe tu carta de presentación a partir de tu CV y la oferta que tenés abierta, con la IA local de Chrome.
```

**Categoría:** Productividad → Herramientas (o *Productivity*)

**Descripción detallada:** (sin listar marcas: Google la rechazó una vez por *keyword stuffing* al nombrar todos los sitios de empleo)

```
Cover Letter Match escribe una carta de presentación (o un mensaje corto para el reclutador) a partir de tu CV y de la oferta laboral que tenés abierta. Todo pasa en tu computadora: usa la IA integrada de Chrome (Gemini Nano), así que no necesitás clave de API, ni cuenta, ni tus datos salen de tu equipo.

CÓMO FUNCIONA
1. Subí tu CV en PDF una sola vez. La IA arma tu perfil automáticamente y lo revisás.
2. Abrí una oferta en tu sitio de empleo favorito.
3. Abrí el panel lateral y tocá "Generar carta". La carta se escribe en segundos, lista para editar y copiar.

QUÉ INCLUYE
• Lee solo la oferta que elegiste: aunque el sitio muestre otras ofertas al costado, en sugeridas o en un modal, la extensión toma únicamente la que tenés seleccionada.
• Cartas honestas: la IA solo puede mencionar tecnologías, idiomas y logros que están en tu perfil. Nunca inventa experiencia.
• Español o inglés: detecta el idioma de la oferta y, si una oferta en español pide inglés, te sugiere escribir la carta en inglés.
• Tono formal o cercano, y formato carta o mensaje corto.
• Coincidencias: qué tecnologías de la oferta están en tu CV y cuáles no.
• Historial de cartas por empresa, con buscador para copiarlas otra vez.
• Logo de la empresa de cada oferta.
• Botón "Recargar oferta" para sitios que abren otra oferta sin recargar la página.

PRIVACIDAD
• Tu CV, tu perfil y tus cartas se guardan solo en tu navegador.
• La IA corre en tu equipo: nada se envía a servidores.
• Sin cuentas, sin publicidad, sin analíticas.
• Podés borrar todo desde Perfil → Borrar mis datos.

REQUISITOS
• Google Chrome 138 o superior, de escritorio (Windows, macOS o Linux).
• Un equipo compatible con la IA integrada de Chrome (Gemini Nano): espacio libre en disco para el modelo (Chrome lo descarga la primera vez) y una placa de video con más de 4 GB de memoria, o 16 GB de RAM y 4 núcleos o más. Si tu equipo no es compatible, la extensión te lo avisa.
• Tu CV en PDF con texto seleccionable (o podés completar el perfil a mano).

Revisá siempre la carta antes de enviarla: la escribe un modelo de IA.

Proyecto independiente y de código abierto (licencia MIT). No está afiliado a Google ni a ningún sitio de empleo.
```

**Imágenes** (en esta carpeta):

| Campo | Archivo | Tamaño |
|---|---|---|
| Ícono de la tienda | `icono-128.png` | 128×128 |
| Captura 1 | `captura-1-carta.png` | 1280×800 |
| Captura 2 | `captura-2-coincidencias.png` | 1280×800 |
| Captura 3 | `captura-3-bienvenida.png` | 1280×800 |
| Captura 4 | `captura-4-historial.png` | 1280×800 |
| Mosaico promocional pequeño | `promo-440x280.png` | 440×280 |

**Sitio web (opcional):** `https://github.com/tmatteozzi/cover-letter-match`

**URL de asistencia (opcional):** `https://github.com/tmatteozzi/cover-letter-match/issues`

---

## 3. Prácticas de privacidad (Privacy practices)

**Propósito único:**

```
Lee la oferta laboral abierta en la pestaña y genera una carta de presentación basada en el CV del usuario, usando la IA local de Chrome.
```

**Justificación de permisos:**

| Permiso | Justificación |
|---|---|
| `sidePanel` | `La interfaz de la extensión se muestra en el panel lateral, al lado de la oferta laboral.` |
| `storage` | `Guarda localmente en el navegador el CV, el perfil, las preferencias y el historial de cartas del usuario. Nada se envía fuera del equipo.` |
| `activeTab` | `Permite leer la oferta de la pestaña actual cuando el usuario abre la extensión en un sitio de empleo que no está en la lista de sitios soportados.` |
| `scripting` | `Inyecta un script que extrae el puesto, la empresa, el logo y la descripción de la oferta seleccionada en la página, para escribir la carta.` |
| Permisos de host | `Acceso a LinkedIn, Computrabajo, Bumeran, ZonaJobs, Indeed, Seeds y Universia para volver a leer la oferta cuando el usuario cambia de aviso dentro del mismo sitio (por ejemplo, en un panel lateral o un modal), sin tener que volver a tocar el ícono. La página solo se lee cuando el usuario abre el panel o toca "Recargar oferta" / "Generar carta".` |

**¿Usás código remoto?** → **No, no uso código remoto.**

**Uso de datos** — marcá:

- ☑ **Información de identificación personal** (nombre, título, experiencia y otros datos del CV que sube el usuario).
- ☑ **Contenido del sitio web** (el texto de la oferta laboral que se lee de la página).

Aclaración (si el formulario la pide): `Los datos se procesan y guardan únicamente en el dispositivo del usuario (chrome.storage.local y la IA local Gemini Nano). No se transmiten a servidores del desarrollador ni a terceros.`

Certificá las tres declaraciones:

- ☑ No vendo ni transfiero datos de usuarios a terceros, fuera de los casos de uso aprobados.
- ☑ No uso ni transfiero datos de usuarios para fines no relacionados con el propósito único de mi elemento.
- ☑ No uso ni transfiero datos de usuarios para determinar la solvencia o con fines de préstamo.

**URL de la política de privacidad:**

```
https://github.com/tmatteozzi/cover-letter-match/blob/main/PRIVACY.md
```

(El repo tiene que ser **público** para que Google pueda abrir esa URL.)

---

## 4. Distribución

- **Visibilidad:** Pública (o *No listada* si querés compartirla solo con el link).
- **Regiones:** Todas (o solo los países de habla hispana).
- **Precio:** Gratis.

---

## Generar el `.zip`

```bash
cd /Users/tomasmatteozzi/Desktop/projects/coverlettermatch && npm run build && rm -f cover-letter-match.zip && cd dist && zip -r ../cover-letter-match.zip . -x ".DS_Store" && cd ..
```

Para publicar una actualización: subí `version` en `src/manifest.ts` (por ejemplo `0.1.1`), regenerá el `.zip` y subilo en **Paquete → Subir paquete nuevo**.
