export const commands = [
  {
    command: 'availability',
    usages: [
      {
        parameter: '',
        description: "show the Basile Dyment's date of availability.",
      },
    ],
  },
  {
    command: 'certificates',
    usages: [
      {
        parameter: '',
        description: 'show all the certificates',
      },
      {
        parameter: '{skill}',
        description: 'show all the certificates linked to a {skill}',
      },
    ],
  },
  {
    command: 'help',
    usages: [
      {
        parameter: '',
        description:
          'show the available usages and the description of all commands sorted alphabetically by command and by parameter.',
      },
      {
        parameter: '{command}',
        description:
          'show the usages, its formats and the description of the {command} sorted alphabetically by parameter.',
      },
    ],
  },
  {
    command: 'description',
    usages: [
      {
        parameter: '',
        description: 'show the main description of Basile Dyment: name, age, job.',
      },
    ],
  },
  {
    command: 'skills',
    usages: [
      {
        parameter: '',
        description: 'show all the skills by categories.',
      },
      {
        parameter: '{category}',
        description: 'show the skills associated to one {category}.',
      },
    ],
  },
  {
    command: 'languages',
    usages: [
      {
        parameter: '',
        description: 'show the spoken languages and the level of each.',
      },
    ],
  },
  {
    command: 'hobbies',
    usages: [
      {
        parameter: '',
        description: 'show the hobbies.',
      },
    ],
  },
  {
    command: 'studies',
    usages: [
      {
        parameter: '',
        description: 'show the studies, the years and the diploma sorted from most recent to older.',
      },
      {
        parameter: '{year}',
        description: 'show the studies of the {year}, the years and the diploma sorted from most recent to older.',
      },
    ],
  },
  {
    command: 'companies',
    usages: [
      {
        parameter: '',
        description: 'show the companies, the years, and their description sorted from most recent to older.',
      },
      {
        parameter: '{year}',
        description: 'show the companies and their description based on the {year} sorted from most recent to older.',
      },
    ],
  },
  {
    command: 'missions',
    usages: [
      {
        parameter: '',
        description:
          'show the missions, their description, the year and the skills used sorted from most recent to older.',
      },
      {
        parameter: '{year}',
        description:
          'show the missions of the {year}, the description and the skills used sorted from most recent to older.',
      },
      {
        parameter: '{skill}',
        description:
          'show the missions of the {skill}, their description, the year and the skills used sorted from most recent to older.',
      },
    ],
  },
  {
    command: 'projects',
    usages: [
      {
        parameter: '',
        description:
          'show the projects, their description, the year and the skills used sorted from most recent to older.',
      },
      {
        parameter: '{year}',
        description:
          'show the projects of the {year}, the description and the skills used sorted from most recent to older.',
      },
      {
        parameter: '{skill}',
        description:
          'show the projects of the {skill}, their description, the year and the skills used sorted from most recent to older.',
      },
    ],
  },
];
