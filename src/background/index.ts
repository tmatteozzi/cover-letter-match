// SERVICE WORKER: HACE QUE EL CLIC EN EL ÍCONO DE LA EXTENSIÓN ABRA EL PANEL LATERAL.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error(err));
