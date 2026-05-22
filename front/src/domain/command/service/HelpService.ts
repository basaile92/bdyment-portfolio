import { HelpPort } from '../port/data/HelpPort';
import { HelpFormatterPort } from '../port/format/HelpFormatterPort';

export class HelpService {
  private helpPort: HelpPort;
  private helpFormatterPort: HelpFormatterPort;

  constructor(helpPort: HelpPort, helpFormatterPort: HelpFormatterPort) {
    this.helpPort = helpPort;
    this.helpFormatterPort = helpFormatterPort;
  }
  async help(parameter: string): Promise<string> {
    if (!parameter) {
      return this.helpFormatterPort.formatMultiple(await this.helpPort.getHelp());
    }
    return this.helpFormatterPort.format(await this.helpPort.getHelpByCommands(parameter));
  }
}
