import { gql } from 'graphql-request';
import { requestApi } from './api';
import { Language } from '../../../../domain/command/model/Language';
import { LanguagePort } from '../../../../domain/command/port/data/LanguagePort';

export class ApiLanguageAdapter implements LanguagePort {
  async getLanguages(): Promise<Language[]> {
    const languagesQuery = gql`
      query languages {
        languages {
          name
          level
        }
      }
    `;
    return (await requestApi(languagesQuery))['languages'];
  }
}
