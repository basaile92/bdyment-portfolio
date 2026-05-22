import { ErrorCommandFormatterPort } from '../../../../domain/command/port/format/ErrorCommandFormatterPort';

export class ErrorCommandFormatterAdapter implements ErrorCommandFormatterPort {
  format(availableCommands: string): string {
    return `<div class="error">Wrong command</div><div class="label">Available commands:</div>${availableCommands}`;
  }
}
