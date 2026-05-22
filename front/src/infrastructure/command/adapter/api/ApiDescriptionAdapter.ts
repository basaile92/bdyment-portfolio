import { gql } from 'graphql-request';
import { requestApi } from './api';
import { Description } from '../../../../domain/command/model/Description';
import { DescriptionPort } from '../../../../domain/command/port/data/DescriptionPort';

export class ApiDescriptionAdapter implements DescriptionPort {
  async getDescription(): Promise<Description> {
    const descriptionQuery = gql`
      query description {
        description {
          name
          age {
            timeInHour
            timeInDay
            timeInYear
          }
          job
          linkedin
          github
          presentation
        }
      }
    `;
    return (await requestApi(descriptionQuery))['description'];
  }
}
