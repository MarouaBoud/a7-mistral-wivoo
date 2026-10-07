import React, { useRef, useState } from 'react';
import { Point } from '../lib/cout';
import { Livraison } from '../lib/tournee';

export interface Reco { adresse: string; prix_litre: number; detour_km: number; cout_reel: number; lat: number; lon: number }

interface Props {
  contexte: { vehiculeId: number; tourneeId: string; position: Point; niveauL: number; coutHoraire: number; livraisons: Livraison[] };
  onStation: (meilleure: Reco, moinsChere: Reco) => void;
}

type Msg = { role: 'user' | 'assistant'; content: string };

/** Copilote vocal sur la carte : micro maintenu → Voxtral (STT) → agent Mistral → Voxtral (TTS). */
export default function Copilote({ contexte, onStation }: Props) {
  const [fil, setFil] = useState<Msg[]>([]);
  const [etat, setEtat] = useState<'repos' | 'ecoute' | 'reflechit' | 'parle'>('repos');
  const [bulle, setBulle] = useState<string | null>(null);
  const [voixOn, setVoixOn] = useState(true);
  const enreg = useRef<MediaRecorder | null>(null);
  const lecteur = useRef<HTMLAudioElement | null>(null);

  function silence() { lecteur.current?.pause(); if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); }

  async function parler(texte: string) {
    if (!voixOn) { setEtat('repos'); return; }
    setEtat('parle');
    try {
      const r = await fetch('/api/voix/parler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texte }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const a = new Audio(`data:audio/mp3;base64,${d.audio}`);
      lecteur.current = a;
      a.onended = () => setEtat('repos');
      await a.play();
    } catch {
      const u = new SpeechSynthesisUtterance(texte);
      u.lang = 'fr-FR';
      u.onend = () => setEtat('repos');
      speechSynthesis.speak(u);
    }
  }

  async function demander(question: string) {
    const nouveau: Msg[] = [...fil, { role: 'user' as const, content: question }].slice(-8);
    setFil(nouveau);
    setBulle(`« ${question} »`);
    setEtat('reflechit');
    try {
      const r = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: nouveau, contexte }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setFil([...nouveau, { role: 'assistant', content: d.reponse }]);
      setBulle(d.reponse);
      const res = [...d.outils].reverse().find((o: { nom: string; resultat: { meilleure?: Reco } }) => o.nom === 'meilleure_station' && o.resultat.meilleure);
      if (res) onStation(res.resultat.meilleure, res.resultat.moins_chere_au_litre);
      parler(d.reponse);
    } catch (e) {
      setBulle(e instanceof Error ? e.message : String(e));
      setEtat('repos');
    }
  }

  async function debut(e: React.PointerEvent) {
    e.preventDefault();
    if (etat === 'ecoute' || etat === 'reflechit') return;
    silence();
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
      const rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
      const bouts: Blob[] = [];
      rec.ondataavailable = (ev) => ev.data.size && bouts.push(ev.data);
      rec.onstop = async () => {
        flux.getTracks().forEach((t) => t.stop());
        const audio = new Blob(bouts, { type: rec.mimeType });
        if (audio.size < 2000) { setEtat('repos'); return; }
        setEtat('reflechit');
        try {
          const r = await fetch('/api/voix/transcrire', { method: 'POST', headers: { 'Content-Type': rec.mimeType }, body: audio });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          if (d.texte) demander(d.texte); else { setBulle('Je n’ai rien entendu.'); setEtat('repos'); }
        } catch (err) {
          setBulle(err instanceof Error ? err.message : String(err)); setEtat('repos');
        }
      };
      rec.start();
      enreg.current = rec;
      setEtat('ecoute');
      setBulle('Je t’écoute…');
    } catch {
      setBulle('Autorise le micro pour parler au copilote.');
    }
  }

  function fin() { if (enreg.current?.state === 'recording') enreg.current.stop(); }

  return (
    <>
      {bulle && (
        <div className="cp-bulle" onClick={() => { setBulle(null); silence(); setEtat('repos'); }}>
          <span className="cp-k">Copilote · Voxtral</span>{bulle}
        </div>
      )}
      <div className="cp-boutons">
        <button className={`cp-micro ${etat}`} onPointerDown={debut} onPointerUp={fin} onPointerLeave={fin} onContextMenu={(e) => e.preventDefault()}
          aria-label="Maintenir pour parler au copilote">{etat === 'ecoute' ? '●' : etat === 'reflechit' ? '…' : '🎙️'}</button>
        <button className="cp-hp" onClick={() => { setVoixOn(!voixOn); silence(); }} aria-label="Voix on/off">{voixOn ? '🔊' : '🔇'}</button>
      </div>
    </>
  );
}
