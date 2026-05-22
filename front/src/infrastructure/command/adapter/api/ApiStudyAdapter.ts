import { Study } from '../../../../domain/command/model/Study';
import { gql } from 'graphql-request';
import { requestApi } from './api';
import { StudyPort } from '../../../../domain/command/port/data/StudyPort';

export class ApiStudyAdapter implements StudyPort {
  async getStudies(): Promise<Study[]> {
    const studiesQuery = gql`
      query studies {
        studies {
          label
          place
          school
          startYear
          endYear
          diploma
          degree
        }
      }
    `;
    return (await requestApi(studiesQuery))['studies'];
  }

  async getStudiesByYear(year: number): Promise<Study[]> {
    const studiesQuery = gql`
      query studiesByYear($year: Int!) {
        studiesByYear(year: $year) {
          label
          place
          school
          startYear
          endYear
          diploma
          degree
        }
      }
    `;
    const variables = { year: year };
    return (await requestApi(studiesQuery, variables))['studiesByYear'];
  }
}
