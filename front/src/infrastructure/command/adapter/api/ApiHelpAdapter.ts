import { gql } from 'graphql-request';
import { requestApi } from './api';
import { Command } from '../../../../domain/command/model/Command';
import { HelpPort } from '../../../../domain/command/port/data/HelpPort';

export class ApiHelpAdapter implements HelpPort {
  async getHelp(): Promise<Command[]> {
    const helpQuery = gql`
      query help {
        help {
          command
          usages {
            parameter
            description
          }
        }
      }
    `;
    return (await requestApi(helpQuery))['help'];
  }

  async getHelpByCommands(commandLabel: string): Promise<Command> {
    const helpQuery = gql`
      query helpByCommand($commandLabel: String!) {
        helpByCommand(commandLabel: $commandLabel) {
          command
          usages {
            parameter
            description
          }
        }
      }
    `;
    const variables = { commandLabel: commandLabel };
    return (await requestApi(helpQuery, variables))['helpByCommand'];
  }
}
