import { requestApi } from './api';
import { gql } from 'graphql-request';
import { HobbyPort } from '../../../../domain/command/port/data/HobbyPort';

export class ApiHobbyAdapter implements HobbyPort {
  async getHobbies(): Promise<string[]> {
    const hobbyQuery = gql`
      query hobbies {
        hobbies
      }
    `;
    return (await requestApi(hobbyQuery))['hobbies'];
  }
}
