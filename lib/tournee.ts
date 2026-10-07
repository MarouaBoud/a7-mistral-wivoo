import { Point } from './cout';

// Données d'exemple : en production, affectées par le gestionnaire (Karim).
export const CONDUCTEUR = { prenom: 'Karim', nom: 'Benali' };
export const VEHICULE = { modele: 'Renault Master 12 m³', immat: 'GH-482-KT', consoL100: 9.5, reservoirL: 80, carburant: 'gazole' as const };
export const GRADUATIONS_JAUGE = 8; // segments affichés au tableau de bord

export interface Livraison extends Point { id: string; client: string; adresse: string }

export const LIVRAISONS: Livraison[] = [
  { id: 'L1', client: 'Boulangerie Martin', adresse: '12 rue de Rivoli, Paris 4e', lat: 48.8556, lon: 2.3600 },
  { id: 'L2', client: 'Pharmacie Bastille', adresse: '3 place de la Bastille, Paris 11e', lat: 48.8532, lon: 2.3692 },
  { id: 'L3', client: 'Épicerie Oberkampf', adresse: '98 rue Oberkampf, Paris 11e', lat: 48.8656, lon: 2.3779 },
  { id: 'L4', client: 'Fleuriste Batignolles', adresse: '40 rue des Batignolles, Paris 17e', lat: 48.8846, lon: 2.3196 },
  { id: 'L5', client: 'Cave de Levallois', adresse: '55 rue Rivay, Levallois', lat: 48.8925, lon: 2.2869 },
];
