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
:root{--bg:#fffaeb;--surface:#fff;--ink:#1e1e1e;--muted:#6b5f4f;--line:#ead9b8;--accent:#fa500f;--route:#1e1e1e;
--display:"Archivo Black",system-ui,sans-serif;--body:"Archivo",-apple-system,system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#141210;--surface:#1f1b17;--ink:#fff3d9;--muted:#b3a58c;--line:#3a3128;--accent:#ff8205;--route:#fff3d9}}
html,body{margin:0;height:100%;overflow:hidden;background:var(--bg);overscroll-behavior:none}
.app{position:fixed;inset:0;color:var(--ink);font:15px/1.35 var(--body);-webkit-tap-highlight-color:transparent}
.app button{font-family:inherit;border:0;cursor:pointer;-webkit-appearance:none}
.map{position:absolute;inset:0}
.topbar{position:absolute;z-index:1000;top:calc(10px + env(safe-area-inset-top));left:12px;right:12px;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.idcard{pointer-events:auto;display:flex;align-items:center;gap:12px;background:var(--ink);color:var(--bg);border-radius:18px;padding:10px 14px;box-shadow:0 6px 24px #0003}
.avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#ffaf00,#e10500);display:grid;place-items:center;font:400 15px var(--display);color:#1e1e1e;flex:none}
.idcard .who{font-weight:600;font-size:16px}.idcard .car{font:500 11px var(--mono);opacity:.7;letter-spacing:.03em}
.status{align-self:flex-start;pointer-events:auto;background:var(--surface);border-radius:999px;padding:6px 12px;font:500 12px var(--mono);box-shadow:0 2px 10px #0002}
.recentrer{position:absolute;z-index:1000;right:12px;width:44px;height:44px;border-radius:50%;background:var(--surface);color:var(--ink);font-size:20px;box-shadow:0 2px 12px #0003}
.sheet{position:absolute;z-index:1000;left:0;right:0;bottom:0;background:var(--surface);border-radius:24px 24px 0 0;
padding:8px 16px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -6px 30px #0003;display:flex;flex-direction:column;gap:12px;max-width:520px;margin:0 auto}
.grab{width:38px;height:5px;border-radius:3px;background:var(--line);margin:0 auto}
.next{display:flex;align-items:center;gap:12px}
.next .no{width:36px;height:36px;border-radius:12px;background:#e10500;color:#fff;display:grid;place-items:center;font:400 16px var(--display);flex:none}
.next .no.plein{background:#ffaf00;color:#1e1e1e}
.next .txt{flex:1;min-width:0}.next .k{font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.next .nm{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.next .ad{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.next .done{background:var(--bg);color:var(--ink);border:1px solid var(--line)!important;border-radius:12px;padding:9px 12px;font-weight:600;font-size:13px;flex:none}
.jauge{background:#111;border-radius:16px;padding:10px 12px}
.jauge .row{display:flex;justify-content:space-between;align-items:baseline;font:500 11px var(--mono);color:#9a8a70;text-transform:uppercase;letter-spacing:.05em}
.jauge .val{font:500 22px var(--mono);color:#ffb000;text-shadow:0 0 8px #ffb00088;text-transform:none}
.segs{display:flex;align-items:center;gap:4px;margin-top:8px;font:500 13px var(--mono);color:#9a8a70}
.segs button{flex:1;height:26px;border-radius:4px;background:#2a2620}
.segs button.on{background:#ffb000;box-shadow:0 0 8px #ffb00088}
.segs button.on.low{background:#e10500;box-shadow:0 0 8px #e1050088}
.actions{display:flex;flex-direction:column;gap:8px}
.actions>*{flex:1;height:54px;border-radius:16px;display:grid;place-items:center;font:400 15px var(--display);letter-spacing:.03em;text-transform:uppercase;text-decoration:none}
.plein{background:var(--ink);color:var(--bg)}.plein:disabled{opacity:.5}
.go{background:var(--accent);color:#fff}
.leaflet-tooltip.num{background:none;border:0;box-shadow:none;color:#fff;font:700 12px var(--mono);padding:0}.leaflet-tooltip.num:before{display:none}
.leaflet-control-attribution{font-size:9px}
/* Sur ordinateur : rendu dans un cadre iPhone */
@media (min-width:500px){
 html,body{background:#d9d4c7}
 .app{inset:auto;top:50%;left:50%;transform:translate(-50%,-50%);width:393px;height:min(852px,calc(100vh - 40px));border-radius:54px;overflow:hidden;
  box-shadow:0 0 0 12px #111,0 0 0 14px #3a3a3a,0 30px 80px #0006;isolation:isolate}
 .app::before{content:"";position:absolute;z-index:3000;top:11px;left:50%;transform:translateX(-50%);width:120px;height:34px;border-radius:20px;background:#000}
 .topbar{top:56px}
 .sheet{padding-bottom:28px}
}
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
  const autonomie = (niveauL / VEHICULE.consoL100) * 100 * 0.85;

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="app">
        <div className="map">
          <LiveMap position={position} trace={trace} arrets={arrets} classement={classement} suivre={suivre}
            onDeplacement={() => setSuivre(false)} />
        </div>

        <div className="topbar">
          <div className="idcard">
            <div className="avatar">{CONDUCTEUR.prenom[0]}{CONDUCTEUR.nom[0]}</div>
            <div>
              <div className="who">{CONDUCTEUR.prenom} {CONDUCTEUR.nom}</div>
              <div className="car">{VEHICULE.modele} · {VEHICULE.immat}</div>
            </div>
          </div>
          <div className="status">{erreur ?? (!position ? 'Signal GPS…' : !prochain ? 'Tournée terminée' :
            `${prochain.plein ? 'Plein' : 'Livraison'} à ${distanceKm(position, prochain, 1.3).toFixed(1).replace('.', ',')} km`)}</div>
        </div>

        <div className="sheet">
          <div className="grab" />
          {!suivre && <button className="recentrer" style={{ top: -56 }} onClick={() => setSuivre(true)} aria-label="Recentrer">◎</button>}

          {prochain && (
            <div className="next">
              <div className={`no ${prochain.plein ? 'plein' : ''}`}>{prochain.plein ? '⛽' : LIVRAISONS.length - livraisons.length + 1}</div>
              <div className="txt">
                <div className="k">{prochain.plein ? 'Arrêt plein' : `Prochaine livraison · ${livraisons.length} restante${livraisons.length > 1 ? 's' : ''}`}</div>
                <div className="nm">{prochain.client.replace('⛽ Plein · ', '')}</div>
                <div className="ad">{prochain.adresse}</div>
              </div>
              <button className="done" onClick={prochain.plein ? pleinFait : livrer}>{prochain.plein ? 'Plein fait' : 'Livré ✓'}</button>
            </div>
          )}

          <div className="jauge">
            <div className="row"><span>Carburant</span><span className="val">{Math.round(niveauL)} L · {Math.round(autonomie)} km</span></div>
            <div className="segs" role="group" aria-label="Niveau de carburant">
              <span>E</span>
              {Array.from({ length: GRADUATIONS_JAUGE }, (_, i) => (
                <button key={i} aria-label={`${i + 1}/${GRADUATIONS_JAUGE}`} onClick={() => setCrans(i + 1 === crans ? i : i + 1)}
                  className={`${i < crans ? 'on' : ''} ${crans <= 1 ? 'low' : ''}`} />
              ))}
              <span>F</span>
            </div>
          </div>

          <div className="actions">
            <button className="plein" onClick={pleinMaintenant} disabled={cherche}>{cherche ? 'Recherche…' : '⛽ Trouver la station'}</button>
            {prochain && (
              <a className="go" target="_blank" rel="noreferrer"
                href={`https://maps.apple.com/?daddr=${prochain.lat},${prochain.lon}&dirflg=d`}>Y aller</a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
