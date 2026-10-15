# Cover Letter Match

A **Chrome side-panel extension** that reads the job post you have open and writes a cover letter (or a short message to the recruiter) that matches it — using **only what's in your CV** and **Chrome's built-in AI (Gemini Nano)**, so nothing leaves your computer.

![platform](https://img.shields.io/badge/platform-Chrome%20138%2B-4285F4)
![manifest](https://img.shields.io/badge/Manifest-V3-blue)
![ai](https://img.shields.io/badge/AI-Gemini%20Nano%20(on--device)-8E44AD)
![stack](https://img.shields.io/badge/React%2019%20%2B%20TypeScript-shadcn%2Fui-black)
![license](https://img.shields.io/badge/license-MIT-green)

Upload your CV once, open a job post, click **Generar carta** — the letter streams into the panel, ready to edit and copy. **No API key, no backend, no account.**

> [!IMPORTANT]
> **Unofficial.** This is an independent project, not affiliated with or endorsed by Google, LinkedIn, Computrabajo, Bumeran, ZonaJobs, Indeed, Seeds or Universia. It reads the job post from the page you have open, the same way you see it. Letters are written by an AI model: **always review them before sending.**

---

## Features

- 📄 **One-time onboarding**: upload your CV as a **PDF** and the AI builds your profile automatically (name, title, years of experience, technologies, experience, projects, studies, languages). You review it once and save.
- 🔎 **Reads the job you selected — and only that one.** Each job board shows the post in a different component (side panel, modal, its own page), so each one has its own extractor that never mixes in the jobs listed around it:
  - **LinkedIn** — search list + detail pane, single job page, recommended jobs.
  - **Computrabajo** — side panel, bottom-sheet **modal** on narrow windows, job page.
  - **Bumeran / ZonaJobs** — job page (company and logo from the page's JSON-LD).
  - **Indeed** — search pane (`?vjk=`) and `/viewjob`.
  - **Seeds** — public portal (`/posicion/…`) and the **Seeds Platform** modal.
  - **Universia** — search pane and job page (description read from a shadow DOM).
  - **Any other site** — the page's `JobPosting` JSON-LD when present, otherwise the main page text.
- ✍️ **Streaming letter** in Spanish or English, with **tone** (formal / friendly) and **format** (letter / short message) options. The language is detected from the post, and if a Spanish post asks for English it suggests writing in English.
- 🛡️ **Honest by design**: the prompt only lets the model mention technologies, languages and achievements that are **in your profile**, and the panel warns about any leftover `[placeholder]`.
- 🧩 **Match indicator**: which technologies of the post are in your CV and which aren't (deterministic, no AI).
- 🏢 **Company logo** from the post (falls back to the company initial).
- 🔄 **Recargar oferta** button to re-read the page when a site opens a new job in a modal without reloading.
- 🗂️ **History** of generated letters grouped by company, with search, copy and delete.
- 🚫 Shows **"No hay una oferta en esta página"** instead of guessing on search pages, login walls or verification screens.

---

## Requirements

| Requirement | Notes |
|---|---|
| **Google Chrome 138 or later (desktop)** | Windows, macOS or Linux. Chrome's built-in AI isn't available on mobile. |
| **Gemini Nano** | Chrome downloads it the first time (the panel shows a **Descargar modelo de IA** button and a progress bar). Needs a few GB of free disk space. |
| **Node.js 20+ and npm** | Only to build the extension from source. |
| **Your CV as a PDF** | With selectable text (a scanned image won't work). You can also fill your profile by hand. |

---

## Install

```sh
git clone https://github.com/tmatteozzi/cover-letter-match.git
cd cover-letter-match
npm install
npm run build
```

Then load it in Chrome:

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `dist/` folder.
4. Pin **Cover Letter Match** from the puzzle-piece menu so the envelope icon stays in the toolbar.

---

## First run — set up your profile

1. Click the extension icon: the side panel opens on the welcome screen.
2. If it says the model is missing, click **Descargar modelo de IA** and wait for the download.
3. Click **Elegir archivo PDF** and pick your CV. The text is read locally and summarized by Gemini Nano (**about 1–2 minutes** for a long CV).
4. Review the profile it fills in (**Datos** / **Experiencia**) and click **Guardar y empezar**.

You can edit the profile or upload a new CV later from **Perfil**.

---

## Controls

| Action | Result |
|---|---|
| Click the **toolbar icon** | Open the side panel |
| **Generar carta** | Write a letter for the job open in the current tab |
| **Recargar oferta** (header) | Re-read the job from the page (e.g. after opening another job in a modal) |
| **Tono / Formato / Idioma** | Formal or friendly · letter or short message · auto, Spanish or English (saved as preferences) |
| Copy icon on the letter | Copy the (edited) letter to the clipboard |
| ↻ icon on the letter | Generate another version |
| **Historial** (header) | Past letters by company |
| **Perfil** (header) | Edit your profile, upload a new CV, or **Borrar mis datos** |

---

## How it works

```
.
├── README.md
├── LICENSE
├── plan.md                      Roadmap (V1 / V2 / V3)
├── package.json
├── vite.config.ts               Vite + @crxjs (MV3) + Tailwind v4
├── vitest.config.ts
├── tsconfig.json
├── components.json              shadcn/ui config
├── public/icons/                Extension icons (16 / 32 / 48 / 128)
├── .github/workflows/ci.yml     Typecheck + tests + build on every push
├── src/
│   ├── manifest.ts              Manifest V3 (side panel, permissions, job-board hosts)
│   ├── background/index.ts      Opens the side panel when the icon is clicked
│   ├── extractors/              Reads the selected job from the page (injected with chrome.scripting)
│   │   ├── index.ts             Picks the site extractor, retries late content, falls back to generic
│   │   ├── linkedin.ts · computrabajo.ts · bumeran.ts · indeed.ts · seeds.ts · universia.ts
│   │   ├── generic.ts           JSON-LD JobPosting or main page text
│   │   └── esOferta.ts          "Is this actually a job post?" (URL rules + text heuristic)
│   ├── ai/                      Gemini Nano: availability, CV → profile (JSON), letter (streaming),
│   │                            language detection, prompts
│   ├── pdf/extractText.ts       PDF → text with pdf.js (worker bundled in the extension)
│   ├── match.ts                 Technologies in the post vs. in your CV
│   ├── historial/ · storage/    chrome.storage.local helpers
│   ├── components/ui/           shadcn/ui components
│   └── sidepanel/               React UI: onboarding, letter, profile, history
└── tests/                       Vitest (extractor fixtures mirror each job board's real DOM)
```

When you open the panel (or click **Recargar oferta**), the extension injects the right extractor into the active tab with `chrome.scripting.executeScript`. It returns only the selected job's title, company, logo and description. The panel then sends your saved profile plus that description to **Gemini Nano** through Chrome's Prompt API and streams the letter back.

---

## Privacy & security

- **Everything runs on your machine.** Your CV, profile, letters and history are stored only in `chrome.storage.local`, and the AI is Chrome's **on-device** Gemini Nano. There's no backend and no analytics or telemetry.
- The extension reads a page **only when you open the panel or click Recargar oferta / Generar carta**.
- Permissions:
  - `sidePanel` — the UI.
  - `storage` — your local data.
  - `activeTab` + `scripting` — read the job post in the tab you're on.
  - **host permissions** for the supported job boards — so the panel can re-read a post after you move to another job without clicking the icon again. On other sites, click the icon on the post.
- The company logo is loaded directly from the job board's own image server (the same image you already see on the page).
- **Borrar mis datos** (in Perfil) wipes everything the extension stored.
- Full privacy policy: [PRIVACY.md](PRIVACY.md).

---

## Development

```sh
npm run dev         # Vite dev build with hot reload (load dist/ unpacked)
npm test            # Unit + UI tests (Vitest, happy-dom)
npm run typecheck   # tsc --noEmit
npm run build       # Typecheck + production build into dist/
```

CI (GitHub Actions) runs the typecheck, tests and build on every push.

---

## Updating

Pull the latest code, rebuild, and reload the extension:

```sh
git pull
npm install
npm run build
```

Then click **↻** on Cover Letter Match in `chrome://extensions`. If new job boards were added, Chrome asks you to accept the new permissions.

---

## Uninstall

1. *(Optional)* In the panel: **Perfil → Borrar mis datos**.
2. In `chrome://extensions`, click **Remove** on Cover Letter Match. Chrome deletes the extension and its local storage.

---

## Troubleshooting

- **"La IA local no está disponible en este equipo".** Chrome's built-in AI needs a desktop Chrome 138+ on supported hardware with enough free disk space. Check `chrome://on-device-internals` for the model status.
- **The CV summary takes a while.** Gemini Nano runs on your machine; a long CV can take 1–2 minutes. It only happens once.
- **"El PDF no tiene texto seleccionable".** The PDF is a scanned image. Export your CV again as a text PDF, or use **Completar perfil a mano**.
- **"No hay una oferta en esta página".** Open a single job post (or select one in the search list). On sites outside the supported list, click the extension icon on the post so Chrome grants access to that tab.
- **The panel shows the previous job.** Some sites open a new job in a modal without reloading the page — click **Recargar oferta** in the header.
- **Indeed shows "Security Check" / LinkedIn asks you to sign in.** The extension can't read verification or login walls; it shows "No hay oferta" until the real post is on screen.

---

## Limitations

- Job boards change their HTML without notice. Every extractor has fallbacks (title, JSON-LD, generic text), but a site redesign can still break reading until the extractor is updated.
- Gemini Nano is a small model: letters in English can occasionally keep a Spanish term from your profile, and a placeholder can slip through (the panel warns about it). Review before sending.
- Requires desktop Chrome with built-in AI; other browsers aren't supported.

---

## License

Released under the **MIT License** — see [LICENSE](LICENSE).

---

*Chrome and Gemini are trademarks of Google LLC. LinkedIn, Computrabajo, Bumeran, ZonaJobs, Indeed, Seeds and Universia are trademarks of their respective owners. This project is independent and unofficial.*
