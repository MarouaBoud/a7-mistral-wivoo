import React, { useState } from 'react';
import { transformStationRecord } from '../lib/stations';
import { classerStations, messageConducteur, eur, Carburant, CoutStation, HYPOTHESES_DEFAUT, distanceKm } from '../lib/cout';

const champs = [
  ['aLat', 'Position — lat'], ['aLon', 'Position — lon'],
  ['bLat', 'Prochain arrêt — lat'], ['bLon', 'Prochain arrêt — lon'],
  ['conso', 'Conso (L/100 km)'], ['reservoir', 'Réservoir (L)'], ['niveau', 'Niveau actuel (L)'],
  ['coutHoraire', 'Coût horaire chauffeur (€/h)'],
] as const;

const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #eee', textAlign: 'right' };

export default function Comparateur() {
  const [f, setF] = useState<Record<string, number>>({
    aLat: 48.8566, aLon: 2.3522, bLat: 48.8925, bLon: 2.2369,
    conso: 11, reservoir: 80, niveau: 20, coutHoraire: HYPOTHESES_DEFAUT.coutHoraireChauffeur,
  });
  const [carburant, setCarburant] = useState<Carburant>('gazole');
  const [res, setRes] = useState<CoutStation[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lancer() {
    setLoading(true); setErr(null);
    try {
      const A = { lat: f.aLat, lon: f.aLon }, B = { lat: f.bLat, lon: f.bLon };
      const mid = { lat: (A.lat + B.lat) / 2, lon: (A.lon + B.lon) / 2 };
      const rayon = Math.min(100, distanceKm(A, B, 1) / 2 + 10); // 10 km autour du trajet
      const q = new URLSearchParams({ lat: `${mid.lat}`, lon: `${mid.lon}`, rayon: `${rayon}`, carburant, limit: '100' });
      const r = await fetch(`/api/stations?${q}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setRes(classerStations(data.results.map(transformStationRecord), A, B,
        { consoL100: f.conso, reservoirL: f.reservoir, niveauL: f.niveau, carburant },
        { ...HYPOTHESES_DEFAUT, coutHoraireChauffeur: f.coutHoraire }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  const moinsChere = res?.length ? res.reduce((m, c) => (c.prix < m.prix ? c : m)) : null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Où faire le plein ? Coût réel, détour compris</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {champs.map(([k, label]) => (
          <label key={k} style={{ fontSize: 13 }}>{label}<br />
            <input type="number" step="any" value={f[k]} style={{ width: '100%' }}
              onChange={(e) => setF({ ...f, [k]: parseFloat(e.target.value) })} />
          </label>
        ))}
        <label style={{ fontSize: 13 }}>Carburant<br />
          <select value={carburant} onChange={(e) => setCarburant(e.target.value as Carburant)} style={{ width: '100%' }}>
            {['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <button onClick={lancer} disabled={loading} style={{ marginTop: 15, padding: '10px 20px' }}>
        {loading ? 'Calcul…' : 'Comparer les stations'}
      </button>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}

      {res && (
        <>
          <div style={{ background: '#eef6ff', padding: 15, borderRadius: 8, margin: '20px 0', fontSize: 18 }}>
            🗣️ {messageConducteur(res)}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr>
              <th style={{ textAlign: 'left' }}>Station</th><th>Prix/L</th><th>Détour</th>
              <th>Plein</th><th>Carburant détour</th><th>Temps</th><th>Coût réel</th>
            </tr></thead>
            <tbody>
              {res.slice(0, 15).map((c, i) => (
                <tr key={c.station.id} style={{ background: i === 0 ? '#e7f8ec' : undefined }}>
                  <td style={{ ...td, textAlign: 'left' }}>
                    {c.station.nom || c.station.adresse}, {c.station.ville}
                    {c === moinsChere && <b> · moins chère au litre</b>}
                    {c.prixPerime && <span style={{ color: '#c60' }}> · prix &gt; 24 h</span>}
                  </td>
                  <td style={td}>{c.prix.toFixed(3).replace('.', ',')}</td>
                  <td style={td}>{c.detourKm.toFixed(1)} km / {Math.round(c.detourMin)} min</td>
                  <td style={td}>{eur(c.coutPlein)}</td>
                  <td style={td}>{eur(c.coutDetour)}</td>
                  <td style={td}>{eur(c.coutTemps)}</td>
                  <td style={{ ...td, fontWeight: 'bold' }}>{eur(c.coutReel)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 12, color: '#888' }}>
            Distances estimées à vol d'oiseau × {HYPOTHESES_DEFAUT.facteurRoute}, vitesse moyenne {HYPOTHESES_DEFAUT.vitesseKmh} km/h.
          </p>
        </>
      )}
    </div>
  );
}
