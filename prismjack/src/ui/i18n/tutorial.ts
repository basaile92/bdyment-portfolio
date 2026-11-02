/**
 * The tutorial, page by page. `**bold**` is emphasised. Each page's picture is chosen by its id
 * (see HelpSheet.svelte). Short on purpose: one idea per page, two or three sentences, the picture
 * does the rest. Checked with players who knew nothing: they cleared easy, medium and hard levels.
 */
export interface TutorialPage {
  readonly id: string;
  readonly title: string;
  /** Paragraphs. */
  readonly body: readonly string[];
}

export const TUTORIAL_FR: readonly TutorialPage[] = [
  {
    id: 'lore',
    title: 'L’histoire',
    body: [
      'Tu es **Prismjack**, cambrioleur. Sous la verrière dépolie d’un musée, des **joyaux** sont cachés. Tu ne vois rien : tu vas les trouver **grâce à tes lampes**.',
    ],
  },
  {
    id: 'goal',
    title: 'Le but',
    body: [
      'Le **butin**, sous la salle, donne la forme et la couleur de chaque joyau (il peut être tourné ou retourné). **Dessine chaque joyau à sa place exacte**, puis appuie sur **GO**.',
    ],
  },
  {
    id: 'torch',
    title: 'Les lampes',
    body: [
      'Touche une **lampe** : sa lumière traverse la salle **tout droit** et allume la lampe où elle ressort, avec le même numéro.',
      'Ressortie **en face, sans couleur** (lampe barrée) : toute la ligne est **vide**. Un trajet marche dans les deux sens : rallumer une lampe déjà allumée est gratuit.',
    ],
  },
  {
    id: 'wall',
    title: 'Les murs',
    body: [
      'Les **côtés plats** d’un joyau sont des murs : la lumière **revient à sa propre lampe**, marquée **↩**.',
      '↩ veut toujours dire **un côté plat**, parfois après un virage.',
    ],
  },
  {
    id: 'facet',
    title: 'Les facettes',
    body: [
      'Les **diagonales** sont des facettes : la lumière **tourne à angle droit**. Un seul virage ? La facette est **au croisement** des deux lignes.',
      'Dans une demi-case, la lumière tourne si elle entre par le **côté ouvert**, et revient (↩) si elle frappe un **côté plat**. Elle peut tourner plusieurs fois avant de ressortir.',
    ],
  },
  {
    id: 'colors',
    title: 'Les couleurs',
    body: [
      'Chaque joyau touché **ajoute sa couleur** : la lampe montre toutes les couleurs touchées, côte à côte.',
      'Le **blanc** est une couleur de joyau ; **sans couleur** (lampe barrée) veut dire « rien touché ».',
    ],
  },
  {
    id: 'shapes',
    title: 'Dessiner',
    body: [
      '**Tracer** : touche une case **près d’un bord** pour un mur, **vers le centre** pour une facette. **Vide** marque une case sûre, la **gomme** efface.',
      'Deux joyaux ne collent **jamais un côté plat contre un côté plat** (un coin ou une diagonale, oui) et ne partagent aucune case.',
    ],
  },
  {
    id: 'go',
    title: 'GO et l’alarme',
    body: [
      '**GO** réussit si ton plan donne **le même résultat que la salle pour chaque lampe**, même celles jamais allumées : dans le doute, teste.',
      'Dépasser le **repère** de la jauge fait monter l’alarme d’un cran, un plan faux aussi. **À 3, le gardien arrive.**',
    ],
  },
  {
    id: 'pillars',
    title: 'Les piliers',
    body: [
      'Certaines salles ont des **piliers**, déjà visibles. **Noir** : avale la lumière. **Incolore** : la renvoie sans la colorer.',
      '**Prisme** : la renvoie avec la couleur de sa **pastille entourée** ; après chaque test qui le touche, la pastille avance d’un cran (l’image montre l’état après le test). L’ordre de tes tests compte ; si sa pastille n’a pas bougé, il n’y est pour rien.',
    ],
  },
  {
    id: 'method',
    title: 'La méthode',
    body: [
      'Commence par le **milieu des côtés** : chaque ligne vide élimine des places. Confronte chaque résultat aux **formes du butin**, puis **teste la lampe qui départage** tes hypothèses.',
    ],
  },
];

export const TUTORIAL_EN: readonly TutorialPage[] = [
  {
    id: 'lore',
    title: 'The story',
    body: [
      'You are **Prismjack**, a burglar. Under the frosted glass roof of a museum, **jewels** are hidden. You can’t see a thing: you will find them **with your torches**.',
    ],
  },
  {
    id: 'goal',
    title: 'The goal',
    body: [
      'The **loot**, under the room, gives each jewel’s shape and colour (it may be rotated or flipped). **Draw every jewel in its exact place**, then press **GO**.',
    ],
  },
  {
    id: 'torch',
    title: 'Torches',
    body: [
      'Tap a **torch**: its light crosses the room **straight** and lights the torch where it comes out, with the same number.',
      'Out **opposite, with no colour** (crossed-out torch): the whole line is **empty**. A path works both ways: lighting a torch that is already lit is free.',
    ],
  },
  {
    id: 'wall',
    title: 'Walls',
    body: [
      'A jewel’s **straight edges** are walls: the light **comes back to its own torch**, marked **↩**.',
      '↩ always means **a straight wall**, sometimes after a turn.',
    ],
  },
  {
    id: 'facet',
    title: 'Facets',
    body: [
      '**Diagonals** are facets: the light **turns at right angles**. Only one turn? The facet sits **where the two lines cross**.',
      'In a half cell, light turns if it enters through the **open side**, and comes back (↩) if it hits a **straight side**. It may turn several times before coming out.',
    ],
  },
  {
    id: 'colors',
    title: 'Colours',
    body: [
      'Every jewel touched **adds its colour**: the torch shows all the colours touched, side by side.',
      '**White** is a jewel colour; **no colour** (crossed-out torch) means “nothing touched”.',
    ],
  },
  {
    id: 'shapes',
    title: 'Drawing',
    body: [
      '**Draw**: tap a cell **near an edge** for a wall, **towards the centre** for a facet. **Empty** marks a safe cell, the **eraser** wipes.',
      'Two jewels never put **a straight edge against a straight edge** (a corner or a diagonal is fine) and never share a cell.',
    ],
  },
  {
    id: 'go',
    title: 'GO and the alarm',
    body: [
      '**GO** succeeds if your plan gives **the same result as the room for every torch**, even those never lit: when in doubt, test.',
      'Going past the gauge’s **mark** raises the alarm one level, and so does a wrong plan. **At 3, the guard arrives.**',
    ],
  },
  {
    id: 'pillars',
    title: 'Pillars',
    body: [
      'Some rooms have **pillars**, visible from the start. **Black**: swallows the light. **Clear**: sends it on without colouring it.',
      '**Prism**: sends it on with the colour of its **ringed dot**; after every test that touches it, the dot moves on one step (the picture shows it after the test). The order of your tests matters; if its dot didn’t move, it played no part.',
    ],
  },
  {
    id: 'method',
    title: 'The method',
    body: [
      'Start with the **middle of the sides**: every empty line rules out places. Hold each result against the **loot shapes**, then **test the torch that tells** your guesses apart.',
    ],
  },
];
