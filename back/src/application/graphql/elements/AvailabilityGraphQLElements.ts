import { gql } from 'apollo-server-lambda';
import { GraphQLElements } from './GraphQLElements';
import { AvailabilityService } from '../../../domain/service/AvailabilityService';

export class AvailabilityGraphQLElements extends GraphQLElements {
  constructor(availabilityService: AvailabilityService) {
    const availability = availabilityService.getAvailability;
    const availabilityTypeDefs = gql`
      type Availability {
        date: String
      }

      extend type Query {
        availability: Availability
      }
    `;
    const availabilityResolvers = {
      Query: {
        availability,
      },
    };
    super(availabilityTypeDefs, availabilityResolvers);
  }
}
