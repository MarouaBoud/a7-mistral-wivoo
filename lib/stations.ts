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
    { field: 'gazole', key: 'gazole' },
    { field: 'sp95', key: 'sp95' },
    { field: 'sp98', key: 'sp98' },
    { field: 'e10', key: 'e10' },
    { field: 'e85', key: 'e85' },
    { field: 'gplc', key: 'gplc' },
  ] as const;
  type FuelField = 'gazole' | 'sp95' | 'sp98' | 'e10' | 'e85' | 'gplc';
  const fuelFields: FuelField[] = ['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'];

  for (const field of fuelFields) {
    const prix = rest[`${field}_prix` as const];
    const maj = rest[`${field}_maj` as const];
    const rupture = rest[`${field}_rupture` as const];

    if (prix !== null && prix !== undefined && !rupture) {
      stationData.carburants[field] = {
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
