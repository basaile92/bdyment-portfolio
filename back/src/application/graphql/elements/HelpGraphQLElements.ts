import { gql } from 'apollo-server-lambda';
import { GraphQLElements } from './GraphQLElements';
import { HelpService } from '../../../domain/service/HelpService';

export class HelpGraphQLElements extends GraphQLElements {
  constructor(helpService: HelpService) {
    const help = helpService.getHelp;
    const helpByCommand = helpService.getHelpByCommand;
    const helpTypeDefs = gql`
      type Usage {
        parameter: String!
        description: String!
      }

      type Command {
        command: String!
        usages: [Usage]!
      }

      extend type Query {
        help: [Command]
        helpByCommand(commandLabel: String!): Command
      }
    `;

    const helpResolvers = {
      Query: {
        helpByCommand,
        help,
      },
    };
    super(helpTypeDefs, helpResolvers);
  }
}
