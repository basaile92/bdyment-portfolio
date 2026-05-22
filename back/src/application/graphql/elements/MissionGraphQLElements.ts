import { gql } from 'apollo-server-lambda';
import { GraphQLElements } from './GraphQLElements';
import { MissionService } from '../../../domain/service/MissionService';

export class MissionGraphQLElements extends GraphQLElements {
  constructor(missionService: MissionService) {
    const missions = missionService.getMissions;
    const missionsBySkill = missionService.getMissionsBySkill;
    const missionsByYear = missionService.getMissionsByYear;
    const missionsTypeDefs = gql`
      type Mission {
        company: String
        websites: [String]
        role: String
        place: String
        description: String
        startYear: Int
        endYear: Int
        skills: [Skill]
      }

      extend type Query {
        missions: [Mission]
        missionsByYear(year: Int!): [Mission]
        missionsBySkill(skillName: String!): [Mission]
      }
    `;

    const missionsResolvers = {
      Query: {
        missionsByYear,
        missionsBySkill,
        missions,
      },
    };
    super(missionsTypeDefs, missionsResolvers);
  }
}
