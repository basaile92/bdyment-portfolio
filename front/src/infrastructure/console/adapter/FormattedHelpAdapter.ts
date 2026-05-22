import { HelpService } from '../../../domain/command/service/HelpService';
import { FormattedHelpPort } from '../../../domain/console/port/FormattedHelpPort';

export class FormattedHelpAdapter implements FormattedHelpPort {
  private helpService: HelpService;

  constructor(helpService: HelpService) {
    this.helpService = helpService;
  }

  getFormattedHelp(parameter: string): Promise<string> {
    return this.helpService.help(parameter);
  }
}
