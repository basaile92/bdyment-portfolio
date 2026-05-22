import { gql } from 'graphql-request';
import { requestApi } from './api';
import { Mission } from '../../../../domain/command/model/Mission';
import { MissionPort } from '../../../../domain/command/port/data/MissionPort';

export class ApiMissionAdapter implements MissionPort {
  async getMissions(): Promise<Mission[]> {
    const missionsQuery = gql`
      query missions {
        missions {
          company
          websites
          role
          place
          description
          startYear
          endYear
          skills {
            name
            category
          }
        }
      }
    `;
    return (await requestApi(missionsQuery))['missions'];
  }

  async getMissionsBySkill(skillName: string): Promise<Mission[]> {
    const missionsQuery = gql`
      query missionsBySkill($skillName: String!) {
        missionsBySkill(skillName: $skillName) {
          company
          websites
          role
          place
          description
          startYear
          endYear
          skills {
            name
            category
          }
        }
      }
    `;
    const variables = { skillName: skillName };
    return (await requestApi(missionsQuery, variables))['missionsBySkill'];
  }

  async getMissionsByYear(year: number): Promise<Mission[]> {
    const missionsQuery = gql`
      query missionsByYear($year: Int!) {
        missionsByYear(year: $year) {
          company
          websites
          role
          place
          description
          startYear
          endYear
          skills {
            name
            category
          }
        }
      }
    `;
    const variables = { year: year };
    return (await requestApi(missionsQuery, variables))['missionsByYear'];
  }
}
