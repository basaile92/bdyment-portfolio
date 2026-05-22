import { gql } from 'apollo-server-lambda';
import { GraphQLElements } from './GraphQLElements';
import { LanguageService } from '../../../domain/service/LanguageService';

export class LanguageGraphQLElements extends GraphQLElements {
  constructor(languagesService: LanguageService) {
    const languages = languagesService.getLanguages;
    const languagesTypeDefs = gql`
      type Language {
        name: String
        level: String
      }

      extend type Query {
        languages: [Language]
      }
    `;

    const languagesResolvers = {
      Query: {
        languages,
      },
    };
    super(languagesTypeDefs, languagesResolvers);
  }
}
