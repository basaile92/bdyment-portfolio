# Prismjack

Jeu de déduction : des joyaux sont cachés sous la verrière d'un musée. Allume les lampes
sur les bords, déduis la forme et la place des joyaux, dessine ton plan… et lance le casse.

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
| **Application** | `src/application` | Un cas d'usage par fichier : `startPrismjack`, `fireLaser`, `drawSurface`, `markEmpty`, `clearPlan`, `submitPlan`, `planHistory` (annuler), `modes` (niveaux, casse du jour, La Cavale, leçons), `lessons` (tutoriel jouable), `recordPrismjack`. État immuable. | domaine, ports |
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
- **Noms du métier** : `Prismjack`, `Shot`, `Surface`, `Facet`, `Jewel`, `traceLaser`…
- **Tests d'abord sur le cœur** : le domaine et les cas d'usage se testent en millisecondes, sans navigateur.
- ESLint signale aussi les fonctions trop longues (> 40 lignes), trop complexes ou avec trop de paramètres.

## Modes et confort de jeu

- **Tutoriel jouable** : 4 leçons guidées (murs, facettes, couleurs, piliers), reprises là où on s'est arrêté.
- **Niveaux** : 50 salles (facile, moyen, difficile, extrême, cauchemar), débloquées une à une.
- **Casse du jour** : le même musée pour tout le monde, une seule tentative, pris dans une liste dédiée et figée
  (`dailyRooms.ts`, 371 salles) ; plus dur au fil de la semaine, sans répétition pendant un an.
- **La Cavale** : des salles à la suite, de plus en plus dures, jusqu'à ce que le gardien rattrape le voleur.
- Tracer : près d'un bord de case = mur, le long d'une diagonale = facette ; on peut glisser avant de lâcher. Annuler / Rétablir.
- Option : une forme par couleur (▲ ■ ● ◆), y compris sur le prisme.
- Alarme : un cran au-delà du repère de la jauge, un cran par plan faux ; à 3, le gardien arrive. Après un plan faux, une lampe en désaccord est entourée.
- Jeu au clavier (flèches, Entrée, h/b/g/d pour les murs, / et \ pour les facettes, v pour vide) et annonces pour lecteurs d'écran.
- Respecte « réduire les animations » ; polices embarquées (fonctionne hors ligne) ; écran « trop petit » sous 320 × 500.
- Sauvegarde validée et versionnée (`progressCodec.ts`), écrite dans l'ordre (`StoredProgress.ts`) ; écran de secours en cas d'erreur.

## Règles du jeu (résumé)

- Grilles de 5 × 5 à 9 × 9, une lampe au bout de chaque rangée et de chaque colonne.
- 1 à 7 joyaux, formes et couleurs données par le butin, tournés ou retournés ; jamais collés par un côté plat.
- Un **côté plat** renvoie la lumière d'où elle vient (↩), une **facette** la fait tourner à angle droit.
- La lumière prend la couleur de chaque joyau touché ; piliers noir (avale), incolore (renvoie sans couleur), prisme (couleur qui change à chaque test).
- Un plan est accepté s'il donne les mêmes résultats que la salle sur **toutes** les lampes.
