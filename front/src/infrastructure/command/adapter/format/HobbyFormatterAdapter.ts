import { HobbyFormatterPort } from '../../../../domain/command/port/format/HobbyFormatterPort';
import { separateByComma } from './separation-utils';

export class HobbyFormatterAdapter implements HobbyFormatterPort {
  format(hobbies: string[]): string {
    if (hobbies.length === 0) {
      return '';
    }
    return hobbies.map(this.hobbiesToString).reduce(separateByComma);
  }

  private hobbiesToString(hobbies: string): string {
    return `<span class="important-value">${hobbies}</span>`;
  }
}
