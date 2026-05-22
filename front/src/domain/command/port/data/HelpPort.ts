import { Command } from '../../model/Command';

export interface HelpPort {
  getHelp(): Promise<Command[]>;

  getHelpByCommands(commandLabel: string): Promise<Command>;
}
