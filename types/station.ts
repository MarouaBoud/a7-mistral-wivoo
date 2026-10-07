export interface StationRecord {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  geom: {
    lat: number;
    lon: number;
  };
  gazole_prix: number | null;
  gazole_maj: string | null; // Date string
  sp95_prix: number | null;
  sp95_maj: string | null;
  sp98_prix: number | null;
  sp98_maj: string | null;
  e10_prix: number | null;
  e10_maj: string | null;
  e85_prix: number | null;
  e85_maj: string | null;
  gplc_prix: number | null;
  gplc_maj: string | null;
  gazole_rupture: boolean;
  sp95_rupture: boolean;
  sp98_rupture: boolean;
  e10_rupture: boolean;
  e85_rupture: boolean;
  gplc_rupture: boolean;
}

export interface StationData {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  latitude: number;
  longitude: number;
  carburants: {
    gazole?: {
      prix: number;
      dateMaj: string;
      enRupture: boolean;
    };
    sp95?: {
      prix: number;
      dateMaj: string;
      enRupture: boolean;
    };
    sp98?: {
      prix: number;
      dateMaj: string;
      enRupture: boolean;
    };
    e10?: {
      prix: number;
      dateMaj: string;
      enRupture: boolean;
    };
    e85?: {
      prix: number;
      dateMaj: string;
      enRupture: boolean;
    };
    gplc?: {
      prix: number;
      dateMaj: string;
      enRupture: boolean;
    };
  };
}

export interface ApiResponse {
  results: StationRecord[];
  total: number;
}

export interface SearchParams {
  lat: number;
  lon: number;
  rayon: number;
  carburant?: string;
  limit?: number;
}
