import { LanguageService } from '../../../domain/command/service/LanguageService';
import { FormattedLanguagePort } from '../../../domain/console/port/FormattedLanguagePort';

export class FormattedLanguageAdapter implements FormattedLanguagePort {
  private languageService: LanguageService;

  constructor(languageService: LanguageService) {
    this.languageService = languageService;
  }

  getFormattedLanguages(parameter: string): Promise<string> {
    return this.languageService.languages(parameter);
  }
}
