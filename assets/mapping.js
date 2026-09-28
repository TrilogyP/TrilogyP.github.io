/* The graph is a view of explicit coding, never an inference or clustering model. */
(() => {
  "use strict";
  const data = window.CEAH_MAPPING;
  if (!data) return;
  const $ = (id) => document.getElementById(id);
  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const scopes = { scenario_context: "Szenariokontext", method_family: "Methodenfamilie", model_specific: "Modellspezifisch" };
  const checks = { bibliographic_record: "Titel / Metadaten", deposited_abstract: "Hinterlegter Verlags-Abstract", publisher_abstract: "Verlags-Abstract", publisher_preview: "Verlagsvorschau", author_abstract: "Autoren-Abstract", full_text_excerpt: "Volltextabschnitte" };
  const levels = { low: "niedrig", medium: "mittel", high: "hoch" };
  const tiers = { baseline: "Baseline · Referenz", recommended: "Recommended · Standardkandidat", specialized: "Specialized · spezifische Bedingungen" };
  const scenarioNames = { PM: "Restlebensdauer", CM: "Maschinenzustand", AD: "Anomaliescore", EO: "Effizienzbewertung" };
  const state = { mode: "literature" };
  const scenario = $("scenario-filter");
  const family = $("family-filter");
  const decision = $("decision-filter");
  const search = $("mapping-search");
  const svg = $("mapping-network");
  const ns = "http://www.w3.org/2000/svg";

  Object.entries(data.counts).forEach(([key, value]) => document.querySelectorAll(`[data-count='${key}']`).forEach((el) => { el.textContent = value; }));
  Object.entries(data.families).forEach(([key, value]) => family.add(new Option(value, key)));

  function selectedRecords() {
    const query = search.value.trim().toLocaleLowerCase();
    return data.records.filter((r) =>
      (decision.value === "all" || r.origin === decision.value || r.research_role === decision.value) &&
      (!scenario.value || r.scenarios.includes(scenario.value)) &&
      (!family.value || r.families.includes(family.value)) &&
      (!query || [r.id, r.title, r.doi, r.algorithm_terms.join(" "), r.evidence_note].join(" ").toLocaleLowerCase().includes(query))
    );
  }

  function selectedModels() {
    const query = search.value.trim().toLocaleLowerCase();
    return data.platform.flatMap((s) => s.candidates.map((m) => ({ ...m, scenario: s.code, target: s.target }))).filter((r) =>
      (!scenario.value || r.scenario === scenario.value) &&
      (!family.value || r.family_id === family.value) &&
      (!query || [r.model_label, r.model_key, r.scenario, r.family, r.fit_level].join(" ").toLocaleLowerCase().includes(query))
    );
  }

  function el(name, attrs = {}, text = "") {
    const node = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (text) node.textContent = text;
    return node;
  }

  function nodeAt(x, y, label, kind, key, selected, subtitle = "", compact = false) {
    const group = el("g", { class: "network-node", role: "button", tabindex: "0", "aria-label": `${label}: Filter umschalten`, "aria-pressed": String(selected), style: "cursor:pointer" });
    group.append(el("circle", { cx: x, cy: y, r: kind === "scenario" ? (compact ? 23 : 30) : (compact ? 6 : 13), fill: selected ? "#e0ad61" : kind === "scenario" ? "#a2ddc9" : "#7cb6d0", stroke: selected ? "#fff1cc" : "#b8e5ed", "stroke-width": selected ? 3 : 1 }));
    group.append(el("text", { x: kind === "scenario" ? x : x + (compact ? 14 : 24), y: y + 5, fill: kind === "scenario" ? "#152f34" : "#e5f2f2", "text-anchor": kind === "scenario" ? "middle" : "start", "font-size": compact ? 13 : kind === "scenario" ? 16 : 17, "font-weight": 650 }, label));
    if (subtitle) group.append(el("text", { x, y: y + (compact ? 43 : 53), fill: "#d4e8e6", "text-anchor": "middle", "font-size": compact ? 11 : 14 }, subtitle));
    const action = () => {
      const control = kind === "scenario" ? scenario : family;
      control.value = control.value === key ? "" : key;
      render();
      // Preserve keyboard focus after replacing the SVG tree.
      svg.querySelector(`[data-node='${kind}-${key}']`)?.focus();
    };
    group.dataset.node = `${kind}-${key}`;
    group.addEventListener("click", action);
    group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); action(); } });
    return group;
  }

  function drawNetwork(rows) {
    const compact = window.innerWidth <= 640;
    svg.setAttribute("viewBox", compact ? "0 0 400 620" : "0 0 960 570");
    svg.replaceChildren(el("title", { id: "network-title" }, state.mode === "literature" ? "Codierte Literaturbeziehungen" : "Ausführbare Modellbeziehungen"), el("desc", { id: "network-description" }, "Methodenfamilien links, Szenarien rechts. Knoten filtern die darunter stehende Tabelle. Positionen sind Layout, keine semantischen Abstände."));
    svg.append(el("rect", { width: compact ? 400 : 960, height: compact ? 620 : 570, rx: 8, fill: "#13272f" }));
    const edges = new Map();
    rows.forEach((row) => {
      const families = state.mode === "literature" ? row.families : [row.family_id];
      const scenarios = state.mode === "literature" ? row.scenarios : [row.scenario];
      families.filter((f) => !family.value || f === family.value).forEach((f) => scenarios.filter((s) => !scenario.value || s === scenario.value).forEach((s) => {
        const key = `${f}:${s}`;
        if (!edges.has(key)) edges.set(key, { family: f, scenario: s, ids: new Set() });
        edges.get(key).ids.add(state.mode === "literature" ? row.id : row.model_key);
      }));
    });
    const families = [...new Set([...edges.values()].map((e) => e.family))];
    const positions = new Map();
    const gap = Math.min(69, 390 / Math.max(families.length - 1, 1));
    families.forEach((f, i) => positions.set(f, { x: compact ? 20 : 75 + 30 * Math.sin(i * 0.9), y: 290 + (i - (families.length - 1) / 2) * gap }));
    const scenarios = compact
      ? { PM: { x: 325, y: 110 }, CM: { x: 325, y: 240 }, AD: { x: 325, y: 370 }, EO: { x: 325, y: 500 } }
      : { PM: { x: 685, y: 120 }, CM: { x: 825, y: 230 }, AD: { x: 825, y: 365 }, EO: { x: 685, y: 465 } };
    svg.append(el("text", { x: compact ? 20 : 65, y: 42, fill: "#a8cbc9", "font-size": compact ? 11 : 13, "letter-spacing": compact ? 0 : 2 }, "METHODENFAMILIEN"));
    svg.append(el("text", { x: compact ? 282 : 678, y: 42, fill: "#a8cbc9", "font-size": compact ? 11 : 13, "letter-spacing": compact ? 0 : 2 }, compact ? "SZENARIEN" : "PLATTFORMAUFGABEN"));
    for (const edge of edges.values()) {
      const from = positions.get(edge.family), to = scenarios[edge.scenario];
      const path = el("path", { d: compact ? `M 210 ${from.y} C 245 ${from.y}, 265 ${to.y}, ${to.x - 26} ${to.y}` : `M ${from.x + 255} ${from.y} C 455 ${from.y}, 560 ${to.y}, ${to.x - 34} ${to.y}`, fill: "none", stroke: state.mode === "literature" ? "#6dafa6" : "#81acd1", "stroke-opacity": .52, "stroke-width": 1.5 });
      path.append(el("title", {}, `${data.families[edge.family]} → ${edge.scenario}: ${edge.ids.size} ${state.mode === "literature" ? "Quelle(n)" : "Kandidat(en)"} · ${[...edge.ids].join(", ")}`));
      svg.append(path);
    }
    families.forEach((f) => { const p = positions.get(f); svg.append(nodeAt(p.x, p.y, data.families[f], "family", f, family.value === f, "", compact)); });
    Object.entries(scenarios).forEach(([key, pos]) => svg.append(nodeAt(pos.x, pos.y, key, "scenario", key, scenario.value === key, scenarioNames[key], compact)));
    if (!edges.size) svg.append(el("text", { x: compact ? 20 : 80, y: 280, fill: "#d8e9ea", "font-size": compact ? 12 : 19 }, compact ? "Keine Beziehung in dieser Auswahl." : "Keine Beziehung für diese Auswahl."));
    svg.append(el("text", { x: compact ? 20 : 65, y: compact ? 585 : 550, fill: "#a8cbc9", "font-size": 12 }, compact ? `CEAH · Layout ≠ Clustering` : `CEAH · Layout ≠ Clustering · ${state.mode === "literature" ? "Quellengestützte Einordnung, keine Modellwertung" : "Aktuelle Modellregistrierung, keine Literaturwertung"}`));
    $("graph-summary").textContent = `${rows.length} ${state.mode === "literature" ? "Literaturdatensätze" : "Szenario-Kandidaten-Zuordnungen"} · ${edges.size} Familien-Szenario-Verbindungen`;
  }

  function table(rows) {
    const literature = state.mode === "literature";
    $("records-title").textContent = literature ? "Evidenztabelle" : "Aktuelle Modellkandidaten";
    $("record-count").textContent = `${rows.length} Treffer · ${literature ? "Jede Quelle mit Rolle, Herkunft und Grenze" : "Direkt aus dem aktiven Register erzeugt; gemeinsame Schlüssel können in mehreren Szenarien stehen"}`;
    if (!rows.length) {
      $("mapping-table").innerHTML = '<p class="mapping-empty">Keine Einträge für diese Auswahl. Filter zurücksetzen oder eine andere Aufgabe wählen.</p>';
      return;
    }
    const headers = literature ? ["Quelle / Herkunft", "Entscheidung / Beziehung", "Begründung / Grenze"] : ["Modell / Szenario", "Familie / Verwendung", "Voraussetzungen / Aufwand"];
    const body = rows.map((r) => {
      let cells;
      if (literature) {
        cells = [
          `<small>${escape(r.id)} · ${escape(r.year)} · ${escape(r.authors)}</small><a class="record-title" href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${escape(r.title)}</a><small>${escape(r.doi)}</small>`,
          `<span class="record-badge">${scopes[r.evidence_scope]}</span><p>${escape(r.scenarios.join(" · ") || "Literaturanalyse · ohne Szenariokante")}</p><small>${escape(r.algorithm_terms.join(" · "))}</small>`,
          `${escape(r.evidence_note)}<small>Geprüft: ${escape(checks[r.verification_status])}</small><a href="${escape(r.source_url)}" target="_blank" rel="noopener noreferrer">Geprüfte Fundstelle ↗</a>`,
        ];
      } else {
        cells = [
          `<strong>${escape(r.model_label)}</strong><small>${escape(r.model_key)}</small><p>${escape(r.scenario)} · ${escape(r.target)}</p>`,
          `${escape(data.families[r.family_id])}<p class="record-badge">${escape(tiers[r.fit_level] || r.fit_level)}</p><small>Tier beschreibt Einsatzbedingungen, keine Leistungsstufe.</small>`,
          `Datenbedarf: ${escape(levels[r.data_requirement] || r.data_requirement)}<p>${escape(r.tier_rationale)}</p><small>Komplexität: ${escape(levels[r.complexity] || r.complexity)} · Erklärbarkeit: ${escape(levels[r.explainability] || r.explainability)}</small>`,
        ];
      }
      return `<tr>${cells.map((cell, i) => `<td data-label="${headers[i]}">${cell}</td>`).join("")}</tr>`;
    }).join("");
    $("mapping-table").innerHTML = `<table class="mapping-table"><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>`;
  }

  function render() {
    const rows = state.mode === "literature" ? selectedRecords() : selectedModels();
    decision.disabled = state.mode !== "literature";
    $("mapping-gap").textContent = state.mode === "literature"
      ? "17 zusammengeführte Quellen: neun bestehende und acht Ergänzungen. Die Methodikquelle hat keine Szenariokante. Kanten sind fachliche Einordnungen, keine direkte Bestätigung jedes lokalen Modells."
      : "Diese Kanten belegen ausführbare Implementierung. Sie behaupten keine direkte Studienbestätigung jedes einzelnen Modells. Forschungskontext und Validierung auf einem konkreten Datensatz bleiben eigene Schritte.";
    drawNetwork(rows);
    table(rows);
  }

  document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    scenario.value = ""; family.value = ""; search.value = "";
    render();
  }));
  [scenario, family, decision].forEach((control) => control.addEventListener("change", render));
  search.addEventListener("input", render);
  window.matchMedia("(max-width: 640px)").addEventListener("change", render);
  $("mapping-reset").addEventListener("click", () => { scenario.value = ""; family.value = ""; decision.value = "all"; search.value = ""; render(); });
  $("download-network").addEventListener("click", () => {
    const copy = svg.cloneNode(true);
    copy.setAttribute("xmlns", ns);
    copy.setAttribute("font-family", "Arial, sans-serif");
    copy.querySelectorAll("[tabindex]").forEach((n) => { n.removeAttribute("tabindex"); n.removeAttribute("role"); n.removeAttribute("aria-pressed"); });
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `ceah-mapping-${state.mode}.svg`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $("core-sources").innerHTML = `<p>${data.counts.library} nach DOI zusammengeführte Quellen. Die Plattform und diese Darstellung verwenden dieselbe Bibliothek. Originaltitel und Fachbegriffe bleiben erhalten; Rolle und Übertragungsgrenze sind deutsch beschrieben.</p><p>Weitere ${data.counts.not_admitted} bibliografische Leads sind noch nicht als technische Begründung aufgenommen. <a href="./assets/mapping-leads.csv" download>85 Literaturhinweise und Aufnahmestatus herunterladen</a></p>`;
  render();
})();
