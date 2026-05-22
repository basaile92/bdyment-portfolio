import { gql } from 'apollo-server-lambda';
import { GraphQLElements } from './GraphQLElements';
import { SkillService } from '../../../domain/service/SkillService';

export class SkillGraphQLElements extends GraphQLElements {
  constructor(skillService: SkillService) {
    const skills = skillService.getSkills;
    const skillsByCategory = skillService.getSkillsByCategory;
    const skillsTypeDefs = gql`
      type Skill {
        name: String
        category: String
      }

      extend type Query {
        skills: [Skill]
        skillsByCategory(category: String!): [Skill]
      }
    `;

    const skillsResolvers = {
      Query: {
        skillsByCategory,
        skills,
      },
    };
    super(skillsTypeDefs, skillsResolvers);
  }
}
