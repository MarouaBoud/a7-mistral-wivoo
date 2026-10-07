import type { NextApiRequest, NextApiResponse } from 'next';
import { transformStationRecord } from '../../lib/stations';
import { classerStations, distanceKm, HYPOTHESES_DEFAUT, Point } from '../../lib/cout';
import { VEHICULES, TOURNEES } from '../../lib/tournee';
import { StationData } from '../../types/station';

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const MODELE = 'mistral-large-latest';

interface Contexte { vehiculeId: number; tourneeId: string; position: Point; niveauL: number; coutHoraire: number }
type Message = { role: string; content: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[]; tool_call_id?: string; name?: string };

const OUTILS = [
  {
    type: 'function', function: {
      name: 'meilleure_station',
      description: "Trouve la station où faire le plein au coût réel le plus bas (plein + carburant du détour + temps chauffeur) entre la position actuelle et la prochaine livraison. Renvoie aussi la moins chère au litre et la plus proche pour comparer.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function', function: {
      name: 'etat_tournee',
      description: 'Donne le véhicule, le niveau de carburant, l’autonomie restante et les livraisons à venir avec leur distance.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

async function stationsAutour(origin: string, a: Point, b: Point, carburant: string): Promise<StationData[]> {
  const mid = { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 };
  const rayon = Math.min(100, distanceKm(a, b, 1) / 2 + 10);
  const q = new URLSearchParams({ lat: `${mid.lat}`, lon: `${mid.lon}`, rayon: `${rayon}`, carburant, limit: '100' });
  const d = await (await fetch(`${origin}/api/stations?${q}`)).json();
  if (d.error) throw new Error(d.error);
  return d.results.map(transformStationRecord);
}

async function executer(nom: string, ctx: Contexte, origin: string) {
  const v = VEHICULES.find((x) => x.id === ctx.vehiculeId) ?? VEHICULES[0];
  const t = TOURNEES.find((x) => x.id === ctx.tourneeId) ?? TOURNEES[0];
  const prochain = t.livraisons[0];
  const vehicule = { ...v, niveauL: ctx.niveauL };
  if (nom === 'etat_tournee') {
    return {
      vehicule: `${v.modele} (${v.type})`, conso_l_100km: v.consoL100, reservoir_l: v.reservoirL, niveau_l: ctx.niveauL,
      autonomie_km: Math.round((ctx.niveauL / v.consoL100) * 100 * 0.85),
      livraisons: t.livraisons.map((l) => ({ client: l.client, adresse: l.adresse, distance_km: +distanceKm(ctx.position, l, 1.3).toFixed(1) })),
    };
  }
  if (nom === 'meilleure_station') {
    const liste = classerStations(await stationsAutour(origin, ctx.position, prochain, v.carburant), ctx.position, prochain, vehicule,
      { ...HYPOTHESES_DEFAUT, coutHoraireChauffeur: ctx.coutHoraire });
    if (!liste.length) return { erreur: 'Aucune station accessible avec le carburant restant.' };
    const fmt = (c: typeof liste[0]) => ({
      adresse: `${c.station.adresse}, ${c.station.ville}`, prix_litre: c.prix, detour_km: +c.detourKm.toFixed(1), detour_min: Math.round(c.detourMin),
      cout_plein: +c.coutPlein.toFixed(2), cout_detour: +c.coutDetour.toFixed(2), cout_temps: +c.coutTemps.toFixed(2), cout_reel: +c.coutReel.toFixed(2),
      prix_perime: c.prixPerime, lat: c.station.latitude, lon: c.station.longitude,
    });
    return {
      prochaine_livraison: prochain.client,
      meilleure: fmt(liste[0]),
      moins_chere_au_litre: fmt(liste.reduce((m, x) => (x.prix < m.prix ? x : m))),
      plus_proche: fmt(liste.reduce((m, x) => (x.detourKm < m.detourKm ? x : m))),
      nb_stations_comparees: liste.length,
    };
  }
  return { erreur: `Outil inconnu : ${nom}` };
}

const SYSTEME = `Tu es PleinJuste, l'assistant carburant d'un chauffeur-livreur en tournée.
Règle : la meilleure station n'est pas la moins chère au litre, c'est celle au coût réel le plus bas (plein + carburant du détour + temps chauffeur).
Utilise toujours les outils pour les chiffres, n'invente jamais un prix ou une adresse.
Réponds en français, sans markdown ni astérisques, tutoie le chauffeur, 1 à 3 phrases courtes lisibles à voix haute pendant qu'il conduit.
Quand tu recommandes une station, donne l'adresse, le détour et l'économie en euros face à la moins chère au litre si elle est différente.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });
  const cle = process.env.MISTRAL_API_KEY;
  if (!cle) return res.status(500).json({ error: 'MISTRAL_API_KEY manquante dans .env.local' });

  const { messages, contexte } = req.body as { messages: Message[]; contexte: Contexte };
  const origin = `http://${req.headers.host}`;
  const fil: Message[] = [{ role: 'system', content: SYSTEME }, ...messages];
  const outilsAppeles: { nom: string; resultat: unknown }[] = [];

  try {
    for (let tour = 0; tour < 5; tour++) {
      const r = await fetch(MISTRAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
        body: JSON.stringify({ model: MODELE, messages: fil, tools: OUTILS, tool_choice: 'auto', temperature: 0.2 }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message ?? d.error?.message ?? `Mistral ${r.status}`);
      const msg = d.choices[0].message as Message;
      fil.push(msg);
      if (!msg.tool_calls?.length) return res.status(200).json({ reponse: msg.content, outils: outilsAppeles });
      for (const call of msg.tool_calls) {
        const resultat = await executer(call.function.name, contexte, origin);
        outilsAppeles.push({ nom: call.function.name, resultat });
        fil.push({ role: 'tool', name: call.function.name, tool_call_id: call.id, content: JSON.stringify(resultat) });
      }
    }
    return res.status(200).json({ reponse: 'Je n’ai pas réussi à conclure, repose ta question.', outils: outilsAppeles });
  } catch (e) {
    return res.status(502).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
