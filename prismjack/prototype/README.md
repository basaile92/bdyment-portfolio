# Prototype — vol ciblé (diamant)

Vérificateur d'unicité pour la variante où il ne faut trouver que le diamant.
Règles testées : 4 leurres (comme aujourd'hui) + un diamant d'une case, transparent,
qui fait scintiller (✦) la lumière seulement si elle est déjà colorée.

Lancer le banc d'essai (N salles aléatoires, résultats dans /tmp/bench.out) :

    N=60 npx vitest run --config prototype/vitest.config.ts

Hors du lint et des tests du jeu : c'est un brouillon de mesure.
