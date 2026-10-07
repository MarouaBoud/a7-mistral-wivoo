import { Point, Vehicule, Carburant } from './cout';
import drivers from '../data/drivers.json';
import vehicles from '../data/vehicles.json';
import { Driver } from '../types/driver';
import { Vehicle } from '../types/vehicle';

export const GRADUATIONS_JAUGE = 8; // segments affichés au tableau de bord

export interface Livraison extends Point { id: string; client: string; adresse: string; plein?: boolean; gain?: { euros: number; vs: string } }

export interface Tournee { id: string; nom: string; depart: Point; livraisons: Livraison[] }

export const CONDUCTEURS = drivers as Driver[];

const CARBURANTS: Record<string, Carburant | undefined> = { Diesel: 'gazole', Essence: 'e10', GPL: 'gplc', Hybrid: 'e10' };

export interface VehiculeProfil extends Vehicule { id: number; modele: string; type: string }

/** Véhicules thermiques de la flotte ; réservoir déduit de l'autonomie constructeur. */
export const VEHICULES: VehiculeProfil[] = (vehicles as Vehicle[]).flatMap((v) => {
  const carburant = CARBURANTS[v.carburant];
  if (!carburant) return [];
  return [{ id: v.id, modele: v.modele, type: v.type, consoL100: v.consommation, reservoirL: Math.round((v.autonomie_km * v.consommation) / 100), niveauL: 0, carburant }];
});

const L = (id: string, client: string, adresse: string, lat: number, lon: number): Livraison => ({ id, client, adresse, lat, lon });

export const TOURNEES: Tournee[] = [
  {
    id: 'centre', nom: 'Paris Centre → Levallois', depart: { lat: 48.8584, lon: 2.3470 },
    livraisons: [
      L('C1', 'Boulangerie Martin', '12 rue de Rivoli, Paris 4e', 48.8556, 2.3600),
      L('C2', 'Pharmacie Bastille', '3 place de la Bastille, Paris 11e', 48.8532, 2.3692),
      L('C3', 'Épicerie Oberkampf', '98 rue Oberkampf, Paris 11e', 48.8656, 2.3779),
      L('C4', 'Fleuriste Batignolles', '40 rue des Batignolles, Paris 17e', 48.8846, 2.3196),
      L('C5', 'Cave de Levallois', '55 rue Rivay, Levallois', 48.8925, 2.2869),
    ],
  },
  {
    id: 'sud', nom: 'Rungis → Paris Sud', depart: { lat: 48.7570, lon: 2.3520 },
    livraisons: [
      L('S1', 'Primeur Ivry', '20 rue Marat, Ivry-sur-Seine', 48.8120, 2.3870),
      L('S2', 'Restaurant Italie', '5 place d’Italie, Paris 13e', 48.8310, 2.3560),
      L('S3', 'Brasserie Montparnasse', '102 bd Montparnasse, Paris 14e', 48.8420, 2.3290),
      L('S4', 'Traiteur Issy', '8 rue Guynemer, Issy-les-Moulineaux', 48.8240, 2.2700),
    ],
  },
  {
    id: 'nord', nom: 'Saint-Denis → Montreuil', depart: { lat: 48.9360, lon: 2.3570 },
    livraisons: [
      L('N1', 'Supérette Aubervilliers', '30 av. Jean Jaurès, Aubervilliers', 48.9100, 2.3830),
      L('N2', 'Café Pantin', '12 rue Hoche, Pantin', 48.8940, 2.4090),
      L('N3', 'Boucherie Bagnolet', '45 rue Sadi Carnot, Bagnolet', 48.8700, 2.4180),
      L('N4', 'Bio Montreuil', '7 rue de Paris, Montreuil', 48.8560, 2.4380),
    ],
  },
];
