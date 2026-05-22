import { gql } from 'apollo-server-lambda';
import { GraphQLElements } from './GraphQLElements';
import { CompanyService } from '../../../domain/service/CompanyService';

export class CompanyGraphQLElements extends GraphQLElements {
  constructor(companyService: CompanyService) {
    const companies = companyService.getCompanies;
    const companiesByYear = companyService.getCompaniesByYear;
    const companiesTypeDefs = gql`
      type Company {
        name: String
        website: String
        role: String
        place: String
        startYear: Int
        endYear: Int
        description: String
      }

      extend type Query {
        companies: [Company]
        companiesByYear(year: Int!): [Company]
      }
    `;

    const companiesResolvers = {
      Query: {
        companiesByYear,
        companies,
      },
    };
    super(companiesTypeDefs, companiesResolvers);
  }
}
