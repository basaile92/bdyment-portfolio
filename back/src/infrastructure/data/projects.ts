export const projects = [
  {
    name: 'Prismjack',
    websites: ['https://bdyment.com/prismjack/'],
    role: 'Game designer and developer',
    description:
      'Independent design and development of Prismjack, a solo laser deduction game for mobile and browser, playable on this site with the prismjack command. Five jewels are hidden in a museum room: the player fires lasers from the walls, reads how they bounce and change colour, then draws the jewels edge by edge.\n- Front-end in TypeScript and Svelte 5 built with Vite, the room drawn in SVG, sounds synthesised with the Web Audio API, installable as a PWA and packaged for iOS and Android with Capacitor. \n- Clean Architecture (domain, use cases, ports, adapters, UI) with the dependency rule enforced by ESLint, unit tests with Vitest and end-to-end checks with Playwright. \n- Daily heist identical for every player without a back-end (seeded generation), training rooms, star scoring, French and English. \n- Vibe-coded with Claude (Anthropic): I directed the game design, the rules and every UI/UX decision in conversation, while Claude and Claude Code agents wrote the code, ran the UI/UX audits and handled the architecture. \n- Deployed on AWS S3 and Cloudfront with AWS CDK and Github Actions, alongside this portfolio.',
    startYear: 2026,
    endYear: 2026,
    skills: [
      {
        name: 'Typescript',
        category: 'Front-end',
      },
      {
        name: 'Svelte',
        category: 'Front-end',
      },
      {
        name: 'Vite',
        category: 'Front-end',
      },
      {
        name: 'SVG',
        category: 'Front-end',
      },
      {
        name: 'Web Audio API',
        category: 'Front-end',
      },
      {
        name: 'PWA',
        category: 'Front-end',
      },
      {
        name: 'Capacitor',
        category: 'Front-end',
      },
      {
        name: 'Clean architecture',
        category: 'Software-craftmanship',
      },
      {
        name: 'Clean code',
        category: 'Software-craftmanship',
      },
      {
        name: 'Vitest',
        category: 'Software-craftmanship',
      },
      {
        name: 'Playwright',
        category: 'Software-craftmanship',
      },
      {
        name: 'ESLint',
        category: 'Software-craftmanship',
      },
      {
        name: 'AWS S3',
        category: 'Ops-tools',
      },
      {
        name: 'AWS Cloudfront',
        category: 'Ops-tools',
      },
      {
        name: 'AWS CDK',
        category: 'Ops-tools',
      },
      {
        name: 'Github Actions',
        category: 'Ops-tools',
      },
      {
        name: 'Git',
        category: 'Versioning-tools',
      },
      {
        name: 'Claude',
        category: 'AI-tools',
      },
      {
        name: 'Claude Code',
        category: 'AI-tools',
      },
      {
        name: 'Vibe coding',
        category: 'AI-tools',
      },
      {
        name: 'Game design',
        category: 'Videogame-development',
      },
    ],
  },
  {
    name: 'My portfolio',
    websites: [
      'https://bdyment.com',
      'https://github.com/basaile92/bdyment-portfolio-back',
      'https://github.com/basaile92/bdyment-portfolio-front',
      'https://github.com/basaile92/bdyment-portfolio-infra',
    ],
    role: 'Full-Stack developer',
    description:
      'Independent development of a portfolio, which displays my various professional information based on commands. The code for this application is publicly available on my Github\n- Back-end development in JavaScript and GraphQL running on an AWS lambda executed by the request received by AWS API-Gateway. \n- Front-end development in React JS, hosted in an S3 bucket, distributed by Cloudfront. \n- Development of an infra project, grouping in AWS CDK all the AWS stack to be deployed. \n- Creation of Github actions script allowing to create a release for the back-end project and the front-end project and to retrieve the latest releases in the infra project in order to deploy the AWS stack and update the web application.',
    startYear: 2024,
    endYear: 2024,
    skills: [
      {
        name: 'Typescript',
        category: 'Back-end',
      },
      {
        name: 'Node JS',
        category: 'Back-end',
      },
      {
        name: 'Express',
        category: 'Back-end',
      },
      {
        name: 'GraphQL',
        category: 'Back-end',
      },
      {
        name: 'React',
        category: 'Back-end',
      },
      {
        name: 'AWS Lambda',
        category: 'Back-end',
      },
      {
        name: 'AWS CDK',
        category: 'Ops-tools',
      },
      {
        name: 'AWS API-Gateway',
        category: 'Ops-tools',
      },
      {
        name: 'AWS Route 53',
        category: 'Ops-tools',
      },
      {
        name: 'AWS S3',
        category: 'Back-end',
      },
      {
        name: 'AWS Cloudfront',
        category: 'Ops-tools',
      },
      {
        name: 'Github Actions',
        category: 'Ops-tools',
      },
      {
        name: 'Git',
        category: 'Versioning-tools',
      },
    ],
  },
  {
    name: 'WDMAM v2',
    websites: ['https://wdmam.org'],
    role: 'Full-Stack developer',
    description:
      'Independent development of version 2 of a web application in the field of marine geosciences. The application allows downloading files containing magnetic anomalies aggregated by the WDMAM project.\n- Back-end development in Java Quarkus Native or in python of 10 AWS lambdas executed by the requests received by AWS API-Gateway and a lambda executed by the messages received on an SQS queue. The Java lambdas are developed in hexagonal architecture. \n- Front-end development in React JS, hosted in an S3 bucket, distributed by Cloudfront. \n- Development of an infra project, grouping in AWS CDK all the AWS stack to be deployed. \n- Creation of a Github actions script allowing to create a release for the back-end project and the front-end project and to retrieve the latest releases in the infra project in order to deploy the AWS stack and update the web application.',
    startYear: 2023,
    endYear: 2023,
    skills: [
      {
        name: 'Java',
        category: 'Back-end',
      },
      {
        name: 'Quarkus',
        category: 'Back-end',
      },
      {
        name: 'Python',
        category: 'Back-end',
      },
      {
        name: 'AWS Lambda',
        category: 'Back-end',
      },
      {
        name: 'AWS CDK',
        category: 'Ops-tools',
      },
      {
        name: 'AWS API-Gateway',
        category: 'Ops-tools',
      },
      {
        name: 'AWS Route 53',
        category: 'Ops-tools',
      },
      {
        name: 'AWS S3',
        category: 'Back-end',
      },
      {
        name: 'AWS SQS',
        category: 'Back-end',
      },
      {
        name: 'AWS SES',
        category: 'Back-end',
      },
      {
        name: 'AWS Cloudfront',
        category: 'Ops-tools',
      },
      {
        name: 'AWS Cognito',
        category: 'Back-end',
      },
      {
        name: 'React',
        category: 'Front-end',
      },
      {
        name: 'Github Actions',
        category: 'Ops-tools',
      },
      {
        name: 'Git',
        category: 'Versioning-tools',
      },
    ],
  },
  {
    name: 'Eh mec elle est ou ma 4L',
    role: 'Videogame developer',
    description:
      'Development of an android game. The player is playing a Renault 4L and has to avoid the other car on the road.',
    startYear: 2017,
    endYear: 2017,
    skills: [
      {
        name: 'Unity 3D',
        category: 'Videogame-development',
      },
      {
        name: 'C#',
        category: 'Back-end',
      },
    ],
  },
  {
    name: 'WDMAM',
    role: 'Full-Stack developer',
    description:
      'Development of a web application in the field of marine geosciences. This is the first web application, I made from scratch.',
    startYear: 2015,
    endYear: 2015,
    skills: [
      {
        name: 'PHP',
        category: 'Back-end',
      },
      {
        name: 'HTML',
        category: 'Front-end',
      },
      {
        name: 'CSS',
        category: 'Front-end',
      },
    ],
  },
];
