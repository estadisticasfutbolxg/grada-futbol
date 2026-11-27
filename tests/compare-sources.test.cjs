const test = require("node:test");
const assert = require("node:assert/strict");
const {pilotReference, pilotPairs, pilotDelta} = require("../dist/comparar-fuentes.js");

const payload = {
  schema: "grada-source-pilot-v1", fixture: 601024,
  players: [{id: 1, name: "Referencia", goals: {value: 0, source: "FotMob"}}],
};

test("solo acepta la misma muestra y exige procedencia por dato", () => {
  assert.throws(() => pilotReference(payload, 213647), /mismo partido/);
  assert.throws(() => pilotReference({...payload, players: [{id: 1, name: "x", goals: 2}]}, 601024), /fuente/);
  assert.throws(() => pilotReference({...payload, players: [...payload.players, ...payload.players]}, 601024), /repetida/);
  assert.equal(pilotReference(payload, 601024).players[0].goals.value, 0);
});

test("compara por ID revisado, conserva filas sin pareja y no equipara modelos", () => {
  const ref = pilotReference(payload, 601024);
  const bzz = {players: [{id: 2, name: "Referencia", goals: 3}, {id: 1, name: "Bzz", goals: 2}]};
  const result = pilotPairs(ref, bzz, "compare");
  assert.equal(result.length, 2);
  assert.equal(result[0][2].id, 1);
  assert.equal(result[1][1], undefined);
  assert.equal(pilotPairs(ref, bzz, "reference").length, 1);
  assert.equal(pilotPairs(ref, bzz, "bzz").length, 2);
  assert.equal(pilotDelta(result[0][1].goals, result[0][2].goals, "goals"), 2);
  assert.equal(pilotDelta(result[0][1].goals, 2, "xg"), null);
  assert.equal(pilotDelta(result[0][1].goals, null, "saves"), null);
});
