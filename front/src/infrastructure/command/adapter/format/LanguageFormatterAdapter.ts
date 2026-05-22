import { Language } from '../../../../domain/command/model/Language';
import { LanguageFormatterPort } from '../../../../domain/command/port/format/LanguageFormatterPort';
import { separateByNewLine } from './separation-utils';

export class LanguageFormatterAdapter implements LanguageFormatterPort {
  format(languages: Language[]): string {
    return languages.map(this.languageToString).reduce(separateByNewLine, '');
  }

  private languageToString(language: Language): string {
    return `<div><span class="subject">${language.name}:</span> <span class="${language.level.toLowerCase()}">${language.level}</span></div>`;
  }
}
