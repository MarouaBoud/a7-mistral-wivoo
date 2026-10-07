import { StationRecord, StationData } from '../types/station';

/**
 * Transforms raw API station record into a cleaner StationData format
 */
export function transformStationRecord(record: StationRecord): StationData {
  const { geom, ...rest } = record;

  const stationData: StationData = {
    id: rest.id,
    nom: rest.nom,
    adresse: rest.adresse,
    ville: rest.ville,
    codePostal: rest.code_postal,
    latitude: geom.lat,
    longitude: geom.lon,
    carburants: {},
  };

  // Map fuel data
  const fuels = [
    { key: 'gazole' as const, prix: rest.gazole_prix, maj: rest.gazole_maj, rupture: rest.gazole_rupture },
    { key: 'sp95' as const, prix: rest.sp95_prix, maj: rest.sp95_maj, rupture: rest.sp95_rupture },
    { key: 'sp98' as const, prix: rest.sp98_prix, maj: rest.sp98_maj, rupture: rest.sp98_rupture },
    { key: 'e10' as const, prix: rest.e10_prix, maj: rest.e10_maj, rupture: rest.e10_rupture },
    { key: 'e85' as const, prix: rest.e85_prix, maj: rest.e85_maj, rupture: rest.e85_rupture },
    { key: 'gplc' as const, prix: rest.gplc_prix, maj: rest.gplc_maj, rupture: rest.gplc_rupture },
  ];

  for (const { key, prix, maj, rupture } of fuels) {
    if (prix !== null && prix !== undefined && !rupture) {
      stationData.carburants[key] = {
        prix,
        dateMaj: maj || '',
        enRupture: rupture || false,
      };
    }
  }

  return stationData;
}

/**
 * Formats a price for display
 */
export function formatPrice(prix: number): string {
  return prix.toFixed(3).replace('.', ',');
}

/**
 * Formats a date string for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'Inconnue';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Checks if a price is recent (less than 24 hours old)
 */
export function isPriceRecent(dateString: string): boolean {
  if (!dateString) return false;

  try {
    const date = new Date(dateString);
    const now = new Date();
    const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  } catch {
    return false;
  }
}

/**
 * Gets the cheapest available fuel for a station
 */
export function getCheapestFuel(station: StationData): {
  fuel: string;
  price: number;
  dateMaj: string;
} | null {
  const entries = Object.entries(station.carburants);

  if (entries.length === 0) return null;

  let cheapest = entries[0];

  for (const [fuel, data] of entries) {
    if (data.prix < cheapest[1].prix) {
      cheapest = [fuel, data];
    }
  }

  return {
    fuel: cheapest[0],
    price: cheapest[1].prix,
    dateMaj: cheapest[1].dateMaj,
  };
}