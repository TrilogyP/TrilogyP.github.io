const workflowViews = {
  overview: {
    phase: "Arbeitsbereich",
    title: "Die Übersicht hält Daten, Experimente und den nächsten Arbeitsschritt zusammen.",
    description: "Die Startansicht bündelt Datensätze, Experimente und zuletzt bearbeitete Analysen für einen direkten Einstieg in den nächsten Schritt.",
    evidence: "Übersicht: Arbeitsstatus und Einstieg in den Analysezyklus",
    image: "./assets/showcase-hero.png",
    alt: "Übersicht der aktuellen Plattform",
  },
  datasets: {
    phase: "Datenbasis",
    title: "Datensätze nach Rolle und Szenario prüfen.",
    description: "Der Katalog kennzeichnet Trainings-, Anwendungs- und Quelldaten nach Rolle und Szenario. Vorschau und Metadaten erleichtern die Auswahl.",
    evidence: "Datensätze: Rolle, Zielmerkmal, Szenario und Vorschau",
    image: "./assets/showcase-datasets.png",
    alt: "Datensatzkatalog der aktuellen Plattform",
  },
  fusion: {
    phase: "Datenaufbereitung",
    title: "Mehrere Quellen nachvollziehbar zu einem Bundle verbinden.",
    description: "Zeit und Gerätekennung verbinden klar benannte Quellen. Diagnose und Materialisierung machen daraus eine wiederverwendbare Trainingsgrundlage.",
    evidence: "Fusion: Quellen, Verbindungsschlüssel und erzeugtes Datenartefakt",
    image: "./assets/showcase-fusion.png",
    alt: "Fusion der aktuellen PM-Quellen in der Plattform",
  },
  etl: {
    phase: "ETL und Split",
    title: "Vor dem Training werden Qualität, Features und Zeitfenster sichtbar.",
    description: "Die Vorschau macht Datenqualität, vorbereitete Merkmale und die chronologische Aufteilung in Training, Validation und Test sichtbar.",
    evidence: "ETL: Datenqualität, Merkmalsbasis und 70/15/15-Aufteilung",
    image: "./assets/showcase-etl.png",
    alt: "ETL-Vorschau mit chronologischem Split",
  },
  training: {
    phase: "Training",
    title: "Das Szenario steuert Aufgabe, Zielspalte und Kandidaten.",
    description: "Szenario und Datenbasis bestimmen Zielmerkmal, Aufgabentyp und die passenden Modellkandidaten für den Vergleich.",
    evidence: "Training: Szenario, Datenbasis und ausgewählte Kandidaten",
    image: "./assets/showcase-training.png",
    alt: "Trainingseinstellungen der aktuellen Plattform",
  },
  monitoring: {
    phase: "Monitoring",
    title: "Historische Experimente bleiben als nachvollziehbare Läufe erhalten.",
    description: "Status, Zeitpunkt, Szenario und Hinweise machen abgeschlossene, laufende und fehlgeschlagene Analysen unterscheidbar.",
    evidence: "Monitoring: Status, Konfiguration, Ergebnisse und Berichte",
    image: "./assets/showcase-monitoring.png",
    alt: "Experimentmonitoring der aktuellen Plattform",
  },
  results: {
    phase: "Test-Evaluation",
    title: "Results erklärt ausschließlich den unabhängigen Test Holdout.",
    description: "Metriken, Datenaufteilung, Datenqualität, Feature-Importance und aufgabengerechte Diagnostik zeigen die Leistung auf dem unabhängigen Testbereich.",
    evidence: "Results: Testvorhersagen, Diagnostik und Evaluationsbericht",
    image: "./assets/showcase-results.png",
    alt: "Results mit Test-Holdout-Evaluation und Feature-Importance",
  },
  benchmark: {
    phase: "Benchmark und Veröffentlichung",
    title: "Validation bestimmt das Leitmodell, Veröffentlichung erzeugt die Anwendungsversion.",
    description: "Der Validation-Vergleich bestimmt das Leitmodell. Tier und Anwendungseignung ergänzen den Vergleich; die Veröffentlichung erzeugt eine nachvollziehbare Modellversion.",
    evidence: "Benchmark: Validation-Leistung, Tier, Leitmodell und Veröffentlichung",
    image: "./assets/showcase-benchmark.png",
    alt: "Benchmark mit Veröffentlichungssteuerung und Standardmodell",
  },
  application: {
    phase: "Anwendung",
    title: "Ein veröffentliches Modell verarbeitet einen neuen Batch nach bestandenem Preflight.",
    description: "Die Anwendung zeigt Modellversion, Eingabedaten, verwendete Regeln und Cold Starts. Neue Daten können auch ohne Zielwerte analysiert werden.",
    evidence: "Anwendung: Batch-Ergebnis, Ereignisse, Vorhersage-CSV und Bericht",
    image: "./assets/showcase-application-result.png",
    alt: "Anwendungsergebnis der aktuellen Plattform mit Provenienz und Handlungsfenstern",
  },
  matrix: {
    phase: "Modellübersicht",
    title: "Die Matrix beschreibt ausführbare Kandidaten, nicht Literaturbeweise.",
    description: "Sie zeigt Modellfamilie, Tier, Datenbedarf, Erklärbarkeit und Engineering-Aufwand. Tier beschreibt Einsatzbedingungen und keine Leistungsstufe.",
    evidence: "Matrix: verfügbare Modelle und ihre Anwendungsvoraussetzungen",
    image: "./assets/showcase-matrix.png",
    alt: "Algorithmus-Matrix der aktuellen Plattform",
  },
  research: {
    phase: "Forschungsscoping",
    title: "Literaturkontext verbindet Szenarien mit Methodenfamilien und verfügbaren Modellen.",
    description: "Der Bereich zeigt DOI-Quellen mit ihrem jeweiligen Geltungsbereich und ordnet sie den unterstützten Analyseaufgaben und Modellfamilien zu.",
    evidence: "Forschung: kuratierter Kontext für Szenarien, Aufgaben und Methoden",
    image: "./assets/showcase-research.png",
    alt: "Kuratiertes Forschungsscoping der aktuellen Plattform",
  },
};

const progressBar = document.querySelector(".scroll-progress");
const navLinks = Array.from(document.querySelectorAll(".nav-links a")).filter((link) => (link.getAttribute("href") || "").startsWith("#"));
const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);

function selectWorkflowView(key) {
  const view = workflowViews[key];
  if (!view) return;
  const browser = document.querySelector("[data-workflow-browser]");
  if (!browser) return;
  const image = browser.querySelector("[data-workflow-image]");
  const phase = browser.querySelector("[data-workflow-phase]");
  const title = browser.querySelector("[data-workflow-title]");
  const description = browser.querySelector("[data-workflow-description]");
  const evidence = browser.querySelector("[data-workflow-evidence]");
  const panel = browser.querySelector("[role='tabpanel']");
  if (image) { image.src = view.image; image.alt = view.alt; }
  if (phase) phase.textContent = view.phase;
  if (title) title.textContent = view.title;
  if (description) description.textContent = view.description;
  if (evidence) evidence.textContent = view.evidence;
  browser.querySelectorAll("[data-workflow]").forEach((button) => {
    const active = button.dataset.workflow === key;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
    button.setAttribute("tabindex", active ? "0" : "-1");
    if (active && panel) panel.setAttribute("aria-labelledby", button.id);
  });
}

const workflowButtons = Array.from(document.querySelectorAll("[data-workflow]"));
workflowButtons.forEach((button) => {
  button.addEventListener("click", () => selectWorkflowView(button.dataset.workflow));
  button.addEventListener("keydown", (event) => {
    const currentIndex = workflowButtons.indexOf(button);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % workflowButtons.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + workflowButtons.length) % workflowButtons.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = workflowButtons.length - 1;
    if (nextIndex === currentIndex) return;
    event.preventDefault();
    const nextButton = workflowButtons[nextIndex];
    selectWorkflowView(nextButton.dataset.workflow);
    nextButton.focus();
  });
});

function updateScrollState() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (progressBar) progressBar.style.width = `${Math.min(Math.max(window.scrollY / Math.max(maxScroll, 1), 0), 1) * 100}%`;
  const activeSection = sections.slice().reverse().find((section) => section.getBoundingClientRect().top <= 92);
  navLinks.forEach((link) => link.classList.toggle("active", Boolean(activeSection && document.querySelector(link.getAttribute("href")) === activeSection)));
}

const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); } }),
  { threshold: 0.08 }
);
document.querySelectorAll(".chapter, .hero-copy").forEach((element) => revealObserver.observe(element));
window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);
window.setTimeout(() => { document.querySelectorAll(".chapter, .hero-copy").forEach((element) => element.classList.add("is-visible")); updateScrollState(); }, 120);
