# Prototype — vol ciblé (diamant)

Vérificateur d'unicité pour la variante où il ne faut trouver que le diamant.
Règles testées : 4 leurres (comme aujourd'hui) + un diamant d'une case, transparent,
qui fait scintiller (✦) la lumière seulement si elle est déjà colorée.

Lancer le banc d'essai (N salles aléatoires, résultats dans /tmp/bench.out) :

    N=60 npx vitest run --config prototype/vitest.config.ts

Hors du lint et des tests du jeu : c'est un brouillon de mesure.

## Exact solver (solver.ts)

`solve` proves a room has a single solution. Two things keep it fast enough for seven jewels and four pillars:
- it always branches on the jewel with the fewest placements left (they shrink as jewels are placed);
- it propagates what the torches prove: a cell whose possible jewels all have a colour the torch did not show
  is crossed by the light as if empty, and every cell a light certainly crossed is removed from all jewels.
Benchmarks: `GEN=solverbench` (prototype/solverBench.test.ts). Re-check every stored room: `GEN=verify`.
