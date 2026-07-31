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
  "Ich konnte den vollständigen Ablauf von der Datensatzauswahl bis zum getrennten Export ohne zusätzliche Codeeinsicht nachvollziehen.",
  "Die Begriffe in der Oberfläche, einschließlich Leitmodell, Tier und Anwendung, waren verständlich.",
  "Die ETL-Vorschau half mir, Datenqualität und den chronologischen 70/15/15-Split einzuschätzen.",
  "Im Benchmark war nachvollziehbar, wie das Leitmodell über die Validation-Hauptmetrik bestimmt wird.",
  "Die Trennung zwischen Results als Test-Holdout-Evaluation und Anwendung als Analyse eines neuen Batches war verständlich.",
  "Ich konnte nachvollziehen, wie ein Leitmodell oder zugelassener Tier-Sieger ausdrücklich veröffentlicht wird.",
  "Die aktuell als Standard aktivierte Modellversion war eindeutig erkennbar.",
  "Der Preflight erklärte verständlich, ob ein neuer Batch mit dem gewählten Modell und Szenario kompatibel ist.",
  "Die szenariospezifischen Diagramme der Anwendung unterstützten die Interpretation des neuen Batches.",
  "Die Regeln und daraus abgeleiteten Handlungsfenster waren im Anwendungslauf nachvollziehbar.",
  "Ich konnte ein Anwendungsergebnis auf Modellversion, Eingabedatensatz und Regelsnapshot zurückführen.",
  "Die getrennten Exporte für Test-Evaluation und Anwendung waren klar benannt und für ihren jeweiligen Zweck verständlich.",
  "Die Oberfläche machte deutlich, welcher Schritt als nächstes sinnvoll ist.",
  "Die Fehlermeldungen halfen mir, unpassende Daten oder Einstellungen zu erkennen.",
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
