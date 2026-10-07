---
name: cout-detour
description: Calcul du coût réel d'un plein incluant le détour (carburant et temps chauffeur). Utiliser dès qu'une tâche touche au calcul de coût, à la comparaison de stations, à la recommandation ou aux outils function calling associés.
user-invocable: true
---

# Skill : coût réel d'un plein

## Formule
Pour une station S, trajet de A (position) vers B (prochain arrêt) :

detour_km  = dist(A→S) + dist(S→B) − dist(A→B)
detour_min = durée(A→S) + durée(S→B) − durée(A→B)

cout_plein  = litres_a_mettre × prix_S
cout_detour = detour_km × (conso_l_per_100km / 100) × prix_S
cout_temps  = (detour_min / 60) × cout_horaire_chauffeur_eur

COUT_REEL(S) = cout_plein + cout_detour + cout_temps
La station recommandée minimise COUT_REEL, pas prix_S.

## Paramètres
- litres_a_mettre = capacité_réservoir − niveau_actuel (ou saisi)
- conso_l_per_100km : propre au véhicule, configurable
- cout_horaire_chauffeur_eur : défini par le gestionnaire
- detour_km négatif autorisé (gain réel)

## Contraintes métier
- Exclure les stations hors autonomie (autonomie_km = niveau / conso × 100,
  marge de sécurité 15 %).
- Exclure les stations fermées ou sans le bon carburant.
- Signaler un prix datant de plus de 24 h.
- Rayon de recherche par défaut : 10 km autour du trajet.

## Outils exposés au modèle (schémas JSON, descriptions en français)
1. rechercher_stations(lat, lon, rayon_km, carburant)
2. calculer_detour(position, station_id, prochain_arret)
3. calculer_cout_reel(station_id, vehicule_id, detour_km, detour_min, litres)
4. comparer_stations(liste_couts)

Recommandation :
- Conducteur : 1 à 2 phrases, lisibles à voix haute.
  Ex : « Arrête-toi chez Total rue de Calais, dans 2 km. L'autre station
  est moins chère au litre mais te coûterait 4,20 € de plus avec le détour. »
- Gestionnaire : détail chiffré des trois composantes du coût.

## Tests obligatoires
- Moins cher au litre mais long détour → doit perdre (cas Karim).
- Détour nul → COUT_REEL = cout_plein.
- Détour négatif → gain appliqué.
- Autonomie insuffisante → station exclue.
- Arrondi au centime uniquement à l'affichage.