import { gql } from 'graphql-request';
import { requestApi } from './api';
import { Project } from '../../../../domain/command/model/Project';
import { ProjectPort } from '../../../../domain/command/port/data/ProjectPort';

export class ApiProjectAdapter implements ProjectPort {
  async getProjects(): Promise<Project[]> {
    const projectsQuery = gql`
      query projects {
        projects {
          name
          websites
          role
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
    return (await requestApi(projectsQuery))['projects'];
  }

  async getProjectsBySkill(skillName: string): Promise<Project[]> {
    const projectsQuery = gql`
      query projectsBySkill($skillName: String!) {
        projectsBySkill(skillName: $skillName) {
          name
          websites
          role
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
    return (await requestApi(projectsQuery, variables))['projectsBySkill'];
  }

  async getProjectsByYear(year: number): Promise<Project[]> {
    const projectsQuery = gql`
      query projectsByYear($year: Int!) {
        projectsByYear(year: $year) {
          name
          websites
          role
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
    return (await requestApi(projectsQuery, variables))['projectsByYear'];
  }
}
