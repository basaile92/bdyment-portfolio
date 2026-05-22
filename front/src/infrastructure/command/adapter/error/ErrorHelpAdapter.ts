import { ErrorHelpPort } from '../../../../domain/command/port/error/ErrorHelpPort';
import { HelpService } from '../../../../domain/command/service/HelpService';

export class ErrorHelpAdapter implements ErrorHelpPort {
  private helpService: HelpService;

  constructor(helpService: HelpService) {
    this.helpService = helpService;
  }

  help(
    parameter:
      | 'companies'
      | 'description'
      | 'help'
      | 'hobbies'
      | 'languages'
      | 'missions'
      | 'projects'
      | 'skills'
      | 'studies',
  ): Promise<string> {
    return this.helpService.help(parameter);
  }
}
