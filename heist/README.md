# Le Casse

Jeu de déduction : 5 joyaux sont cachés dans une salle de musée. Teste la salle au laser
depuis les émetteurs, déduis la forme et la place des joyaux, dessine ton plan… et lance le casse.

Une seule base de code pour **le navigateur (PWA)**, **iOS** et **Android** (via Capacitor).

## Démarrer

```bash
npm install
npm run dev        # serveur de dev
npm run verify     # lint + types + tests + build
```

| Script | Rôle |
|---|---|
| `npm run dev` | Vite en mode développement |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run lint` | ESLint, dont la **règle de dépendance** entre couches |
| `npm run check` | Vérification des types (TypeScript strict + Svelte) |
| `npm run build` | Build web dans `dist/` |
| `npm run cap:sync` | Build + copie dans les projets natifs |

### Mobile (iOS / Android)

```bash
npx cap add ios        # une seule fois (Xcode requis)
npx cap add android    # une seule fois (Android Studio requis)
npm run cap:sync       # après chaque build
npx cap open ios       # ou android
```

## Architecture

Clean Architecture : les dépendances pointent toujours **vers l'intérieur**.

```
ui  ──►  application  ──►  domain
 │            │
 └─► main.ts ─┴──► adapters ──► ports
```

| Couche | Dossier | Contenu | Peut dépendre de |
|---|---|---|---|
| **Domaine** | `src/domain` | Règles du jeu, pures et sans dépendance : géométrie du plateau, couleurs, formes des joyaux, tracé du laser, génération, validation, score, détection des formes fermées | rien |
| **Application** | `src/application` | Un cas d'usage par fichier : `startHeist`, `fireLaser`, `drawSurface`, `markEmpty`, `clearPlan`, `submitPlan`, `planHistory` (annuler), `modes` (entraînement, jour, libre), `recordHeist`. État immuable. | domaine, ports |
| **Ports** | `src/ports` | Interfaces vers l'extérieur : `RandomSource`, `ProgressStore`, `Haptics`, `Sound` | domaine |
| **Adaptateurs** | `src/adapters` | Implémentations : générateur à graine, stockage web / natif, vibrations, sons synthétisés (Web Audio) | ports |
| **Interface** | `src/ui` | Composants Svelte, `GameController` (view-model), présentateurs (couleurs, géométrie d'affichage, textes) | application, domaine (lecture) |
| **Composition** | `src/main.ts` | Seul endroit qui choisit les adaptateurs concrets | tout |

La règle de dépendance est **vérifiée par ESLint** (`no-restricted-imports` par dossier) :
un import interdit casse le lint.

### Principes appliqués

- **SRP** : un fichier = une responsabilité (un cas d'usage, une règle, un composant).
- **OCP / DIP** : le jeu dépend d'interfaces (`ports`) ; ajouter une plateforme = ajouter un adaptateur.
- **Fonctions courtes et sans effet de bord** dans le domaine ; l'état de partie est immuable.
- **Noms du métier** : `Heist`, `Shot`, `Surface`, `Facet`, `Jewel`, `traceLaser`…
- **Tests d'abord sur le cœur** : le domaine et les cas d'usage se testent en millisecondes, sans navigateur.
- ESLint signale aussi les fonctions trop longues (> 40 lignes), trop complexes ou avec trop de paramètres.

## Modes et confort de jeu

- **Entraînement** 1, 2 puis 3 joyaux au premier lancement, avec des conseils du voleur au bon moment.
- **Casse du jour** : le même musée pour tout le monde (graine dérivée de la date), série de jours, résultat à copier.
- **Casse libre** : 5 joyaux au hasard.
- Tracer : près d'un bord de case = mur, vers le centre = facette ; on peut glisser avant de lâcher. Annuler / Rétablir.
- Chaque couleur de joyau a aussi une forme (▲ ■ ● ◆) : la couleur n'est jamais le seul indice.
- Alarme : au-delà du seuil des 2 étoiles, le gardien arrive et le casse échoue.
- Jeu au clavier (flèches, Entrée, h/b/g/d pour les murs, / et \ pour les facettes, v pour vide) et annonces pour lecteurs d'écran.
- Respecte « réduire les animations » ; polices embarquées (fonctionne hors ligne).

## Règles du jeu (résumé)

- Grille de 8 × 10 cases, 36 émetteurs autour.
- 5 joyaux (grand triangle bleu, grand triangle blanc, parallélogramme rouge, losange blanc, triangle jaune),
  orientés au hasard ; ils peuvent se toucher par un point, jamais par un côté.
- Un **mur** renvoie le laser d'où il vient, une **facette** le dévie à 90°.
- Le laser prend la couleur des joyaux touchés (ensemble de couleurs : toucher deux fois le même ne change rien).
- Un plan est accepté s'il donne les mêmes résultats que la salle sur **tous** les émetteurs. Une erreur coûte 2 tests.
- 3★ en dessous de 60 % des tirs nécessaires pour tout révéler, 2★ en dessous de ce total.
