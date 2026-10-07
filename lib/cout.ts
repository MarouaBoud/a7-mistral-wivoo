import { StationData } from '../types/station';

export type Carburant = 'gazole' | 'sp95' | 'sp98' | 'e10' | 'e85' | 'gplc';

export interface Point { lat: number; lon: number }

export interface Vehicule {
  consoL100: number;
  reservoirL: number;
  niveauL: number;
  carburant: Carburant;
}

export interface Hypotheses {
  coutHoraireChauffeur: number; // €/h
  facteurRoute: number;         // distance route / vol d'oiseau
  vitesseKmh: number;           // vitesse moyenne en tournée
}

export const HYPOTHESES_DEFAUT: Hypotheses = { coutHoraireChauffeur: 30, facteurRoute: 1.3, vitesseKmh: 35 };

export interface CoutStation {
  station: StationData;
  prix: number;
  prixPerime: boolean;
  litres: number;
  detourKm: number;
  detourMin: number;
  coutPlein: number;
  coutDetour: number;
  coutTemps: number;
  coutReel: number;
}

const MARGE_AUTONOMIE = 0.15;

/** Distance route estimée (haversine × facteur de sinuosité), en km. */
export function distanceKm(a: Point, b: Point, facteurRoute: number): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)) * facteurRoute;
}

/** Coût réel d'un plein à une station donnée, détour depuis A vers B déjà calculé. */
export function coutReel(prix: number, litres: number, detourKm: number, detourMin: number, v: Vehicule, h: Hypotheses) {
  const coutPlein = litres * prix;
  const coutDetour = detourKm * (v.consoL100 / 100) * prix;
  const coutTemps = (detourMin / 60) * h.coutHoraireChauffeur;
  return { coutPlein, coutDetour, coutTemps, coutReel: coutPlein + coutDetour + coutTemps };
}

/** Classe les stations par coût réel croissant ; exclut hors autonomie, rupture, carburant absent. */
export function classerStations(
  stations: StationData[], a: Point, b: Point, v: Vehicule, h: Hypotheses = HYPOTHESES_DEFAUT, maintenant = new Date(),
): CoutStation[] {
  const autonomieKm = (v.niveauL / v.consoL100) * 100 * (1 - MARGE_AUTONOMIE);
  const litres = Math.max(0, v.reservoirL - v.niveauL);
  const dAB = distanceKm(a, b, h.facteurRoute);

  return stations
    .flatMap((s) => {
      const c = s.carburants[v.carburant];
      if (!c || c.enRupture) return [];
      const S = { lat: s.latitude, lon: s.longitude };
      const dAS = distanceKm(a, S, h.facteurRoute);
      if (dAS > autonomieKm) return [];
      const detourKm = dAS + distanceKm(S, b, h.facteurRoute) - dAB;
      const detourMin = (detourKm / h.vitesseKmh) * 60;
      const age = c.dateMaj ? maintenant.getTime() - new Date(c.dateMaj).getTime() : Infinity;
      return [{
        station: s, prix: c.prix, prixPerime: age > 24 * 3600 * 1000, litres, detourKm, detourMin,
        ...coutReel(c.prix, litres, detourKm, detourMin, v, h),
      }];
    })
    .sort((x, y) => x.coutReel - y.coutReel);
}

const nomStation = (s: StationData) => s.nom || `la station ${s.adresse}, ${s.ville}`;

const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

/** Phrase courte, lisible à voix haute, pour le conducteur. */
export function messageConducteur(classement: CoutStation[]): string {
  if (classement.length === 0) return 'Aucune station accessible avec ton autonomie actuelle.';
  const best = classement[0];
  const moinsChere = classement.reduce((m, c) => (c.prix < m.prix ? c : m));
  const base = `Arrête-toi à ${nomStation(best.station)} (détour de ${best.detourKm.toFixed(1).replace('.', ',')} km).`;
  if (moinsChere === best) return base + ' C\'est aussi la moins chère au litre.';
  return base + ` La station ${moinsChere.station.adresse} est moins chère au litre mais te coûterait ${eur(moinsChere.coutReel - best.coutReel)} de plus avec le détour.`;
}

export { eur };

export interface CoutStationTournee extends CoutStation { troncon: number }

/**
 * Teste chaque station sur chaque tronçon restant (position → L1 → L2 …) tant qu'elle reste
 * dans l'autonomie, et garde le tronçon le moins coûteux. troncon = 0 : avant la 1re livraison.
 */
export function classerTournee(
  stations: StationData[], position: Point, arrets: Point[], v: Vehicule, h: Hypotheses = HYPOTHESES_DEFAUT, maintenant = new Date(),
): CoutStationTournee[] {
  const pts = [position, ...arrets];
  const autonomieKm = (v.niveauL / v.consoL100) * 100 * (1 - MARGE_AUTONOMIE);
  const parStation = new Map<string, CoutStationTournee>();
  let cumul = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const v2 = { ...v, niveauL: Math.max(0, v.niveauL - (cumul * v.consoL100) / 100) };
    for (const c of classerStations(stations, pts[i], pts[i + 1], v2, h, maintenant)) {
      if (cumul + distanceKm(pts[i], { lat: c.station.latitude, lon: c.station.longitude }, h.facteurRoute) > autonomieKm) continue;
      const prec = parStation.get(c.station.id);
      // litres identiques quel que soit le tronçon : on compare sur le plein initial
      const ajuste = { ...c, ...coutReel(c.prix, v.reservoirL - v.niveauL, c.detourKm, c.detourMin, v, h), troncon: i };
      if (!prec || ajuste.coutReel < prec.coutReel) parStation.set(c.station.id, ajuste);
    }
    cumul += distanceKm(pts[i], pts[i + 1], h.facteurRoute);
  }
  return Array.from(parStation.values()).sort((x, y) => x.coutReel - y.coutReel);
}
