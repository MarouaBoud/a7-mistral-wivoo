# Vérification de la structure du projet

## Projet Next.js pour l'intégration carte et stations-service

### Structure des fichiers créés

```
pleinpot/
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── next-env.d.ts
├── components/
│   └── FuelMap.tsx          # Composant carte Leaflet
├── lib/
│   └── stations.ts          # Fonctions utilitaires
├── types/
│   └── station.ts           # Types TypeScript
├── pages/
│   ├── _app.tsx             # App Next.js
│   ├── index.tsx            # Page d'accueil
│   └── api/
│       └── stations.ts      # API server
│   └── test/
│       └── fuel-test.tsx    # Page de test
├── public/
│   └── images/
│       └── .gitkeep         # Dossier pour les icônes
└── styles/
    └── globals.css          # CSS global
```

### Fonctionnalités implémentées

#### 1. Carte (FuelMap.tsx)
- ✅ Leaflet avec fond OpenStreetMap
- ✅ Chargement uniquement côté navigateur (SSR safe)
- ✅ Attribution © OpenStreetMap contributors
- ✅ Hauteur explicite au composant
- ✅ Marqueurs des stations avec popup
- ✅ Affichage adresse, carburant, prix en €/L et date de mise à jour
- ✅ Pas de téléchargement massif des tuiles (limite de zoom)
- ✅ Icônes personnalisées SVG pour éviter les dépendances d'images

#### 2. Stations (pages/api/stations.ts)
- ✅ Route serveur Next.js
- ✅ Interrogation API officielle data.economie.gouv.fr
- ✅ Recherche autour de coordonnées avec rayon configurable
- ✅ Syntaxe du filtre géographique validée
- ✅ Validation des paramètres (lat, lon, rayon)
- ✅ Limitation du nombre de résultats (max 100)
- ✅ Utilisation de geom.lat et geom.lon
- ✅ Lecture gazole_prix, gazole_maj et informations de rupture
- ✅ Exclusion des prix absents et carburants en rupture
- ✅ Affichage de la date du prix
- ✅ Timeout (10s), gestion des erreurs et cache (5min)
- ✅ Pas de données fictives

#### 3. Test (pages/test/fuel-test.tsx)
- ✅ Page de test isolée
- ✅ Saisie latitude, longitude et rayon
- ✅ Affichage des mêmes stations dans une liste et sur la carte
- ✅ Pas de calcul de détour ni recommandation (étape suivante)

### Points à vérifier manuellement

1. **Installer les dépendances** :
   ```bash
   cd pleinpot
   npm install
   ```

2. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

3. **Accéder à la page de test** :
   Ouvrir http://localhost:3000/test/fuel-test dans le navigateur

### Problèmes connus et solutions

1. **Leaflet CSS** : Assurez-vous que `leaflet/dist/leaflet.css` est importé
2. **Icônes des marqueurs** : Utilisation d'icônes SVG pour éviter les problèmes de chemins
3. **SSR avec Leaflet** : Le composant FuelMap utilise 'use client' et un état pour éviter les erreurs SSR
4. **TypeScript** : Tous les fichiers sont typés correctement

### Erreurs potentielles à corriger

1. Vérifier que `@types/leaflet` est bien installé
2. Vérifier les imports dans les fichiers TypeScript
3. Corriger les problèmes de chemins d'import si nécessaire

### Routes disponibles

- `/` - Page d'accueil
- `/test/fuel-test` - Page de test complète
- `/api/stations?lat=48.8566&lon=2.3522&rayon=10` - API pour récupérer les stations
