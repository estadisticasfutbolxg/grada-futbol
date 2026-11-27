"use strict";

const SOURCE_PILOT_METRICS = {
  goals: "Goles", saves: "Paradas", xg: "xG", xa: "xA", minutes: "Minutos",
};
const SOURCE_PILOT_TEAM = {
  saves: "Paradas · agregado", shotsOnTarget: "Tiros a puerta · agregado",
  xg: "xG de equipo · agregado",
};
const SOURCE_PILOT_NAMES = {reference: "FotMob + ESPN", bzz: "Bzzoiro"};

function pilotNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 1e7;
}

function pilotReference(payload, fixture) {
  if (!payload || payload.schema !== "grada-source-pilot-v1" ||
      payload.fixture !== fixture || !Array.isArray(payload.players) || payload.players.length > 100) {
    throw new Error("Selecciona un JSON de referencia para este mismo partido.");
  }
  const ids = new Set();
  const providers = new Set(["FotMob", "ESPN"]);
  function cell(input) {
    if (input == null) return null;
    if (!pilotNumber(input.value) || !providers.has(input.source)) {
      throw new Error("Cada dato de referencia necesita un valor numérico y fuente FotMob o ESPN.");
    }
    return {value: input.value, source: input.source};
  }
  const players = payload.players.map(row => {
    if (!row || !Number.isSafeInteger(row.id) || row.id < 1 || ids.has(row.id) ||
        typeof row.name !== "string" || row.name.length < 1 || row.name.length > 100) {
      throw new Error("Identidad de jugador inválida o repetida.");
    }
    ids.add(row.id);
    return {id: row.id, name: row.name, ...Object.fromEntries(
      Object.keys(SOURCE_PILOT_METRICS).map(key => [key, cell(row[key])]),
    )};
  });
  if (payload.teams !== undefined && (!payload.teams || typeof payload.teams !== "object")) {
    throw new Error("La referencia de equipos no es válida.");
  }
  const teams = Object.fromEntries(["home", "away"].map(side => [
    side, Object.fromEntries(Object.keys(SOURCE_PILOT_TEAM).map(key => [key, cell(payload.teams?.[side]?.[key])])),
  ]));
  return {players, teams};
}

function pilotPairs(reference, bzz, key) {
  const a = new Map((reference?.players ?? []).map(p => [p.id, p]));
  const b = new Map((bzz?.players ?? []).map(p => [p.id, p]));
  if (key === "reference") return Array.from(a.values()).map(p => [p.name, p, null]);
  if (key === "bzz") return Array.from(b.values()).map(p => [p.name, null, p]);
  return Array.from(new Set([...a.keys(), ...b.keys()])).map(id => [
    a.get(id)?.name ?? b.get(id)?.name, a.get(id), b.get(id),
  ]);
}

function pilotDelta(reference, bzz, metric) {
  if (!pilotNumber(reference?.value) || !pilotNumber(bzz)) return null;
  // Providers may use different models or minute conventions; do not present these as parity deltas.
  if (!["goals", "saves", "shotsOnTarget"].includes(metric)) return null;
  return bzz - reference.value;
}

function startSourcePilot() {
  const ui = Object.fromEntries(["fixture", "source", "reference", "load", "notice", "comparison"].map(id => [
    id, document.getElementById(id),
  ]));
  const cache = new Map();
  const snapshots = new Map();
  let generation = 0;
  const format = new Intl.NumberFormat("es-ES", {maximumFractionDigits: 3});
  const value = n => pilotNumber(n) ? format.format(n) : "—";
  const referenceValue = item => item == null ? "—" : `${value(item.value)} · ${item.source}`;
  const active = () => Number(ui.fixture.value);

  function add(parent, tag, content) {
    const child = document.createElement(tag);
    if (content !== undefined) child.textContent = content;
    parent.append(child);
    return child;
  }

  function table(title, headings, rows) {
    add(ui.comparison, "h2", title);
    if (!rows.length) {
      add(ui.comparison, "p", "Sin filas disponibles en esta vista.");
      return;
    }
    const wrap = add(ui.comparison, "div");
    wrap.className = "table-wrap";
    const node = add(wrap, "table");
    const head = add(add(node, "thead"), "tr");
    for (const title of headings) {
      const col = add(head, "th", title);
      col.scope = "col";
    }
    const body = add(node, "tbody");
    for (const row of rows) {
      const tr = add(body, "tr");
      row.forEach((item, index) => {
        const td = add(tr, index ? "td" : "th", item);
        if (!index) td.scope = "row";
      });
    }
  }

  function render() {
    ui.comparison.replaceChildren();
    const selected = ui.source.value;
    const ref = snapshots.get(active());
    const bzz = cache.get(active());
    const refs = selected !== "bzz";
    const bs = selected !== "reference";
    const head = [...(refs ? [SOURCE_PILOT_NAMES.reference] : []), ...(bs ? [SOURCE_PILOT_NAMES.bzz] : [])];
    const sourceCells = (reference, observed) => [
      ...(refs ? [referenceValue(reference)] : []), ...(bs ? [value(observed)] : []),
    ];
    const teamRows = [];
    if ((ref && refs) || (bzz && bs)) {
      for (const [side, label] of [["home", "Local"], ["away", "Visitante"]]) {
        for (const [key, text] of Object.entries(SOURCE_PILOT_TEAM)) {
          teamRows.push([`${label} · ${text}`, ...sourceCells(ref?.teams[side]?.[key], bzz?.teams[side]?.[key])]);
        }
        if (bs && bzz?.teams[side]) {
          const t = bzz.teams[side];
          if (t.estimated != null) {
            add(ui.comparison, "p", `${label}: xG de equipo ${t.estimated ? "estimado por Bzzoiro" : "del agregado de origen"}.`);
          }
          add(ui.comparison, "p", `${label}: mapa con xGOT en ${value(t.mapWithXgot)} de ${value(t.mapOnTarget)} tiros a puerta; suma del mapa ${value(t.mapXgot)}. No es xGOT de portero.`);
        }
      }
    }
    table("Equipos", ["Métrica", ...head], teamRows);
    const showDelta = selected === "compare";
    const headings = ["Jugador", "Métrica", ...head, ...(showDelta ? ["Diferencia Bzzoiro − referencia"] : [])];
    const playerRows = pilotPairs(ref, bzz, selected).flatMap(([name, a, b]) =>
      Object.entries(SOURCE_PILOT_METRICS).map(([key, label]) => {
        const d = pilotDelta(a?.[key], b?.[key], key);
        return [name, label, ...sourceCells(a?.[key], b?.[key]), ...(showDelta ? [d === null ? "—" : format.format(d)] : [])];
      }),
    );
    table("Jugadores", headings, playerRows);
    if (bs) for (const note of bzz?.notes ?? []) add(ui.comparison, "p", note);
    if (refs && !ref) add(ui.comparison, "p", "Falta cargar una referencia local de este partido.");
    if (bs && !bzz) add(ui.comparison, "p", "Bzzoiro no está cargado para este partido.");
  }

  ui.fixture.addEventListener("change", () => {
    generation++;
    ui.reference.value = "";
    ui.notice.textContent = "";
    ui.load.disabled = false;
    render();
  });
  ui.source.addEventListener("change", render);
  ui.reference.addEventListener("change", async () => {
    const file = ui.reference.files[0];
    const fixture = active();
    if (!file) return;
    try {
      if (file.size > 250000) throw new Error("El JSON de un partido no debe superar 250 kB.");
      const ref = pilotReference(JSON.parse(await file.text()), fixture);
      snapshots.set(fixture, ref);
      if (active() === fixture) ui.notice.textContent = "Referencia cargada solo en este navegador.";
    } catch (error) {
      if (active() === fixture) ui.notice.textContent = error.message;
    }
    render();
  });
  ui.load.addEventListener("click", async () => {
    const fixture = active();
    if (!fixture) return;
    if (cache.has(fixture)) {
      ui.notice.textContent = "Ya se ha cargado este partido en esta sesión.";
      render();
      return;
    }
    const ticket = ++generation;
    ui.load.disabled = true;
    ui.notice.textContent = "Consultando las cuatro vistas del partido en Bzzoiro…";
    try {
      const result = await fetch(`/api/pilot/${fixture}`, {cache: "no-store"});
      const data = await result.json();
      if (!result.ok) throw new Error(data.error);
      if (data.fixture !== fixture) throw new Error("Los datos no corresponden a este partido.");
      cache.set(fixture, data);
      if (ticket === generation) ui.notice.textContent = "Datos de Bzzoiro cargados.";
    } catch (error) {
      if (ticket === generation) ui.notice.textContent = error.message;
    } finally {
      if (ticket === generation) ui.load.disabled = false;
      render();
    }
  });
  fetch("/api/fixtures").then(response => {
    if (!response.ok) throw new Error("No se pudo abrir el catálogo del piloto.");
    return response.json();
  }).then(fixtures => {
    for (const [id, name] of Object.entries(fixtures)) add(ui.fixture, "option", name).value = id;
    ui.fixture.value = "601024";
    render();
  }).catch(error => { ui.notice.textContent = error.message; });
}

if (typeof module !== "undefined") module.exports = {pilotReference, pilotPairs, pilotDelta};
if (typeof document !== "undefined") startSourcePilot();
