import { Language } from '../../model/Language';

export interface LanguageFormatterPort {
  format(languages: Language[]): string;
}
