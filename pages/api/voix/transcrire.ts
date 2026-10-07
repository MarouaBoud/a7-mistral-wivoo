import type { NextApiRequest, NextApiResponse } from 'next';

// Corps brut (audio) : on désactive le parseur JSON de Next
export const config = { api: { bodyParser: false } };

/** Audio du micro → texte, via Voxtral (Mistral). */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });
  const cle = process.env.MISTRAL_API_KEY;
  if (!cle) return res.status(500).json({ error: 'MISTRAL_API_KEY manquante dans .env.local' });

  const morceaux: Buffer[] = [];
  for await (const m of req) morceaux.push(m as Buffer);
  const audio = Buffer.concat(morceaux);
  if (!audio.length) return res.status(400).json({ error: 'Audio vide' });

  const type = req.headers['content-type'] ?? 'audio/webm';
  const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : type.includes('wav') ? 'wav' : 'webm';
  const form = new FormData();
  form.append('model', 'voxtral-mini-latest');
  form.append('language', 'fr');
  form.append('file', new Blob([audio], { type }), `micro.${ext}`);

  const r = await fetch('https://api.mistral.ai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${cle}` }, body: form });
  const d = await r.json();
  if (!r.ok) return res.status(502).json({ error: d.message ?? `Voxtral ${r.status}` });
  return res.status(200).json({ texte: (d.text ?? '').trim() });
}
