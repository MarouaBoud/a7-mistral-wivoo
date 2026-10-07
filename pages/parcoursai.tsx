import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
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
.err{color:#e10500;font-size:13px}
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
  const [texte, setTexte] = useState('');
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const fin = useRef<HTMLDivElement>(null);

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
      setMessages([...fil, { role: 'assistant', content: d.reponse }]);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally { setAttente(false); }
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
          <h1>Copilote PleinJuste</h1>
          <div className="sub">{c.prenom} {c.nom} · agent Mistral</div>
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
              <div className="outil">Demande-moi où faire le plein :</div>
              {SUGGESTIONS.map((s) => <button key={s} onClick={() => envoyer(s)}>{s}</button>)}
            </div>
          )}
          {messages.map((m, i) => <div key={i} className={`b ${m.role}`}>{m.content}</div>)}
          {!attente && outils.length > 0 && <div className="outil">🔧 {outils.join(' · ')}</div>}
          {attente && <div className="b assistant">…</div>}
          {erreur && <div className="err">{erreur}</div>}
          <div ref={fin} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); envoyer(texte); }}>
          <input value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Pose ta question…" />
          <button disabled={attente || !texte.trim()}>Envoyer</button>
        </form>
      </div>
    </>
  );
}
