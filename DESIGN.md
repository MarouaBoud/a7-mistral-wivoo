# DESIGN.md — Charte UI FuelWise (à respecter strictement)

## Principe
Une démo de 60 secondes sur grand écran. Chaque écran doit se comprendre
en 3 secondes. Une seule information principale par écran.

## Écran Conducteur (format mobile, 390 px de large, centré)
- En haut : bandeau « FuelWise » + position actuelle
- Carte Leaflet (OpenStreetMap) de 300 px de haut : trajet en bleu,
  station recommandée en VERT, station « piège » en ROUGE
- Grande carte verte : « Arrête-toi chez [station] — dans X km »
  en 28 px gras, puis « Tu économises X,XX € » en 40 px gras
- Phrase de l'IA en dessous, en italique, avec une icône Mistral
- Bouton micro rond, orange, 72 px, en bas au centre

## Écran Gestionnaire (format bureau)
- 3 tuiles KPI en haut : économie par plein / par véhicule par an /
  pour la flotte par an (chiffres en 36 px gras)
- Tableau des stations : prix au litre | coût du détour | coût du temps
  | COÛT RÉEL (colonne en gras), ligne recommandée surlignée en vert
- Badge rouge « Piège : moins chère au litre, plus chère au total »
  sur la station concernée
- Barres horizontales simples (CSS) comparant les coûts réels

## Style
- Police : system-ui. Fond #F7F7F5, cartes blanches, coins arrondis
  16 px, ombre légère
- Couleurs : orange Mistral #FA500F (accent), vert #1E9E5A (bon choix),
  rouge #D93025 (piège), texte #1A1A1A
- Navigation : 2 onglets en haut (Conducteur / Gestionnaire)
- Montants toujours au format « 4,20 € »
- Aucun lorem ipsum : uniquement des données réalistes du scénario
- Mention en bas de page : « Données : prix-carburants.gouv.fr ·
  Itinéraires : OSRM · Carte : © OpenStreetMap »