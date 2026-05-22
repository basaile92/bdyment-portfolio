import { gql } from 'graphql-request';
import { requestApi } from './api';
import { Availability } from '../../../../domain/command/model/Availability';
import { AvailabilityPort } from '../../../../domain/command/port/data/AvailabilityPort';

export class ApiAvailabilityAdapter implements AvailabilityPort {
  async getAvailability(): Promise<Availability> {
    const availabilityQuery = gql`
      query availability {
        availability {
          date
        }
      }
    `;
    return (await requestApi(availabilityQuery))['availability'];
  }
}
