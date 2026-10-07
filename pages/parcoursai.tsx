import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CONDUCTEURS, VEHICULES, TOURNEES, GRADUATIONS_JAUGE } from '../lib/tournee';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'Je suis sur la réserve, je fais le plein où ?',
  'Il me reste combien d’autonomie ?',
  'La station la moins chère vaut-elle le détour ?',
];

const CSS = `
:root{--bg:#fffaeb;--surface:#fff;--ink:#1e1e1e;--muted:#6b5f4f;--line:#ead9b8;--accent:#fa500f;
--display:"Archivo Black",system-ui,sans-serif;--body:"Archivo",-apple-system,system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#141210;--surface:#1f1b17;--ink:#fff3d9;--muted:#b3a58c;--line:#3a3128;--accent:#ff8205}}
html,body{margin:0;height:100%;background:var(--bg)}
.ai{position:fixed;inset:0;display:flex;flex-direction:column;color:var(--ink);font:15px/1.4 var(--body);background:var(--bg)}
.ai button,.ai select,.ai input{font-family:inherit}
.hd{padding:calc(12px + env(safe-area-inset-top)) 16px 10px;background:var(--ink);color:var(--bg)}
.retour{float:right;color:#ffb000;font:500 12px var(--mono);text-decoration:none;margin-top:4px}
.hd h1{font:400 20px var(--display);margin:0}.hd .sub{font:500 11px var(--mono);opacity:.7}
.ctx{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}
.ctx select{font-size:13px;padding:6px;border-radius:8px;border:0;background:#2c2620;color:#fff3d9;min-width:0}
.jauge{grid-column:1/-1;display:flex;align-items:center;gap:4px;font:500 12px var(--mono);color:#9a8a70}
.jauge button{flex:1;height:18px;border:0;border-radius:3px;background:#2a2620;cursor:pointer}.jauge button.on{background:#ffb000}
.fil{flex:1;overflow:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.b{max-width:85%;padding:10px 13px;border-radius:16px;white-space:pre-wrap}
.b.user{align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:4px}
.b.assistant{align-self:flex-start;background:var(--surface);border:1px solid var(--line);border-bottom-left-radius:4px}
.outil{align-self:flex-start;font:500 11px var(--mono);color:var(--muted)}
.sugg{display:flex;flex-direction:column;gap:6px}
.sugg button{text-align:left;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer}
.carte{align-self:stretch;border:0;border-radius:14px;padding:14px;background:var(--ink);color:var(--bg);font:400 14px var(--display);text-transform:uppercase;letter-spacing:.02em;cursor:pointer;text-align:left}
.err{color:#e10500;font-size:13px}
.voix{display:flex;align-items:center;gap:12px;padding:10px 16px;border-top:1px solid var(--line);background:var(--surface)}
.micro{width:72px;height:72px;border-radius:50%;border:0;background:var(--accent);color:#fff;font-size:30px;cursor:pointer;flex:none;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 6px 18px #fa500f55;transition:transform .15s}
.micro.rec{background:#e10500;transform:scale(1.12);animation:pulse 1s infinite}
.micro.talk{animation:pulse 1.4s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 #e1050088}100%{box-shadow:0 0 0 22px #e1050000}}
.voix .lg{flex:1;font:500 12px var(--mono);color:var(--muted)}
.voix .hp{border:0;background:var(--bg);border-radius:50%;width:42px;height:42px;font-size:18px;cursor:pointer}
form{display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));border-top:1px solid var(--line);background:var(--surface)}
form input{flex:1;font-size:16px;padding:12px;border-radius:14px;border:1px solid var(--line);background:var(--bg);color:var(--ink)}
form button{border:0;border-radius:14px;padding:0 16px;background:var(--accent);color:#fff;font:400 14px var(--display);text-transform:uppercase;cursor:pointer}
form button:disabled{opacity:.5}
@media (min-width:500px){html,body{background:#d9d4c7}
 .ai{inset:auto;top:50%;left:50%;transform:translate(-50%,-50%);width:393px;height:min(852px,calc(100vh - 40px));border-radius:54px;overflow:hidden;box-shadow:0 0 0 12px #111,0 0 0 14px #3a3a3a,0 30px 80px #0006}
 .hd{padding-top:56px}}
`;

export default function ParcoursAI() {
  const [conducteur, setConducteur] = useState(CONDUCTEURS[0].id);
  const [vehiculeId, setVehiculeId] = useState(VEHICULES[0].id);
  const [tourneeId, setTourneeId] = useState(TOURNEES[0].id);
  const [crans, setCrans] = useState(1);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [outils, setOutils] = useState<string[]>([]);
  type Reco = { adresse: string; prix_litre: number; detour_km: number; cout_reel: number; lat: number; lon: number };
  const [reco, setReco] = useState<{ meilleure: Reco; moins_chere_au_litre: Reco } | null>(null);
  const router = useRouter();
  const [texte, setTexte] = useState('');
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const fin = useRef<HTMLDivElement>(null);
  const [ecoute, setEcoute] = useState(false);
  const [voixOn, setVoixOn] = useState(true);
  const [parle, setParle] = useState(false);
  const enreg = useRef<MediaRecorder | null>(null);
  const lecteur = useRef<HTMLAudioElement | null>(null);

  const v = VEHICULES.find((x) => x.id === vehiculeId)!;
  const t = TOURNEES.find((x) => x.id === tourneeId)!;
  const c = CONDUCTEURS.find((x) => x.id === conducteur)!;
  const niveauL = Math.round((v.reservoirL * crans) / GRADUATIONS_JAUGE);

  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, attente]);

  async function envoyer(q: string) {
    if (!q.trim() || attente) return;
    const fil: Msg[] = [...messages, { role: 'user', content: q.trim() }];
    setMessages(fil); setTexte(''); setAttente(true); setErreur(null);
    try {
      const r = await fetch('/api/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: fil, contexte: { vehiculeId, tourneeId, position: t.depart, niveauL, coutHoraire: 28 } }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setOutils(d.outils.map((o: { nom: string }) => o.nom));
      const res = [...d.outils].reverse().find((o: { nom: string; resultat: { meilleure?: Reco } }) => o.nom === 'meilleure_station' && o.resultat.meilleure);
      if (res) setReco(res.resultat);
      setMessages([...fil, { role: 'assistant', content: d.reponse }]);
      if (voixOn) parler(d.reponse);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally { setAttente(false); }
  }

  // Voxtral TTS : lit la réponse à voix haute (repli : synthèse du navigateur)
  async function parler(texte: string) {
    lecteur.current?.pause();
    setParle(true);
    try {
      const r = await fetch('/api/voix/parler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texte }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const a = new Audio(`data:audio/mp3;base64,${d.audio}`);
      lecteur.current = a;
      a.onended = () => setParle(false);
      await a.play();
    } catch {
      const u = new SpeechSynthesisUtterance(texte);
      u.lang = 'fr-FR';
      u.onend = () => setParle(false);
      speechSynthesis.speak(u);
    }
  }

  // Voxtral STT : appuyer pour parler, relâcher pour envoyer
  async function demarrerMicro() {
    if (ecoute || attente) return;
    lecteur.current?.pause(); speechSynthesis.cancel(); setParle(false);
    setErreur(null);
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
      const rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
      const bouts: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && bouts.push(e.data);
      rec.onstop = async () => {
        flux.getTracks().forEach((t) => t.stop());
        const audio = new Blob(bouts, { type: rec.mimeType });
        if (audio.size < 2000) return; // appui trop court
        setAttente(true);
        try {
          const r = await fetch('/api/voix/transcrire', { method: 'POST', headers: { 'Content-Type': rec.mimeType }, body: audio });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setAttente(false);
          if (d.texte) envoyer(d.texte); else setErreur('Je n’ai rien entendu.');
        } catch (e) {
          setAttente(false);
          setErreur(e instanceof Error ? e.message : String(e));
        }
      };
      rec.start();
      enreg.current = rec;
      setEcoute(true);
    } catch {
      setErreur('Autorise le micro pour parler au copilote.');
    }
  }
  function arreterMicro() {
    if (enreg.current?.state === 'recording') enreg.current.stop();
    setEcoute(false);
  }

  // Passe la station recommandée à la carte (page d'accueil), avec le même profil et le même trajet
  function voirSurCarte() {
    if (!reco) return;
    const m = reco.meilleure, ref = reco.moins_chere_au_litre;
    try {
      localStorage.setItem('pj-depuis-ai', JSON.stringify({
        choix: { conducteur, vehicule: vehiculeId, tournee: tourneeId }, crans,
        station: m, gain: ref && ref.adresse !== m.adresse ? { euros: ref.cout_reel - m.cout_reel, vs: 'la moins chère au litre' } : undefined,
      }));
    } catch { /* stockage indisponible */ }
    router.push('/');
  }

  return (
    <>
      <Head>
        <title>PleinJuste · Copilote</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ai">
        <div className="hd">
          <a href="/" className="retour">← Carte</a>
          <h1>Copilote PleinJuste</h1>
          <div className="sub">{c.prenom} {c.nom} · Mistral + Voxtral</div>
          <div className="ctx">
            <select value={conducteur} onChange={(e) => setConducteur(+e.target.value)}>
              {CONDUCTEURS.map((x) => <option key={x.id} value={x.id}>{x.prenom} {x.nom}</option>)}
            </select>
            <select value={vehiculeId} onChange={(e) => setVehiculeId(+e.target.value)}>
              {VEHICULES.map((x) => <option key={x.id} value={x.id}>{x.modele}</option>)}
            </select>
            <select value={tourneeId} onChange={(e) => setTourneeId(e.target.value)} style={{ gridColumn: '1/-1' }}>
              {TOURNEES.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
            </select>
            <div className="jauge">E
              {Array.from({ length: GRADUATIONS_JAUGE }, (_, i) => (
                <button key={i} className={i < crans ? 'on' : ''} onClick={() => setCrans(i + 1 === crans ? i : i + 1)} aria-label={`${i + 1}/${GRADUATIONS_JAUGE}`} />
              ))}F · {niveauL} L
            </div>
          </div>
        </div>

        <div className="fil">
          {messages.length === 0 && (
            <div className="sugg">
              <div className="outil">Maintiens le micro et parle, ou touche une question :</div>
              {SUGGESTIONS.map((s) => <button key={s} onClick={() => envoyer(s)}>{s}</button>)}
            </div>
          )}
          {messages.map((m, i) => <div key={i} className={`b ${m.role}`}>{m.content}</div>)}
          {!attente && outils.length > 0 && <div className="outil">🔧 {outils.join(' · ')}</div>}
          {!attente && reco && <button className="carte" onClick={voirSurCarte}>🗺️ Voir sur la carte · {reco.meilleure.adresse}</button>}
          {attente && <div className="b assistant">…</div>}
          {erreur && <div className="err">{erreur}</div>}
          <div ref={fin} />
        </div>

        <div className="voix">
          <button className={`micro ${ecoute ? 'rec' : ''} ${parle ? 'talk' : ''}`}
            onPointerDown={demarrerMicro} onPointerUp={arreterMicro} onPointerLeave={arreterMicro}
            aria-label="Maintenir pour parler">{ecoute ? '●' : '🎙️'}</button>
          <div className="lg">{ecoute ? 'Je t’écoute… relâche pour envoyer' : attente ? 'Voxtral réfléchit…' : parle ? 'Je te réponds…' : 'Maintiens pour parler'}</div>
          <button className="hp" onClick={() => { setVoixOn(!voixOn); lecteur.current?.pause(); speechSynthesis.cancel(); }}>{voixOn ? '🔊' : '🔇'}</button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); envoyer(texte); }}>
          <input value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Pose ta question…" />
          <button disabled={attente || !texte.trim()}>Envoyer</button>
        </form>
      </div>
    </>
  );
}
