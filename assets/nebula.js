/* Offline atlas. Display coordinates carry no scientific distance or cluster meaning. */
(() => {
  "use strict";
  const data = window.CEAH_NEBULA;
  const $ = (id) => document.getElementById(id);
  const svg = $("nebula");
  const NS = "http://www.w3.org/2000/svg";
  const trees = {
    method: new Map(data.methods.map((node) => [node.id, node])),
    application: new Map(data.applications.map((node) => [node.id, node])),
  };
  const state = { modality: "all", evidence: "all", search: "", method: null, application: null, limit: 10 };
  const modalities = { vision: "Mit Bildbezug", non_vision: "Ohne Bildbezug", unknown: "Bildbezug ungeklärt" };
  let view = [0, 0, 1440, 820];
  let drag = null;
  let moved = false;
  let filtered = [];
  const compact = window.matchMedia("(max-width: 680px)");
  // Keep the diagram as an overview on phones and expose the same node actions at readable size.
  document.querySelector(".atlas-accessible").open = compact.matches;
  compact.addEventListener("change", (event) => { document.querySelector(".atlas-accessible").open = event.matches; });
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  function path(side, id) {
    const node = trees[side].get(id);
    return node ? [...path(side, node.parent), node] : [];
  }
  function contains(side, root, id) {
    return !root || path(side, id).some((node) => node.id === root);
  }
  function pairs(record) {
    return record.relations.flatMap((r) => r.methods.map((method) => ({ method, application: r.application })));
  }
  function selectedPairs(record) {
    return pairs(record).filter((pair) => contains("method", state.method, pair.method) && contains("application", state.application, pair.application));
  }
  function matches(record) {
    if (state.modality !== "all" && record.modality !== state.modality) return false;
    if (state.evidence === "title" && record.source_level !== "title") return false;
    if (state.evidence === "substantive" && record.source_level === "title") return false;
    const words = [record.id, record.title, record.authors, record.doi, ...pairs(record).flatMap((p) => [
      ...path("method", p.method).map((n) => n.label), ...path("application", p.application).map((n) => n.label),
    ])].join(" ").toLocaleLowerCase("de");
    return words.includes(state.search.toLocaleLowerCase("de").trim()) && selectedPairs(record).length > 0;
  }
  function element(name, attrs = {}, text) {
    const el = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function activate(el, handler) {
    el.addEventListener("click", () => { if (!moved) handler(); });
    el.addEventListener("keydown", (event) => {
      if (["Enter", " "].includes(event.key)) { event.preventDefault(); handler(); }
    });
  }
  function choose(side, id) {
    state[side] = id;
    state.limit = 10;
    resetView();
    render();
    const nextFocus = $(`${side}-up`).disabled ? svg.querySelector(`[data-side='${side}'] [role=button]`) : $(`${side}-up`);
    nextFocus?.focus({ preventScroll: true });
  }
  function frontier(side) {
    const nodes = [...trees[side].values()].filter((n) => n.parent === state[side]);
    return nodes.length ? nodes : state[side] ? [trees[side].get(state[side])] : [];
  }
  function displayParent(side, id, nodes) {
    return nodes.find((n) => contains(side, n.id, id));
  }
  function wrap(text, max = 25) {
    const words = text.split(" ");
    const lines = [""];
    words.forEach((word) => {
      if ((lines[lines.length - 1] + " " + word).trim().length > max && lines[lines.length - 1]) lines.push(word);
      else lines[lines.length - 1] = (lines[lines.length - 1] + " " + word).trim();
    });
    return lines;
  }
  function renderGraph() {
    svg.replaceChildren(element("title", {}, "Literaturatlas: Methodenfamilien und Anwendungen"));
    const defs = element("defs");
    const glow = element("radialGradient", { id: "nebula-glow" });
    glow.append(element("stop", { offset: "0", "stop-color": "#18384c", "stop-opacity": ".8" }), element("stop", { offset: "1", "stop-color": "#09151f", "stop-opacity": "0" }));
    defs.append(glow); svg.append(defs);
    svg.append(element("rect", { x: 0, y: 0, width: 1440, height: 860, fill: "#09151f" }));
    svg.append(element("ellipse", { cx: 430, cy: 410, rx: 410, ry: 390, fill: "url(#nebula-glow)" }), element("ellipse", { cx: 1020, cy: 400, rx: 400, ry: 380, fill: "url(#nebula-glow)" }));
    const decor = element("g", { "aria-hidden": "true" });
    for (let i = 0; i < 95; i++) decor.append(element("circle", { cx: 24 + ((i * 137) % 1392), cy: 30 + ((i * 239) % 750), r: i % 5 ? .8 : 1.3, fill: "#b9d5e3", opacity: .13 + (i % 4) * .04 }));
    svg.append(decor);
    const fronts = { method: frontier("method"), application: frontier("application") };
    const counts = { method: new Map(), application: new Map() };
    const links = new Map();
    for (const record of filtered) for (const pair of selectedPairs(record)) {
      const m = displayParent("method", pair.method, fronts.method);
      const a = displayParent("application", pair.application, fronts.application);
      if (!m || !a) continue;
      for (const [side, id] of [["method", m.id], ["application", a.id]]) {
        if (!counts[side].has(id)) counts[side].set(id, new Set());
        counts[side].get(id).add(record.id);
      }
      const key = `${m.id}|${a.id}`;
      if (!links.has(key)) links.set(key, { method: m.id, application: a.id, ids: new Set() });
      links.get(key).ids.add(record.id);
    }
    const positions = { method: new Map(), application: new Map() };
    const groups = [];
    for (const side of ["method", "application"]) {
      const cx = side === "method" ? 355 : 1085;
      const color = side === "method" ? "#85b9ff" : "#83dcc5";
      const nodes = fronts[side].filter((n) => counts[side].has(n.id));
      const group = element("g", { "data-side": side });
      const selected = trees[side].get(state[side]);
      const isLeaf = selected && ![...trees[side].values()].some((n) => n.parent === selected.id);
      const rootLabel = selected ? trees[side].get(isLeaf ? selected.parent : selected.id).label : side === "method" ? "Methodenfamilien" : "Anwendungsfelder";
      group.append(element("circle", { cx, cy: 395, r: 5, fill: color, opacity: .5 }));
      const rootText = element("text", { x: cx, y: 420, fill: color, "font-size": 15, "text-anchor": "middle", "font-family": "Segoe UI, sans-serif" });
      wrap(rootLabel, 24).forEach((line, i) => rootText.append(element("tspan", { x: cx, dy: i ? 18 : 0 }, line)));
      group.append(rootText);
      nodes.forEach((node, index) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * index) / nodes.length;
        const x = cx + 215 * Math.cos(angle), y = 385 + 280 * Math.sin(angle);
        positions[side].set(node.id, { x, y });
        group.append(element("line", { x1: cx, y1: 395, x2: x, y2: y, stroke: color, "stroke-width": 1, "stroke-dasharray": "3 7", opacity: .25 }));
        const count = counts[side].get(node.id).size;
        const children = [...trees[side].values()].some((n) => n.parent === node.id);
        const item = element("g", { role: "button", tabindex: 0, class: "atlas-node", "data-node": `${side}-${node.id}`, "aria-label": `${node.label}: ${count} Hinweise. ${children ? "Untergruppen öffnen" : "Quellen auswählen"}` });
        const radius = 11 + Math.sqrt(count) * 1.8;
        item.append(element("circle", { cx: x, cy: y, r: radius + 8, fill: color, opacity: .055 }));
        item.append(element("circle", { cx: x, cy: y, r: radius, fill: side === "method" ? "#152e46" : "#103c37", stroke: color, "stroke-width": 1.6 }));
        item.append(element("text", { x, y: y + 4, "text-anchor": "middle", fill: "#fff", "font-size": 12, "font-family": "Segoe UI, sans-serif" }, count));
        const text = element("text", { x, y: y + radius + 20, "text-anchor": "middle", fill: "#e4eef6", "font-size": 14, "font-family": "Segoe UI, sans-serif" });
        wrap(node.label, 19).forEach((line, i) => text.append(element("tspan", { x, dy: i ? 17 : 0 }, line)));
        if (children) text.append(element("tspan", { x, dy: 17, fill: color, "font-size": 11 }, "Teilbereiche öffnen ›"));
        item.append(text);
        activate(item, () => choose(side, node.id));
        item.addEventListener("pointerenter", () => highlight(side, node.id));
        item.addEventListener("pointerleave", () => highlight());
        item.addEventListener("focus", () => highlight(side, node.id));
        item.addEventListener("blur", () => highlight());
        group.append(item);
      });
      groups.push(group);
      $(`${side}-list`).replaceChildren();
      nodes.forEach((n) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `${n.label} · ${counts[side].get(n.id).size} ›`;
        button.addEventListener("click", () => choose(side, n.id));
        $(`${side}-list`).append(button);
      });
      $(`${side}-trail`).textContent = state[side] ? path(side, state[side]).map((n) => n.label).join(" → ") : side === "method" ? "Alle Familien" : "Alle Felder";
      $(`${side}-up`).textContent = "↑ Eine Ebene zurück";
      $(`${side}-up`).disabled = !state[side];
    }
    const edges = element("g", { class: "atlas-edges" });
    links.forEach((link) => {
      const a = positions.method.get(link.method), b = positions.application.get(link.application);
      const d = `M ${a.x} ${a.y} C 660 ${a.y}, 780 ${b.y}, ${b.x} ${b.y}`;
      const edge = element("path", { d, class: "atlas-edge", fill: "none", stroke: "#79b9cc", "stroke-width": 1 + Math.sqrt(link.ids.size) * .65, opacity: .16, role: "button", tabindex: 0, "data-method": link.method, "data-application": link.application, "data-count": link.ids.size, "aria-label": `${trees.method.get(link.method).label} → ${trees.application.get(link.application).label}: ${link.ids.size} Hinweise` });
      edge.append(element("title", {}, `${trees.method.get(link.method).label} → ${trees.application.get(link.application).label} · ${link.ids.size} Hinweise`));
      activate(edge, () => { state.method = link.method; state.application = link.application; state.limit = 10; resetView(); render(); $("method-up").focus({ preventScroll: true }); });
      edges.append(edge);
    });
    svg.append(edges, ...groups);
    $("atlas-empty").hidden = filtered.length > 0;
  }
  function highlight(side, id) {
    svg.querySelectorAll(".atlas-edge").forEach((edge) => {
      const connected = side && edge.dataset[side] === id;
      edge.setAttribute("opacity", !side ? ".16" : connected ? ".85" : ".025");
    });
  }
  function renderRecords() {
    $("source-count").textContent = `${filtered.length} eindeutige Hinweise · ${Math.min(state.limit, filtered.length)} angezeigt`;
    $("atlas-records").innerHTML = filtered.slice(0, state.limit).map((r) => {
      const relations = r.relations.map((relation) => ({ ...relation, methods: relation.methods.filter((m) => contains("method", state.method, m)) })).filter((rel) => rel.methods.length && contains("application", state.application, rel.application));
      return `<article class="atlas-record" data-record="${escape(r.id)}"><div class="atlas-record-id"><strong>${escape(r.id)}</strong><span>${escape(r.year)}</span></div><div><div class="atlas-badges"><span>${modalities[r.modality]}</span><span>${escape(r.source_locator)}</span>${r.coverage === "mixed_review" ? "<span>Gemischter Review</span>" : ""}${r.in_library ? "<span class=atlas-admitted>In der Plattformbibliothek</span>" : ""}</div><h3><a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${escape(r.title)} ↗</a></h3><p class="atlas-authors">${escape(r.authors)}</p><ul class="atlas-relations">${relations.map((rel) => `<li><strong>${escape(path("application", rel.application).map((n) => n.label).join(" → "))}</strong><span>${rel.methods.map((m) => escape(path("method", m).map((n) => n.label).join(" → "))).join("<br>")}</span></li>`).join("")}</ul><a class="atlas-source-link" href="${escape(r.source_url)}" target="_blank" rel="noopener noreferrer">Codierungsgrundlage ansehen ↗</a>${r.source_level === "title" ? "<p class=atlas-source-limit>Nur im Originaltitel benannte Inhalte; weitere Verfahrens- und Datendetails bleiben offen.</p>" : ""}</div></article>`;
    }).join("") || "<p>Keine Quellen in dieser Auswahl.</p>";
    $("more-sources").hidden = state.limit >= filtered.length;
  }
  function render() {
    filtered = data.records.filter(matches);
    $("atlas-count").textContent = `${filtered.length} / ${data.records.length} Hinweise`;
    const admitted = filtered.filter((r) => r.in_library).length;
    const titleOnly = filtered.filter((r) => r.source_level === "title").length;
    $("atlas-summary").textContent = `${titleOnly} nur Titel · ${filtered.length - titleOnly} Abstract / Methodik · ${admitted} in der Plattformbibliothek`;
    document.querySelectorAll("[data-modality]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.modality === state.modality)));
    renderGraph(); renderRecords();
  }
  function applyView() { svg.setAttribute("viewBox", view.join(" ")); }
  function resetView() { view = [0, 0, 1440, 820]; applyView(); }
  function zoom(factor) {
    const width = Math.min(1440, Math.max(300, view[2] * factor));
    const height = width * 820 / 1440;
    view = [view[0] + (view[2] - width) / 2, view[1] + (view[3] - height) / 2, width, height];
    applyView();
  }
  svg.addEventListener("pointerdown", (event) => {
    moved = false;
    if (event.button !== 0 || event.target.closest("[role=button]")) return;
    drag = { x: event.clientX, y: event.clientY, view: [...view] };
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const scale = drag.view[2] / svg.getBoundingClientRect().width;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    moved = Math.abs(dx) + Math.abs(dy) > 4;
    view = [drag.view[0] - dx * scale, drag.view[1] - dy * scale, drag.view[2], drag.view[3]];
    applyView();
  });
  for (const name of ["pointerup", "pointercancel"]) svg.addEventListener(name, () => { drag = null; });
  $("zoom-in").addEventListener("click", () => zoom(.75));
  $("zoom-out").addEventListener("click", () => zoom(1 / .75));
  $("zoom-reset").addEventListener("click", resetView);
  for (const side of ["method", "application"]) $(`${side}-up`).addEventListener("click", () => choose(side, trees[side].get(state[side])?.parent ?? null));
  document.querySelectorAll("[data-modality]").forEach((button) => button.addEventListener("click", () => {
    state.modality = button.dataset.modality; state.limit = 10; render();
  }));
  $("atlas-evidence").addEventListener("change", (event) => { state.evidence = event.target.value; state.limit = 10; render(); });
  $("atlas-search").addEventListener("input", (event) => { state.search = event.target.value; state.limit = 10; render(); });
  $("atlas-reset").addEventListener("click", () => {
    Object.assign(state, { modality: "all", evidence: "all", search: "", method: null, application: null, limit: 10 });
    $("atlas-search").value = ""; $("atlas-evidence").value = "all"; resetView(); render();
  });
  $("more-sources").addEventListener("click", () => { state.limit += 15; renderRecords(); });
  $("atlas-export").addEventListener("click", () => {
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", NS); clone.setAttribute("width", "1440"); clone.setAttribute("height", "820");
    clone.setAttribute("viewBox", "0 0 1440 860");
    clone.append(element("desc", {}, `Quellenauswahl: ${filtered.map((r) => r.id).join(", ")}. Quellenebene: ${state.evidence}. Suche: ${state.search || "keine"}.`));
    clone.querySelectorAll(".atlas-edge").forEach((edge) => edge.setAttribute("opacity", ".25"));
    const caption = `${filtered.length} / 85 Hinweise · ${state.modality === "all" ? "Gesamt" : modalities[state.modality]} · Größe = Quellenzahl, Position = Layout; keine Leistungswertung`;
    clone.append(element("text", { x: 28, y: 838, fill: "#c7dae7", "font-size": 15, "font-family": "Segoe UI, sans-serif" }, caption));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "CEAH-Literaturatlas.svg"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  render();
})();
