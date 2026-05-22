import { Skill } from '../../../../domain/command/model/Skill';
import { gql } from 'graphql-request';
import { requestApi } from './api';
import { SkillPort } from '../../../../domain/command/port/data/SkillPort';

export class ApiSkillAdapter implements SkillPort {
  async getSkills(): Promise<Skill[]> {
    const skillsQuery = gql`
      query skills {
        skills {
          name
          category
        }
      }
    `;
    return (await requestApi(skillsQuery))['skills'];
  }

  async getSkillsByCategory(category: string): Promise<Skill[]> {
    const skillsQuery = gql`
      query skillsByCategory($category: String!) {
        skillsByCategory(category: $category) {
          category
          name
        }
      }
    `;
    const variables = { category: category };
    return (await requestApi(skillsQuery, variables))['skillsByCategory'];
  }
}
