// Base de données TypeScript pour la tournée de livraison en région parisienne
// Contient 30 adresses de livraison avec leurs métadonnées

// Types pour la tournée de livraison
export interface AdresseLivraison {
  id: number;
  ordre: number;
  nom_client: string;
  adresse: string;
  code_postal: string;
  ville: string;
  latitude: number;
  longitude: number;
  heure_livraison_debut: string;
  heure_livraison_fin: string;
  duree_estimee_min: number;
  poids_colis_kg: number;
  statut: 'a_livrer' | 'livre' | 'en_retard' | 'annule';
}

export interface Depot {
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  latitude: number;
  longitude: number;
  heure_depart: string;
}

export interface StatistiquesTournee {
  poids_total_kg: number;
  duree_totale_estimee_min: number;
  distance_totale_estimee_km: number;
}

export interface MetadataTournee {
  nom: string;
  date: string;
  livreur: string;
  vehicule: string;
  total_adresses: number;
  description: string;
}

export interface TourneeLivraison {
  metadata: MetadataTournee;
  adresses: AdresseLivraison[];
  depot: Depot;
  statistiques: StatistiquesTournee;
}

// Données de la tournée
const tourneeData: TourneeLivraison = {
  metadata: {
    nom: "Tournee Livraison Region Parisienne",
    date: "2026-10-07",
    livreur: "Livreur-001",
    vehicule: "Camionnette 3.5T",
    total_adresses: 30,
    description: "Tournee de livraison pour la region parisienne avec 30 points de livraison"
  },
  adresses: [
    {
      id: 1,
      ordre: 1,
      nom_client: "Boulangerie Martin",
      adresse: "12 Rue de Rivoli",
      code_postal: "75004",
      ville: "Paris",
      latitude: 48.8554,
      longitude: 2.3576,
      heure_livraison_debut: "08:00",
      heure_livraison_fin: "09:00",
      duree_estimee_min: 15,
      poids_colis_kg: 25.5,
      statut: "a_livrer"
    },
    {
      id: 2,
      ordre: 2,
      nom_client: "Supermarche Franprix",
      adresse: "25 Avenue des Champs-Elysees",
      code_postal: "75008",
      ville: "Paris",
      latitude: 48.8699,
      longitude: 2.3073,
      heure_livraison_debut: "09:15",
      heure_livraison_fin: "10:15",
      duree_estimee_min: 30,
      poids_colis_kg: 120.0,
      statut: "a_livrer"
    },
    {
      id: 3,
      ordre: 3,
      nom_client: "Restaurant Le Bistrot",
      adresse: "18 Rue de Charonne",
      code_postal: "75011",
      ville: "Paris",
      latitude: 48.8534,
      longitude: 2.3889,
      heure_livraison_debut: "10:30",
      heure_livraison_fin: "11:30",
      duree_estimee_min: 20,
      poids_colis_kg: 45.2,
      statut: "a_livrer"
    },
    {
      id: 4,
      ordre: 4,
      nom_client: "Ecole Maternelle Les Petits Anges",
      adresse: "5 Rue de la Sorbonne",
      code_postal: "75005",
      ville: "Paris",
      latitude: 48.8486,
      longitude: 2.3411,
      heure_livraison_debut: "08:30",
      heure_livraison_fin: "09:30",
      duree_estimee_min: 10,
      poids_colis_kg: 8.7,
      statut: "a_livrer"
    },
    {
      id: 5,
      ordre: 5,
      nom_client: "Pharmacie du Quartier",
      adresse: "33 Rue de Sevres",
      code_postal: "75006",
      ville: "Paris",
      latitude: 48.8442,
      longitude: 2.2964,
      heure_livraison_debut: "09:00",
      heure_livraison_fin: "10:00",
      duree_estimee_min: 15,
      poids_colis_kg: 12.3,
      statut: "a_livrer"
    },
    {
      id: 6,
      ordre: 6,
      nom_client: "Hotel de Ville",
      adresse: "Place de l'Hotel de Ville",
      code_postal: "75004",
      ville: "Paris",
      latitude: 48.8566,
      longitude: 2.3522,
      heure_livraison_debut: "11:00",
      heure_livraison_fin: "12:00",
      duree_estimee_min: 25,
      poids_colis_kg: 67.8,
      statut: "a_livrer"
    },
    {
      id: 7,
      ordre: 7,
      nom_client: "Magasin Bio Nature",
      adresse: "14 Rue du Faubourg Saint-Denis",
      code_postal: "75010",
      ville: "Paris",
      latitude: 48.8706,
      longitude: 2.3556,
      heure_livraison_debut: "10:00",
      heure_livraison_fin: "11:00",
      duree_estimee_min: 20,
      poids_colis_kg: 34.1,
      statut: "a_livrer"
    },
    {
      id: 8,
      ordre: 8,
      nom_client: "Café des Arts",
      adresse: "27 Boulevard du Montmartre",
      code_postal: "75002",
      ville: "Paris",
      latitude: 48.8719,
      longitude: 2.3486,
      heure_livraison_debut: "11:30",
      heure_livraison_fin: "12:30",
      duree_estimee_min: 15,
      poids_colis_kg: 18.9,
      statut: "a_livrer"
    },
    {
      id: 9,
      ordre: 9,
      nom_client: "Librairie Shakespeare",
      adresse: "37 Rue de la Bucherie",
      code_postal: "75005",
      ville: "Paris",
      latitude: 48.8530,
      longitude: 2.3459,
      heure_livraison_debut: "09:30",
      heure_livraison_fin: "10:30",
      duree_estimee_min: 10,
      poids_colis_kg: 5.4,
      statut: "a_livrer"
    },
    {
      id: 10,
      ordre: 10,
      nom_client: "Fleuriste Rose et Jasmin",
      adresse: "8 Rue de Passy",
      code_postal: "75016",
      ville: "Paris",
      latitude: 48.8606,
      longitude: 2.2889,
      heure_livraison_debut: "14:00",
      heure_livraison_fin: "15:00",
      duree_estimee_min: 10,
      poids_colis_kg: 7.2,
      statut: "a_livrer"
    },
    {
      id: 11,
      ordre: 11,
      nom_client: "Bureau de Tabac Parisien",
      adresse: "15 Rue Oberkampf",
      code_postal: "75011",
      ville: "Paris",
      latitude: 48.8667,
      longitude: 2.3833,
      heure_livraison_debut: "12:00",
      heure_livraison_fin: "13:00",
      duree_estimee_min: 15,
      poids_colis_kg: 22.6,
      statut: "a_livrer"
    },
    {
      id: 12,
      ordre: 12,
      nom_client: "Pizzeria Bella Napoli",
      adresse: "22 Rue des Martyrs",
      code_postal: "75009",
      ville: "Paris",
      latitude: 48.8848,
      longitude: 2.3422,
      heure_livraison_debut: "11:45",
      heure_livraison_fin: "12:45",
      duree_estimee_min: 20,
      poids_colis_kg: 55.3,
      statut: "a_livrer"
    },
    {
      id: 13,
      ordre: 13,
      nom_client: "Pressing Express",
      adresse: "10 Rue de Turin",
      code_postal: "75008",
      ville: "Paris",
      latitude: 48.8739,
      longitude: 2.3217,
      heure_livraison_debut: "13:00",
      heure_livraison_fin: "14:00",
      duree_estimee_min: 15,
      poids_colis_kg: 15.8,
      statut: "a_livrer"
    },
    {
      id: 14,
      ordre: 14,
      nom_client: "Superette du Coin",
      adresse: "7 Rue de Chateaudun",
      code_postal: "75009",
      ville: "Paris",
      latitude: 48.8778,
      longitude: 2.3500,
      heure_livraison_debut: "14:15",
      heure_livraison_fin: "15:15",
      duree_estimee_min: 20,
      poids_colis_kg: 89.4,
      statut: "a_livrer"
    },
    {
      id: 15,
      ordre: 15,
      nom_client: "Garage Automobile Rapid",
      adresse: "30 Rue de Vaugirard",
      code_postal: "75015",
      ville: "Paris",
      latitude: 48.8408,
      longitude: 2.2792,
      heure_livraison_debut: "15:30",
      heure_livraison_fin: "16:30",
      duree_estimee_min: 25,
      poids_colis_kg: 200.0,
      statut: "a_livrer"
    },
    {
      id: 16,
      ordre: 16,
      nom_client: "Epicerie Fine",
      adresse: "19 Rue Mouffetard",
      code_postal: "75005",
      ville: "Paris",
      latitude: 48.8428,
      longitude: 2.3436,
      heure_livraison_debut: "10:00",
      heure_livraison_fin: "11:00",
      duree_estimee_min: 15,
      poids_colis_kg: 42.7,
      statut: "a_livrer"
    },
    {
      id: 17,
      ordre: 17,
      nom_client: "Cave a Vin Le Sommelier",
      adresse: "28 Rue des Archives",
      code_postal: "75003",
      ville: "Paris",
      latitude: 48.8642,
      longitude: 2.3611,
      heure_livraison_debut: "14:00",
      heure_livraison_fin: "15:00",
      duree_estimee_min: 20,
      poids_colis_kg: 150.0,
      statut: "a_livrer"
    },
    {
      id: 18,
      ordre: 18,
      nom_client: "Salon de Coiffure Elena",
      adresse: "12 Rue de la Pompe",
      code_postal: "75016",
      ville: "Paris",
      latitude: 48.8639,
      longitude: 2.2736,
      heure_livraison_debut: "09:30",
      heure_livraison_fin: "10:30",
      duree_estimee_min: 10,
      poids_colis_kg: 3.5,
      statut: "a_livrer"
    },
    {
      id: 19,
      ordre: 19,
      nom_client: "Imprimerie Rapide",
      adresse: "5 Rue du Louvre",
      code_postal: "75001",
      ville: "Paris",
      latitude: 48.8627,
      longitude: 2.3411,
      heure_livraison_debut: "16:00",
      heure_livraison_fin: "17:00",
      duree_estimee_min: 30,
      poids_colis_kg: 75.6,
      statut: "a_livrer"
    },
    {
      id: 20,
      ordre: 20,
      nom_client: "Boulangerie Tradition",
      adresse: "24 Rue de Belleville",
      code_postal: "75019",
      ville: "Paris",
      latitude: 48.8825,
      longitude: 2.3875,
      heure_livraison_debut: "06:30",
      heure_livraison_fin: "07:30",
      duree_estimee_min: 20,
      poids_colis_kg: 30.2,
      statut: "a_livrer"
    },
    {
      id: 21,
      ordre: 21,
      nom_client: "Fromagerie du Marche",
      adresse: "17 Rue de Grenelle",
      code_postal: "75007",
      ville: "Paris",
      latitude: 48.8584,
      longitude: 2.3167,
      heure_livraison_debut: "08:00",
      heure_livraison_fin: "09:00",
      duree_estimee_min: 15,
      poids_colis_kg: 28.4,
      statut: "a_livrer"
    },
    {
      id: 22,
      ordre: 22,
      nom_client: "Charcuterie fine",
      adresse: "9 Rue du commerce",
      code_postal: "75015",
      ville: "Paris",
      latitude: 48.8386,
      longitude: 2.2781,
      heure_livraison_debut: "07:45",
      heure_livraison_fin: "08:45",
      duree_estimee_min: 20,
      poids_colis_kg: 45.8,
      statut: "a_livrer"
    },
    {
      id: 23,
      ordre: 23,
      nom_client: "Pâtisserie Lenôtre",
      adresse: "44 Rue d'Auteuil",
      code_postal: "75016",
      ville: "Paris",
      latitude: 48.8550,
      longitude: 2.2667,
      heure_livraison_debut: "06:00",
      heure_livraison_fin: "07:00",
      duree_estimee_min: 25,
      poids_colis_kg: 52.1,
      statut: "a_livrer"
    },
    {
      id: 24,
      ordre: 24,
      nom_client: "Brasserie du coin",
      adresse: "36 Rue de la Roquette",
      code_postal: "75011",
      ville: "Paris",
      latitude: 48.8542,
      longitude: 2.3736,
      heure_livraison_debut: "15:00",
      heure_livraison_fin: "16:00",
      duree_estimee_min: 30,
      poids_colis_kg: 180.0,
      statut: "a_livrer"
    },
    {
      id: 25,
      ordre: 25,
      nom_client: "Traiteur Oriental",
      adresse: "8 Rue de la Huchette",
      code_postal: "75005",
      ville: "Paris",
      latitude: 48.8522,
      longitude: 2.3467,
      heure_livraison_debut: "12:30",
      heure_livraison_fin: "13:30",
      duree_estimee_min: 20,
      poids_colis_kg: 35.7,
      statut: "a_livrer"
    },
    {
      id: 26,
      ordre: 26,
      nom_client: "Magasin de sport",
      adresse: "20 Rue de la Chaussée-d'Antin",
      code_postal: "75009",
      ville: "Paris",
      latitude: 48.8719,
      longitude: 2.3417,
      heure_livraison_debut: "09:00",
      heure_livraison_fin: "10:00",
      duree_estimee_min: 25,
      poids_colis_kg: 60.5,
      statut: "a_livrer"
    },
    {
      id: 27,
      ordre: 27,
      nom_client: "Boutique de mode",
      adresse: "16 Rue de la Paix",
      code_postal: "75002",
      ville: "Paris",
      latitude: 48.8686,
      longitude: 2.3522,
      heure_livraison_debut: "13:30",
      heure_livraison_fin: "14:30",
      duree_estimee_min: 20,
      poids_colis_kg: 22.3,
      statut: "a_livrer"
    },
    {
      id: 28,
      ordre: 28,
      nom_client: "Cave à fromages",
      adresse: "11 Rue des Martyrs",
      code_postal: "75009",
      ville: "Paris",
      latitude: 48.8839,
      longitude: 2.3425,
      heure_livraison_debut: "08:30",
      heure_livraison_fin: "09:30",
      duree_estimee_min: 15,
      poids_colis_kg: 18.9,
      statut: "a_livrer"
    },
    {
      id: 29,
      ordre: 29,
      nom_client: "Restaurant italien",
      adresse: "25 Rue du Faubourg-Saint-Honoré",
      code_postal: "75008",
      ville: "Paris",
      latitude: 48.8686,
      longitude: 2.3264,
      heure_livraison_debut: "11:00",
      heure_livraison_fin: "12:00",
      duree_estimee_min: 25,
      poids_colis_kg: 40.2,
      statut: "a_livrer"
    },
    {
      id: 30,
      ordre: 30,
      nom_client: "Boulangerie Paul",
      adresse: "1 Rue de la Convention",
      code_postal: "75015",
      ville: "Paris",
      latitude: 48.8358,
      longitude: 2.2767,
      heure_livraison_debut: "07:00",
      heure_livraison_fin: "08:00",
      duree_estimee_min: 20,
      poids_colis_kg: 33.4,
      statut: "a_livrer"
    }
  ],
  depot: {
    nom: "Depot Principal",
    adresse: "100 Rue de Paris",
    code_postal: "92100",
    ville: "Boulogne-Billancourt",
    latitude: 48.8358,
    longitude: 2.2412,
    heure_depart: "06:00"
  },
  statistiques: {
    poids_total_kg: 1450.2,
    duree_totale_estimee_min: 545,
    distance_totale_estimee_km: 85.5
  }
};

// Fonctions utilitaires pour manipuler la tournée
export const TourneeLivraisonParis: TourneeLivraison = tourneeData;

// Obtenir toutes les adresses
export function getAllAdresses(): AdresseLivraison[] {
  return TourneeLivraisonParis.adresses;
}

// Obtenir une adresse par ID
export function getAdresseById(id: number): AdresseLivraison | undefined {
  return TourneeLivraisonParis.adresses.find(addr => addr.id === id);
}

// Obtenir les adresses par ordre de livraison
export function getAdressesByOrder(): AdresseLivraison[] {
  return [...TourneeLivraisonParis.adresses].sort((a, b) => a.ordre - b.ordre);
}

// Obtenir les adresses dans une plage horaire
export function getAdressesByTimeRange(debut: string, fin: string): AdresseLivraison[] {
  return TourneeLivraisonParis.adresses.filter(addr => 
    addr.heure_livraison_debut >= debut && addr.heure_livraison_fin <= fin
  );
}

// Obtenir les statistiques de la tournée
export function getTourneeStatistiques(): StatistiquesTournee {
  return TourneeLivraisonParis.statistiques;
}

// Obtenir les informations du dépôt
export function getDepot(): Depot {
  return TourneeLivraisonParis.depot;
}

// Mettre à jour le statut d'une adresse
export function updateAdresseStatut(id: number, statut: AdresseLivraison['statut']): void {
  const adresse = TourneeLivraisonParis.adresses.find(addr => addr.id === id);
  if (adresse) {
    adresse.statut = statut;
  }
}

// Obtenir les adresses par statut
export function getAdressesByStatut(statut: AdresseLivraison['statut']): AdresseLivraison[] {
  return TourneeLivraisonParis.adresses.filter(addr => addr.statut === statut);
}

export default TourneeLivraisonParis;
