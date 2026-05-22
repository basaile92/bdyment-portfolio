import { gql } from 'graphql-request';
import { requestApi } from './api';
import { Company } from '../../../../domain/command/model/Company';
import { CompanyPort } from '../../../../domain/command/port/data/CompanyPort';

export class ApiCompanyAdapter implements CompanyPort {
  async getCompanies(): Promise<Company[]> {
    const companyQuery = gql`
      query companies {
        companies {
          name
          website
          role
          place
          startYear
          endYear
          description
        }
      }
    `;
    return (await requestApi(companyQuery))['companies'];
  }

  async getCompaniesByYear(year: number): Promise<Company[]> {
    const companyQuery = gql`
      query companiesByYear($year: Int!) {
        companiesByYear(year: $year) {
          name
          website
          role
          place
          startYear
          endYear
          description
        }
      }
    `;
    const variables = { year: year };
    return (await requestApi(companyQuery, variables))['companiesByYear'];
  }
}
