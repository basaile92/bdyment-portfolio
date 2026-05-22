import { FormattedErrorCommandPort } from '../../../domain/console/port/FormattedErrorCommandPort';
import { ErrorCommandService } from '../../../domain/command/service/ErrorCommandService';

export class FormattedErrorCommandAdapter implements FormattedErrorCommandPort {
  private errorCommandService: ErrorCommandService;

  constructor(errorCommandService: ErrorCommandService) {
    this.errorCommandService = errorCommandService;
  }

  getFormattedErrorCommand(availableCommands: string): string {
    return this.errorCommandService.errorCommand(availableCommands);
  }
}
