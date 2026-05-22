import { gql } from 'graphql-request';
import { requestApi } from './api';
import { Certificate } from '../../../../domain/command/model/Certificate';
import { CertificatePort } from '../../../../domain/command/port/data/CertificatePort';

export class ApiCertificateAdapter implements CertificatePort {
  async getCertificates(): Promise<Certificate[]> {
    const certificatesQuery = gql`
      query certificates {
        certificates {
          certifier
          skill
          year
          link
        }
      }
    `;
    return (await requestApi(certificatesQuery))['certificates'];
  }

  async getCertificatesBySkill(skill: string): Promise<Certificate[]> {
    const certificatesQuery = gql`
      query certificatesBySkill($skill: String!) {
        certificatesBySkill(skill: $skill) {
          certifier
          skill
          year
          link
        }
      }
    `;
    const variables = { skill: skill };
    return (await requestApi(certificatesQuery, variables))['certificatesBySkill'];
  }
}
