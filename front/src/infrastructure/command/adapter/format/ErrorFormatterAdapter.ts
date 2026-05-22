import { ErrorFormatterPort } from '../../../../domain/command/port/format/ErrorFormatterPort';

export class ErrorFormatterAdapter implements ErrorFormatterPort {
  format(helpValue: string): string {
    return `<div class="error">Wrong parameter</div><div class="label">Available usages:</div>${helpValue}`;
  }
}
