import { Command } from '../../../src/domain/model/model';

export const COMMAND_TO_SEARCH = 'command2';
export const COMMAND_1: Command = {
  command: COMMAND_TO_SEARCH,
  usages: [
    {
      parameter: 'par1',
      description: 'description1',
    },
    {
      parameter: '',
      description: 'description2',
    },
  ],
};
export const COMMAND_2: Command = {
  command: 'command3',
  usages: [
    {
      parameter: 'par3',
      description: 'description3',
    },
    {
      parameter: 'par4',
      description: 'description4',
    },
  ],
};
export const COMMAND_3: Command = {
  command: 'command1',
  usages: [
    {
      parameter: '',
      description: 'description5',
    },
  ],
};

export const COMMANDS: Command[] = [COMMAND_1, COMMAND_2, COMMAND_3];
