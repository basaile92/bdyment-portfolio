import { ErrorHelpPort } from '../port/error/ErrorHelpPort';
import { ErrorFormatterPort } from '../port/format/ErrorFormatterPort';

export class ErrorService {
  private errorHelpPort: ErrorHelpPort;
  private errorFormatterPort: ErrorFormatterPort;

  constructor(errorPort: ErrorHelpPort, errorFormatterPort: ErrorFormatterPort) {
    this.errorHelpPort = errorPort;
    this.errorFormatterPort = errorFormatterPort;
  }
  parameterError(
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
    return this.errorHelpPort.help(parameter).then((result: string) => {
      return new Promise((resolve) => resolve(this.errorFormatterPort.format(result)));
    });
  }
}
