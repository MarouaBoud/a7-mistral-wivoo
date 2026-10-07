# A7 Fuel Optimizer - Intégration Carte & Stations-Service

Projet Next.js pour l'optimisation du choix des stations-service en tenant compte du coût réel incluant le détour.

## Structure du Projet

```
a7-mistral-wivoo/
├── components/
│   └── FuelMap.tsx              # Composant carte Leaflet avec stations
├── lib/
│   └── stations.ts              # Fonctions utilitaires de transformation
├── pages/
│   ├── index.tsx                # Page d'accueil
│   ├── _app.tsx                 # Application Next.js
│   ├── api/
│   │   └── stations.ts          # API pour récupérer les stations
│   └── test/
│       └── fuel-test.tsx        # Page de démonstration
├── types/
│   └── station.ts               # Types TypeScript
├── styles/
│   └── globals.css              # Styles globaux
├── public/
│   └── images/                  # Images pour les marqueurs
├── package.json
├── tsconfig.json
└── next.config.js
```

## Fonctionnalités Implémentées

### 1. Carte (FuelMap)
- **Leaflet** avec fond OpenStreetMap
- Chargement uniquement côté client (SSR-safe avec 'use client')
- Attribution © OpenStreetMap contributors
- Hauteur explicite configurable
- Marqueurs des stations avec icônes SVG personnalisées
- Popups avec :
  - Nom et adresse de la station
  - Meilleur prix par carburant
  - Prix en €/L
  - Date de mise à jour
  - Liste des autres carburants disponibles

### 2. API Stations
- Route serveur Next.js : `/api/stations`
- Interrogation de l'API officielle : `data.economie.gouv.fr`
- Paramètres supportés :
  - `lat` : Latitude (requis)
  - `lon` : Longitude (requis)  
  - `rayon` : Rayon de recherche en km (requis, 0-100)
  - `carburant` : Type de carburant (optionnel)
  - `limit` : Limite de résultats (optionnel, max 100)
- Validation complète des paramètres
- Filtrage géographique avec `geofilter(distance,lon,lat,radiusInMeters)`
- Exclusion des prix absents et carburants en rupture
- Cache HTTP de 5 minutes
- Timeout de 10 secondes
- Gestion d'erreurs complète

### 3. Page de Test
- URL : `/test/fuel-test`
- Saisie de latitude, longitude et rayon
- Bouton de géolocalisation
- Localisations tests prédéfinies (Paris, Lyon, Marseille, etc.)
- Affichage des stations sous forme de liste et sur la carte
- Affichage du nombre total de stations trouvées

## Installation

1. **Cloner le dépôt** (si applicable)
2. **Installer les dépendances** :
   ```bash
   cd a7-mistral-wivoo
   npm install
   ```

3. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

4. **Ouvrir la page de test** :
   [http://localhost:3000/test/fuel-test](http://localhost:3000/test/fuel-test)

## Utilisation de l'API

### Requête GET
```
GET /api/stations?lat=48.8566&lon=2.3522&rayon=10&limit=20
```

### Paramètres
- `lat` (number) : Latitude (-90 à 90)
- `lon` (number) : Longitude (-180 à 180)
- `rayon` (number) : Rayon de recherche en km (1 à 100)
- `carburant` (string, optional) : Filtre par type de carburant
- `limit` (number, optional) : Limite de résultats (1 à 100, défaut 50)

### Réponse
```json
{
  "results": [
    {
      "id": "string",
      "nom": "string",
      "adresse": "string", 
      "ville": "string",
      "code_postal": "string",
      "geom": {"lat": number, "lon": number},
      "gazole_prix": number | null,
      "gazole_maj": "string" | null,
      "gazole_rupture": boolean,
      // ... autres carburants
    }
  ],
  "total": number
}
```

## Dépendances Principales

- **next** : ^14.0.0
- **react** : ^18.2.0
- **leaflet** : ^1.9.4
- **react-leaflet** : ^4.2.1
- **typescript** : ^5.3.0

## Contraintes Respectées

✅ **Carte** :
- Leaflet + OpenStreetMap
- Chargement côté navigateur uniquement
- Attribution visible
- Hauteur explicite
- Marqueurs avec popups
- Pas de téléchargement massif de tuiles

✅ **Stations** :
- API officielle data.gouv.fr
- Filtre géographique validé
- Validation des paramètres
- Exclusion prix absents/ruptures
- Dates de mise à jour affichées
- Timeout + cache + gestion erreurs
- Pas de données fictives

✅ **Test** :
- Page isolée (`/test/fuel-test`)
- Saisie lat/lon/rayon
- Liste + carte
- Pas de calcul de détour (étape suivante)

## Prochaines Étapes

1. **Calcul de détour** : Intégrer le calcul du coût réel avec la skill `cout-detour`
2. **Recommandation** : Implémenter la recommandation basée sur le coût réel
3. **Tests automatisés** : Ajouter des tests unitaires et d'intégration
4. **Optimisation** : Cache plus efficace, pagination, etc.
5. **UI/UX** : Améliorer l'interface utilisateur

## Problèmes Connus

- Les icônes Leaflet par défaut ne fonctionnent pas avec Next.js (résolu avec SVG)
- Nécessite l'installation des dépendances npm pour fonctionner
- Le projet est conçu pour être exécuté en local

## Sources de Données

- **Prix des carburants** : [data.economie.gouv.fr](https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records)
- **Carte** : [OpenStreetMap](https://www.openstreetmap.org/copyright)

## Licence

Ce projet est développé dans le cadre du cas d'usage A7 Transport & Flotte.