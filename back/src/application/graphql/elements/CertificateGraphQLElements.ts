import { gql } from 'apollo-server-lambda';
import { GraphQLElements } from './GraphQLElements';
import { CertificateService } from '../../../domain/service/CertificateService';

export class CertificateGraphQLElements extends GraphQLElements {
  constructor(certificateService: CertificateService) {
    const certificates = certificateService.getCertificates;
    const certificatesBySkill = certificateService.getCertificatesBySkill;
    const certificatesTypeDefs = gql`
      type Certificate {
        certifier: String
        skill: String
        year: Int
        link: String
      }

      extend type Query {
        certificates: [Certificate]
        certificatesBySkill(skill: String!): [Certificate]
      }
    `;
    const certificatesResolvers = {
      Query: {
        certificatesBySkill,
        certificates,
      },
    };
    super(certificatesTypeDefs, certificatesResolvers);
  }
}
