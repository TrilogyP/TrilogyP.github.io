const susItems = [
  "Ich denke, dass ich diese Plattform gerne häufig benutzen würde.",
  "Ich fand die Komplexität der Plattform angemessen.",
  "Ich fand diese Plattform einfach zu benutzen.",
  "Ich glaube, dass ich diese Plattform ohne Unterstützung einer technisch versierten Person benutzen könnte.",
  "Ich fand, die verschiedenen Funktionen in dieser Plattform waren gut integriert.",
  "Ich denke, bei dieser Plattform passt alles zusammen.",
  "Ich kann mir vorstellen, dass die meisten Menschen den Umgang mit dieser Plattform sehr schnell lernen.",
  "Ich fand die Benutzung der Plattform intuitiv verständlich.",
  "Ich fühlte mich bei der Benutzung der Plattform sehr sicher.",
  "Ich konnte, ohne viel zu lernen, mit der Benutzung der Plattform beginnen.",
];

const projectItems = [
  "Ich konnte den Ablauf von der Datensatzauswahl bis zu den getrennten Exporten verstehen.",
  "Die Begriffe in der Oberfläche, einschließlich Leitmodell, Tier und Anwendung, waren verständlich.",
  "Die ETL-Vorschau half mir, Datenqualität und den chronologischen 70/15/15-Split einzuschätzen.",
  "Im Benchmark konnte ich erkennen, dass die Validation-Hauptmetrik das Leitmodell bestimmt.",
  "Ich konnte Results als Test-Holdout-Evaluation von der Auswertung eines neuen Batches in Anwendung unterscheiden.",
  "Ich konnte ein Leitmodell oder einen zugelassenen Tier-Sieger veröffentlichen.",
  "Die aktive Standardversion des Modells war leicht zu erkennen.",
  "Der Preflight zeigte mir, ob der neue Batch zum gewählten Modell und Szenario passt.",
  "Die szenariospezifischen Diagramme halfen mir, den neuen Batch zu interpretieren.",
  "Ich konnte nachvollziehen, wie die Regeln im Anwendungslauf zu Handlungsfenstern führen.",
  "Bei jedem Anwendungsergebnis konnte ich Modellversion, Eingabedatensatz und verwendete Regeln erkennen.",
  "Die Exporte für Test-Evaluation und Anwendung waren klar benannt und ihrem jeweiligen Zweck leicht zuzuordnen.",
  "Die Oberfläche zeigte mir, welcher Schritt als Nächstes sinnvoll ist.",
  "Die Fehlermeldungen zeigten mir, welche Daten oder Einstellungen ungeeignet waren.",
];

const progressBar = document.querySelector(".scroll-progress");

function renderQuestions(containerId, instrument, items) {
  const container = document.querySelector(containerId);
  if (!container) return;

  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "question-row";

    const questionLabel = document.createElement("p");
    questionLabel.className = "question-label";
    questionLabel.id = `${instrument}-question-${index + 1}`;
    const itemNumber = document.createElement("span");
    itemNumber.className = "question-index";
    itemNumber.textContent = String(index + 1).padStart(2, "0");
    const itemText = document.createElement("span");
    itemText.textContent = item;
    questionLabel.append(itemNumber, itemText);

    const ratings = document.createElement("div");
    ratings.className = "rating-group";
    ratings.setAttribute("role", "radiogroup");
    ratings.setAttribute("aria-labelledby", questionLabel.id);

    for (let value = 1; value <= 5; value += 1) {
      const label = document.createElement("label");
      label.className = "rating-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `${instrument}_${index + 1}`;
      input.value = String(value);
      const visibleValue = document.createElement("span");
      visibleValue.textContent = String(value);
      label.append(input, visibleValue);
      ratings.append(label);
    }

    row.append(questionLabel, ratings);
    container.append(row);
  });
}

function updateProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  if (progressBar) {
    progressBar.style.width = `${Math.min(Math.max(progress, 0), 1) * 100}%`;
  }
}

renderQuestions("#sus-questions", "sus", susItems);
renderQuestions("#project-questions", "project", projectItems);

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();
