import assert from 'node:assert/strict';
import { classerStations, coutReel, HYPOTHESES_DEFAUT as H, Vehicule } from '../lib/cout';
import { StationData } from '../types/station';

const now = new Date('2026-10-07T12:00:00Z');
const st = (id: string, lat: number, lon: number, prix: number): StationData => ({
  id, nom: id, adresse: '', ville: '', codePostal: '', latitude: lat, longitude: lon,
  carburants: { gazole: { prix, dateMaj: '2026-10-07T08:00:00Z', enRupture: false } },
});
const v: Vehicule = { consoL100: 10, reservoirL: 80, niveauL: 20, carburant: 'gazole' };
const A = { lat: 48.85, lon: 2.35 }, B = { lat: 48.85, lon: 2.45 };

// Cas Karim : moins chère de 5 cts mais à 15 km hors trajet → perd
const r = classerStations([st('loin', 48.98, 2.40, 1.70), st('route', 48.85, 2.40, 1.75)], A, B, v, H, now);
assert.equal(r[0].station.id, 'route');
// Détour nul → coût = plein
assert.equal(coutReel(1.8, 50, 0, 0, v, H).coutReel, 90);
// Détour négatif → gain
assert.ok(coutReel(1.8, 50, -2, -3, v, H).coutReel < 90);
// Hors autonomie (20 L / 10 L/100 = 200 km ×0,85) → exclue
assert.equal(classerStations([st('far', 51, 2.35, 1.0)], A, B, v, H, now).length, 0);
console.log('OK');

// Tournée : une station sur le 2e tronçon est trouvée et étiquetée troncon=1
import { classerTournee } from '../lib/cout';
const C = { lat: 48.85, lon: 2.55 };
const t = classerTournee([st('t2', 48.85, 2.50, 1.70)], A, [B, C], v, H, now);
assert.equal(t[0].troncon, 1);
assert.ok(Math.abs(t[0].detourKm) < 0.01);
console.log('OK tournée');
