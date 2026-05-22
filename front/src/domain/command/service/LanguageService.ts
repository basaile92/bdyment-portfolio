import { LanguagePort } from '../port/data/LanguagePort';
import { ErrorService } from './ErrorService';
import { LanguageFormatterPort } from '../port/format/LanguageFormatterPort';

export class LanguageService {
  private languagePort: LanguagePort;
  private languageFormatterPort: LanguageFormatterPort;
  private errorService: ErrorService;

  constructor(languagePort: LanguagePort, languageFormatterPort: LanguageFormatterPort, errorService: ErrorService) {
    this.languagePort = languagePort;
    this.languageFormatterPort = languageFormatterPort;
    this.errorService = errorService;
  }

  async languages(parameter: string): Promise<string> {
    if (!parameter) {
      return this.languageFormatterPort.format(await this.languagePort.getLanguages());
    }
    return this.errorService.parameterError('languages');
  }
}
