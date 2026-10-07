import type { NextApiRequest, NextApiResponse } from 'next';

/** Texte → voix (mp3 base64), via Voxtral TTS (Mistral). */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });
  const cle = process.env.MISTRAL_API_KEY;
  if (!cle) return res.status(500).json({ error: 'MISTRAL_API_KEY manquante dans .env.local' });
  const { texte, voix = 'en_paul_neutral' } = req.body as { texte: string; voix?: string };
  if (!texte?.trim()) return res.status(400).json({ error: 'Texte vide' });

  const r = await fetch('https://api.mistral.ai/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
    body: JSON.stringify({ model: 'voxtral-mini-tts-latest', input: texte.slice(0, 1000), voice: voix }),
  });
  const d = await r.json();
  if (!r.ok || !d.audio_data) return res.status(502).json({ error: d.message ?? `Voxtral TTS ${r.status}` });
  return res.status(200).json({ audio: d.audio_data, format: 'mp3' });
}
