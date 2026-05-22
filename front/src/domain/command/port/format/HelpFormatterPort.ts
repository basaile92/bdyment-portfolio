import { Command } from '../../model/Command';

export interface HelpFormatterPort {
  formatMultiple(commands: Command[]): string;
  format(command: Command): string;
}
