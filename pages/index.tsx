import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { transformStationRecord } from '../lib/stations';
import { classerTournee, classerStations, distanceKm, eur, Point, CoutStationTournee, HYPOTHESES_DEFAUT } from '../lib/cout';
import { CONDUCTEUR, VEHICULE, LIVRAISONS, GRADUATIONS_JAUGE, Livraison } from '../lib/tournee';
import { StationData } from '../types/station';

const LiveMap = dynamic(() => import('../components/LiveMap'), { ssr: false });

const POSITION_SIMULEE = { lat: 48.8584, lon: 2.3470 }; // Châtelet
const RECALCUL_M = 500; // recalcul après 500 m parcourus

const CSS = `
:root{--bg:#fffaeb;--surface:#fff;--ink:#1e1e1e;--muted:#6b5f4f;--line:#ead9b8;--accent:#fa500f;--route:#1e1e1e;--warn:#ffaf00;
--display:"Archivo Black",system-ui,sans-serif;--body:"Archivo",system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#141210;--surface:#1f1b17;--ink:#fff3d9;--muted:#b3a58c;--line:#3a3128;--accent:#ff8205;--route:#fff3d9;--warn:#ffd800}}
html,body{background:var(--bg)}
.pj{max-width:440px;margin:0 auto;padding:14px 16px calc(90px + env(safe-area-inset-bottom));color:var(--ink);font:14px/1.45 var(--body)}
.stripe{display:flex;height:8px;margin-bottom:12px}.stripe i{flex:1}
.stripe i:nth-child(1){background:#ffd800}.stripe i:nth-child(2){background:#ffaf00}.stripe i:nth-child(3){background:#ff8205}.stripe i:nth-child(4){background:#fa500f}.stripe i:nth-child(5){background:#e10500}
.pj header{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:baseline;margin-bottom:10px}
.pj h1{font:400 28px/1 var(--display);margin:0}
.src{font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.06em}.src b{color:var(--accent)}
.map{height:46vh;min-height:280px;border:1px solid var(--line);position:relative;overflow:hidden}
.hud{position:absolute;left:10px;bottom:10px;z-index:1000;display:flex;gap:6px;flex-wrap:wrap}
.chip{background:var(--surface);border:1px solid var(--line);padding:4px 8px;font:500 12px var(--mono);color:var(--ink)}
.pj button{font:400 14px var(--display);letter-spacing:.04em;text-transform:uppercase;background:var(--accent);color:#fff;border:0;border-radius:0;padding:7px 12px;cursor:pointer}
.pj button.ghost{background:var(--surface);color:var(--ink);border:1px solid var(--line)}
.stack{display:flex;flex-direction:column;gap:12px;margin-top:12px}
details.veh{background:var(--surface);border:1px solid var(--line);padding:12px}
details.veh summary{font:500 12px var(--mono);text-transform:uppercase;letter-spacing:.05em;cursor:pointer;color:var(--muted)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 10px;margin-top:10px}
.grid label{font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.05em;display:flex;flex-direction:column;gap:3px}
.grid input,.grid select{font:500 16px var(--mono);padding:5px 6px;border:1px solid var(--line);border-radius:0;background:var(--bg);color:var(--ink)}
.best{background:linear-gradient(90deg,#ffaf00,#fa500f 60%,#e10500);color:#1e1e1e;padding:14px}
.best .k{font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;opacity:.85}
.best .n{font:400 22px/1.15 var(--display)}.best .s{font-size:13px;margin-top:4px}
.pj ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.pj li{background:var(--surface);border:1px solid var(--line);padding:9px 11px;display:grid;grid-template-columns:1fr auto;gap:2px 10px}
.pj li.top{border-color:var(--accent);box-shadow:inset 3px 0 0 var(--accent)}
.nm{font-weight:500}.tot{font:500 15px var(--mono);text-align:right;font-variant-numeric:tabular-nums}
.dt{font:500 11.5px var(--mono);color:var(--muted);grid-column:1/-1}
.trap{color:var(--warn)}.old{color:var(--accent)}

.id{position:sticky;top:0;z-index:1600;background:var(--ink);color:var(--bg);margin:0 -16px 12px;padding:10px 16px;display:flex;justify-content:space-between;gap:10px;align-items:center}
.id .who{font:400 16px/1.1 var(--display)}.id .car{font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.05em;opacity:.8;text-align:right}
.jauge{background:#111;color:#ffb000;padding:12px;border:1px solid var(--line)}
.jauge .top{display:flex;justify-content:space-between;align-items:baseline;font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:#9a8a70}
.jauge .val{font:500 26px var(--mono);color:#ffb000;text-shadow:0 0 8px #ffb00088}
.segs{display:flex;align-items:center;gap:4px;margin-top:8px;font:500 14px var(--mono)}
.segs button{flex:1;height:30px;padding:0!important;background:#2a2620!important;border:0}
.segs button.on{background:#ffb000!important;box-shadow:0 0 8px #ffb00088}
.segs button.on.low{background:#e10500!important;box-shadow:0 0 8px #e1050088}
.liv li{grid-template-columns:auto 1fr auto;align-items:center}.liv .no{font:400 16px var(--display);width:26px;height:26px;display:grid;place-items:center;background:var(--muted);color:var(--surface)}
.liv li:first-child .no{background:#e10500}.liv .ad{font-size:12px;color:var(--muted)}
.leaflet-tooltip.num{background:none;border:0;box-shadow:none;color:#fff;font:700 12px var(--mono);padding:0}.leaflet-tooltip.num:before{display:none}
.trouver{width:100%;padding:14px!important;font-size:16px!important;background:var(--ink)!important;color:var(--bg)!important}
.trouver:disabled{opacity:.5}
.proche{border:2px solid var(--accent);background:var(--surface);padding:12px}
.proche .k{font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--accent)}
.proche .n{font:400 20px/1.15 var(--display)}.proche .s{font-size:13px;color:var(--muted)}
.proche .act{display:flex;gap:8px;margin-top:10px}.proche .act>*{flex:1;text-align:center}
.proche a{font:400 14px var(--display);text-transform:uppercase;background:var(--accent);color:#fff;padding:9px;text-decoration:none}
.note{font-size:12px;color:var(--muted);margin:0}
.cta{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom));width:min(408px,calc(100% - 32px));padding:14px!important;font-size:16px!important;text-align:center;text-decoration:none;z-index:1500;
font:400 16px var(--display);letter-spacing:.04em;text-transform:uppercase;background:var(--accent);color:#fff;box-sizing:border-box}
`;

const nom = (s: StationData) => s.nom || s.adresse;

export default function Conduite() {
  const [position, setPosition] = useState<Point | null>(null);
  const [trace, setTrace] = useState<Point[]>([]);
  const [arrets, setArrets] = useState<Livraison[]>(LIVRAISONS);
  const [crans, setCrans] = useState(2); // crans allumés sur la jauge, saisis par le conducteur
  const horaire = 28; // €/h, fixé par le gestionnaire
  const [stations, setStations] = useState<StationData[]>([]);
  const [suivre, setSuivre] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const dernierCalcul = useRef<Point | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) { setErreur('GPS indisponible sur cet appareil.'); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const pt = { lat: p.coords.latitude, lon: p.coords.longitude };
        setPosition(pt);
        setTrace((t) => (t.length && distanceKm(t[t.length - 1], pt, 1) < 0.01 ? t : [...t, pt]));
        setErreur(null);
      },
      (e) => {
        // Sans GPS (refus, ordinateur, http sur mobile) : position simulée près de la 1re livraison pour la démo
        setPosition((p) => p ?? POSITION_SIMULEE);
        setSimulee(true);
        setErreur(e.code === 1 ? 'Localisation refusée · position simulée' : 'GPS indisponible · position simulée');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Récupère les stations autour de la tournée restante quand on a bougé ou livré
  useEffect(() => {
    if (!position || !arrets.length) return;
    const d = dernierCalcul.current;
    if (d && distanceKm(d, position, 1) * 1000 < RECALCUL_M) return;
    dernierCalcul.current = position;
    const pts = [position, ...arrets];
    const mid = { lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length, lon: pts.reduce((s, p) => s + p.lon, 0) / pts.length };
    const rayon = Math.min(100, Math.max(...pts.map((p) => distanceKm(mid, p, 1))) + 5);
    const q = new URLSearchParams({ lat: `${mid.lat}`, lon: `${mid.lon}`, rayon: `${rayon}`, carburant: VEHICULE.carburant, limit: '100' });
    fetch(`/api/stations?${q}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setStations(d.results.map(transformStationRecord)); })
      .catch((e) => setErreur(e.message));
  }, [position, arrets]);

  const niveauL = (VEHICULE.reservoirL * crans) / GRADUATIONS_JAUGE;
  const livraisons = arrets.filter((a) => !a.plein);
  const pleinPrevu = arrets.find((a) => a.plein);
  const classement: CoutStationTournee[] = position && livraisons.length
    ? classerTournee(stations, position, livraisons, { ...VEHICULE, niveauL },
      { ...HYPOTHESES_DEFAUT, coutHoraireChauffeur: horaire })
    : [];
  const best = classement[0];
  const cheap = classement.length ? classement.reduce((m, c) => (c.prix < m.prix ? c : m)) : null;
  const autonomie = (niveauL / VEHICULE.consoL100) * 100 * 0.85;
  const quand = (c: CoutStationTournee) => (c.troncon === 0 ? 'maintenant, avant la livraison 1' : `après la livraison ${c.troncon}`);
  const numLiv = (l: Livraison) => livraisons.indexOf(l) + 1;

  const [cherche, setCherche] = useState(false);
  const [simulee, setSimulee] = useState(false);

  const checkpoint = (st: StationData, label: string): Livraison => ({
    id: `plein-${st.id}`, plein: true, client: `⛽ Plein · ${nom(st)}`,
    adresse: `${label} · ${st.carburants[VEHICULE.carburant]!.prix.toFixed(3)} €/L · ${st.ville}`,
    lat: st.latitude, lon: st.longitude,
  });

  // Le conducteur décide quand faire le plein : on cherche, depuis sa position actuelle, la station au
  // meilleur coût réel sur le chemin de sa prochaine livraison, et on l'insère comme prochain arrêt.
  async function pleinMaintenant() {
    const position_ = position ?? POSITION_SIMULEE;
    if (!position) { setPosition(position_); setSimulee(true); }
    const sansPlein = arrets.filter((a) => !a.plein);
    const cible = sansPlein[0] ?? position_; // tournée finie : simple aller-retour
    setCherche(true);
    try {
      for (const marge of [3, 10, 30]) {
        const mid = { lat: (position_.lat + cible.lat) / 2, lon: (position_.lon + cible.lon) / 2 };
        const rayon = Math.min(100, distanceKm(position_, cible, 1) / 2 + marge);
        const q = new URLSearchParams({ lat: `${mid.lat}`, lon: `${mid.lon}`, rayon: `${rayon}`, carburant: VEHICULE.carburant, limit: '100' });
        const d = await (await fetch(`/api/stations?${q}`)).json();
        if (d.error) throw new Error(d.error);
        const c = classerStations(d.results.map(transformStationRecord), position_, cible, { ...VEHICULE, niveauL },
          { ...HYPOTHESES_DEFAUT, coutHoraireChauffeur: horaire })[0];
        if (!c) continue;
        setArrets([checkpoint(c.station, `${eur(c.coutReel)} réel · détour ${c.detourKm.toFixed(1)} km`), ...sansPlein]);
        setSuivre(true);
        return;
      }
      setErreur('Aucune station accessible avec le carburant restant.');
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally { setCherche(false); }
  }

  const pleinFait = () => { setArrets((a) => a.filter((x) => !x.plein)); setCrans(GRADUATIONS_JAUGE); dernierCalcul.current = null; };
  const livrer = () => { setArrets((a) => a.slice(1)); dernierCalcul.current = null; };
  const prochain = arrets[0];

  return (
    <>
      <Head>
        <title>PleinJuste</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pj">
        <div className="id">
          <div className="who">{CONDUCTEUR.prenom} {CONDUCTEUR.nom.toUpperCase()}</div>
          <div className="car">{VEHICULE.modele}<br />{VEHICULE.immat}</div>
        </div>
        <div className="stripe"><i /><i /><i /><i /><i /></div>
        <header>
          <h1>PleinJuste</h1>
        </header>

        <div className="map">
          <LiveMap position={position} trace={trace} arrets={arrets} classement={classement} suivre={suivre}
            onDeplacement={() => setSuivre(false)} />
          <div className="hud">
            <span className="chip">{erreur ?? (!position ? 'Signal GPS…' : !arrets.length ? 'Tournée terminée' :
              `${prochain.plein ? 'Plein' : 'Livraison 1'} à ${distanceKm(position, prochain, 1.3).toFixed(1)} km`)}</span>
            <span className="chip">Autonomie {Math.round(autonomie)} km</span>
            {!suivre && <button onClick={() => setSuivre(true)}>Recentrer</button>}
          </div>
        </div>

        <div className="stack">
          <div className="jauge">
            <div className="top"><span>⛽ Carburant · comme au tableau de bord</span><span className="val">{Math.round(niveauL)} L</span></div>
            <div className="segs" role="group" aria-label="Niveau de carburant">
              <span>E</span>
              {Array.from({ length: GRADUATIONS_JAUGE }, (_, i) => (
                <button key={i} aria-label={`${i + 1}/${GRADUATIONS_JAUGE}`} onClick={() => setCrans(i + 1 === crans ? i : i + 1)}
                  className={`${i < crans ? 'on' : ''} ${crans <= 1 ? 'low' : ''}`} />
              ))}
              <span>F</span>
            </div>
            <div className="top" style={{ marginTop: 6 }}><span>Autonomie ≈ {Math.round(autonomie)} km</span><span>Plein : {Math.round(VEHICULE.reservoirL - niveauL)} L</span></div>
          </div>

          <button className="trouver" onClick={pleinMaintenant} disabled={cherche}>
            {cherche ? 'Recherche…' : pleinPrevu ? '⛽ Rechercher à nouveau depuis ici' : '⛽ Faire le plein maintenant'}
          </button>

          <ol className="liv">
            {arrets.map((l, i) => (
              <li key={l.id}><span className="no" style={l.plein ? { background: '#ffaf00', color: '#1e1e1e' } : undefined}>{l.plein ? '⛽' : numLiv(l)}</span>
                <span><span className="nm">{l.client}</span><br /><span className="ad">{l.adresse}</span></span>
                {l.plein ? <button onClick={pleinFait}>Plein fait</button> : i === 0 ? <button onClick={livrer}>Livré</button> : <span />}
              </li>
            ))}
          </ol>

          {livraisons.length > 0 && !pleinPrevu && (best ? (
            <div className="best">
              <div className="k">Meilleur plein de la tournée · {quand(best)}</div>
              <div className="n">{nom(best.station)}</div>
              <div className="s">{best.station.ville} · {eur(best.coutReel)} réel · détour {best.detourKm.toFixed(1)} km / {Math.round(best.detourMin)} min</div>
            </div>
          ) : stations.length > 0 && (
            <div className="best"><div className="k">Alerte</div><div className="n">Aucune station dans l'autonomie</div>
              <div className="s">Prends la plus proche immédiatement.</div></div>
          ))}

          <ol>
            {classement.slice(0, 12).map((c) => (
              <li key={c.station.id} className={c === best ? 'top' : ''}>
                <span className="nm">{nom(c.station)}
                  {c === cheap && c !== best && <span className="trap"> · moins cher au litre, pas au total</span>}
                </span>
                <span className="tot">{eur(c.coutReel)}</span>
                <span className="dt">{c.prix.toFixed(3)} €/L · <span className="old">{quand(c)}</span> · plein {c.coutPlein.toFixed(2)} + détour {c.coutDetour.toFixed(2)} + temps {c.coutTemps.toFixed(2)}
                  {c.prixPerime && <span className="old"> · prix &gt; 24 h</span>}</span>
              </li>
            ))}
          </ol>
          <p className="note">Coût réel = plein + carburant du détour + temps du chauffeur. Recalculé tous les {RECALCUL_M} m.</p>
        </div>

        {prochain && (
          <a className="cta" target="_blank" rel="noreferrer"
            href={`https://www.google.com/maps/dir/?api=1&destination=${prochain.lat},${prochain.lon}`}>
            {prochain.plein ? 'Y aller · plein' : 'Y aller · livraison 1'}
          </a>
        )}
      </div>
    </>
  );
}
