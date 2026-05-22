import { gql } from 'apollo-server-lambda';
import { GraphQLElements } from './GraphQLElements';
import { HobbiesService } from '../../../domain/service/HobbiesService';

export class HobbiesGraphQLElements extends GraphQLElements {
  constructor(hobbiesService: HobbiesService) {
    const hobbies = hobbiesService.getHobbies;
    const hobbiesTypeDefs = gql`
      extend type Query {
        hobbies: [String]
      }
    `;

    const hobbiesResolvers = {
      Query: {
        hobbies,
      },
    };
    super(hobbiesTypeDefs, hobbiesResolvers);
  }
}
