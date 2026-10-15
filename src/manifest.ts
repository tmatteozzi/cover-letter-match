// MANIFIESTO MV3 DE LA EXTENSIÓN (PANEL LATERAL, PERMISOS Y SITIOS DE EMPLEO SOPORTADOS).
import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Cover Letter Match",
  version: "0.1.0",
  description: "Escribe tu carta de presentación a partir de tu CV y la oferta que tenés abierta, con la IA local de Chrome.",
  // LAS APIs DE IA INTEGRADA (LanguageModel, LanguageDetector) REQUIEREN CHROME 138+
  minimum_chrome_version: "138",
  permissions: ["sidePanel", "storage", "activeTab", "scripting"],
  // UN PERMISO DE HOST POR CADA SITIO DE EMPLEO DONDE SE LEE LA OFERTA
  host_permissions: [
    "https://*.linkedin.com/*",
    "https://*.computrabajo.com/*",
    "https://www.bumeran.com.ar/*",
    "https://www.zonajobs.com.ar/*",
    "https://*.indeed.com/*",
    "https://jobs.weareseeds.com/*",
    "https://app.weareseeders.com/*",
    "https://www.universia.net/*",
  ],
  side_panel: { default_path: "src/sidepanel/index.html" },
  background: { service_worker: "src/background/index.ts", type: "module" },
  icons: {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png",
  },
  action: {
    default_title: "Cover Letter Match",
    default_icon: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png",
      128: "icons/icon-128.png",
    },
  },
});
