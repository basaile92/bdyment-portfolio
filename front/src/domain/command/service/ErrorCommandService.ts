import { ErrorCommandFormatterPort } from '../port/format/ErrorCommandFormatterPort';

export class ErrorCommandService {
  private errorCommandFormatterPort: ErrorCommandFormatterPort;

  constructor(errorCommandFormatterPort: ErrorCommandFormatterPort) {
    this.errorCommandFormatterPort = errorCommandFormatterPort;
  }

  errorCommand(availableCommands: string) {
    return this.errorCommandFormatterPort.format(availableCommands);
  }
}
