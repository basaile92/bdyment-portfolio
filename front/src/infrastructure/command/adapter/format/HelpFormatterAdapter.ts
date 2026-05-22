import { Command, Usage } from '../../../../domain/command/model/Command';
import { HelpFormatterPort } from '../../../../domain/command/port/format/HelpFormatterPort';
import { noSeparation, separateByNewLine } from './separation-utils';

export class HelpFormatterAdapter implements HelpFormatterPort {
  formatMultiple(commands: Command[]): string {
    return commands.map((command) => this.format(command)).reduce(noSeparation, '');
  }

  format(command: Command): string {
    return command.usages.flatMap((usage) => this.usageToString(command.command, usage)).reduce(separateByNewLine, '');
  }

  private usageToString(command: string, usage: Usage): string {
    return `<div><span class="subject">${command}</span>${usage.parameter.length === 0 ? ':' : ''}
          ${usage.parameter.length === 0 ? '' : `<span class="parameter"> ${usage.parameter}</span>:`}
          ${this.showBetterParameter(usage.description)}</div>`;
  }

  private showBetterParameter(parameter: string): string {
    return parameter.replace('{', "<span class='parameter'>{").replace('}', '}</span>');
  }
}
