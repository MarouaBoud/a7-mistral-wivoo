export type FuelType = 'Diesel' | 'Essence' | 'Electric' | 'Hybrid' | 'GPL';

export interface Vehicle {
  id: number;
  modele: string;
  type: string;
  carburant: FuelType;
  consommation: number; // Litres aux 100km
  capacite_kg: number; // Capacité de chargement en kg
  volume_m3: number; // Volume utile en m3
  autonomie_km: number; // Autonomie en km
  annee: number;
}
