# PleinJuste — A7 Fuel Optimizer

Application Next.js qui indique à un chauffeur-livreur **où faire le plein au meilleur coût réel** pendant sa tournée : prix à la pompe, **plus** le carburant et le temps chauffeur perdus dans le détour.

Une station 5 centimes moins chère mais à 15 km du trajet coûte plus cher qu'une station un peu plus chère située sur la route. PleinJuste fait ce calcul à la place du chauffeur, à partir des prix officiels en temps réel.

Cas d'usage d'origine : [`docs/case.md`](docs/case.md) (A7 Transport & Flotte).

## Pages

| Route | Rôle |
|---|---|
| `/` | **PleinJuste** — vue chauffeur : carte en direct, tournée, jauge, classement des stations par coût réel |
| `/test/fuel-test` | Page de démonstration de l'API : recherche de stations par lat/lon/rayon, liste + carte |
| `/api/stations` | Route serveur qui interroge les prix officiels (voir [API](#api-stations)) |

## Fonctionnement de PleinJuste (`/`)

- **Position GPS en direct** (`navigator.geolocation.watchPosition`). Sans GPS (refus, ordinateur, http sur mobile), une position simulée à Châtelet est utilisée pour la démo.
- **Tournée** : liste de livraisons ordonnées (`lib/tournee.ts`). Le chauffeur valide chaque livraison ; le classement est recalculé sur la tournée restante.
- **Jauge** en 8 crans saisie par le chauffeur ; elle donne le niveau du réservoir et l'autonomie (avec 15 % de marge de sécurité).
- **Classement des stations** sur toute la tournée restante (`classerTournee`) : pour chaque station, le tronçon où s'arrêter (« maintenant » ou « après la livraison n ») et son coût réel. Les stations sont rechargées après 500 m parcourus ou une livraison.
- **« Plein maintenant »** : cherche la station au meilleur coût réel entre la position actuelle et la prochaine livraison (rayon élargi par paliers : 3, 10 puis 30 km) et l'insère comme prochain arrêt. Une fois le plein validé, la jauge repasse à plein.

Le chauffeur, le véhicule (Renault Master, 9,5 L/100 km, réservoir 80 L, gazole) et les livraisons sont des **données d'exemple** dans `lib/tournee.ts` ; en production, ils seraient affectés par le gestionnaire de flotte. Le coût horaire chauffeur est fixé à 28 €/h.

## Modèle de coût (`lib/cout.ts`)

Pour une station S sur le trajet de A (position) vers B (prochain arrêt) :

```
detour_km   = dist(A→S) + dist(S→B) − dist(A→B)
cout_plein  = litres_a_mettre × prix_S
cout_detour = detour_km × conso/100 × prix_S
cout_temps  = detour_min / 60 × cout_horaire_chauffeur
cout_reel   = cout_plein + cout_detour + cout_temps
```

- Distances : haversine × **facteur de sinuosité 1,3** ; durées à **35 km/h** de moyenne (`HYPOTHESES_DEFAUT`). Pas d'appel à un service de routage.
- Exclues du classement : stations hors autonomie, en rupture, ou sans le carburant du véhicule. Les prix trop anciens sont signalés (`prixPerime`).
- Un détour négatif (station plus sur la route que le trajet direct) devient un gain.

La spécification détaillée est dans la skill [`.vibe/skills/cout-detour/SKILL.md`](.vibe/skills/cout-detour/SKILL.md).

## API stations

pleinpot/
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
   cd pleinpot
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
GET /api/stations?lat=48.8566&lon=2.3522&rayon=10&carburant=gazole&limit=20
```

| Paramètre | Type | Règle |
|---|---|---|
| `lat` | number | requis, −90 à 90 |
| `lon` | number | requis, −180 à 180 |
| `rayon` | number | requis, en km, > 0 et ≤ 100 |
| `carburant` | string | optionnel : `gazole`, `sp95`, `sp98`, `e10`, `e85`, `gplc` |
| `limit` | number | optionnel, 1 à 100, défaut 50 |

- Source : jeu de données officiel [prix des carburants, flux instantané v2](https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/) (`data.economie.gouv.fr`, API Explore v2.1).
- Filtre géographique en ODSQL : `within_distance(geom, geom'POINT(lon lat)', <rayon>km)`. L'ancienne syntaxe v1 `geofilter(distance,…)` est refusée par l'API v2.1.
- Le schéma brut est normalisé vers `StationRecord` (`types/station.ts`) : `cp` → `code_postal`, `*_rupture_type` → booléen `*_rupture`.
- Exclut les stations sans aucun prix valide ou en rupture sur tous les carburants.
- Timeout 10 s (réponse `504`), cache HTTP 5 min (`Cache-Control: public, max-age=300`).

Réponse :

```json
{
  "results": [
    {
      "id": "string",
      "nom": "string",
      "adresse": "string",
      "ville": "string",
      "code_postal": "string",
      "geom": { "lat": 48.85, "lon": 2.35 },
      "gazole_prix": 1.75,
      "gazole_maj": "2026-10-07T08:00:00+00:00",
      "gazole_rupture": false
    }
  ],
  "total": 35
}
```

Côté client, `transformStationRecord` (`lib/stations.ts`) convertit chaque enregistrement en `StationData` (coordonnées + carburants disponibles).

## Structure

```
├── components/
│   ├── LiveMap.tsx          # Carte de la vue chauffeur : position, trace, arrêts, stations classées
│   └── FuelMap.tsx          # Carte de la page de démo
├── lib/
│   ├── cout.ts              # Modèle de coût réel et classement des stations
│   ├── tournee.ts           # Chauffeur, véhicule et livraisons d'exemple
│   └── stations.ts          # Transformation et formatage des stations
├── pages/
│   ├── index.tsx            # PleinJuste (vue chauffeur)
│   ├── api/stations.ts      # Proxy vers data.economie.gouv.fr
│   └── test/fuel-test.tsx   # Page de démo de l'API
├── types/                   # station, vehicle, driver
├── data/                    # vehicles.json, drivers.json (référentiel flotte, non utilisé par l'UI pour l'instant)
├── scripts/test-cout.ts     # Tests du modèle de coût
├── docs/case.md             # Énoncé du cas d'usage A7
└── .vibe/skills/cout-detour # Spécification du calcul de coût
```

## Lancer en local

Prérequis : Node.js 20+.

```bash
npm install
npm run dev          # http://localhost:3000
```

Aucune variable d'environnement n'est nécessaire : l'URL de l'API et les limites sont définies dans `pages/api/stations.ts`. (`.env.local.example` n'est pas lu par le code.)

Pour la position GPS sur mobile, la page doit être servie en HTTPS ; sinon la position simulée est utilisée.

## Vérifier avant de pousser

```bash
npx tsx scripts/test-cout.ts   # tests du modèle de coût → "OK" et "OK tournée"
npm run build                  # vérification TypeScript + build de production
```

`npm run dev` ne vérifie pas les types. Seul `npm run build` (ou `npx tsc --noEmit`) détecte les erreurs TypeScript qui bloquent le déploiement.

## Déploiement

Déployé sur **Vercel** (projet `pleinpot`, équipe Iona) à chaque push sur `main` ; les autres branches et les PR obtiennent un déploiement de preview.

- Le Framework Preset du projet doit être **Next.js**. Avec « Other », le build réussit mais toutes les routes renvoient `404 NOT_FOUND`.
- Leaflet accède à `window` dès son import : toute carte doit être chargée via `next/dynamic` avec `ssr: false`, sinon le build échoue au prérendu.
- Les déploiements déclenchés par un auteur de commit qui n'est pas membre de l'équipe Vercel sont bloqués jusqu'à approbation manuelle.

## Sources de données

- **Prix des carburants** : [data.economie.gouv.fr](https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/) — Licence Ouverte Etalab
- **Fond de carte** : © [contributeurs OpenStreetMap](https://www.openstreetmap.org/copyright)

## Licence

Projet développé dans le cadre du cas d'usage A7 Transport & Flotte.
