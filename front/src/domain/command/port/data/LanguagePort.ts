import { Language } from '../../model/Language';

export interface LanguagePort {
  getLanguages(): Promise<Language[]>;
}
