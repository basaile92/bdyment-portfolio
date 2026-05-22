import { PortfolioDataRetrieverPort } from '../port/PortfolioDataRetrieverPort';

export class HelpService {
  private portfolioDataRetrieverPort: PortfolioDataRetrieverPort;

  constructor(portfolioDataRetrieverPort: PortfolioDataRetrieverPort) {
    this.portfolioDataRetrieverPort = portfolioDataRetrieverPort;
  }

  getHelp = () => {
    const sortedCommands = this.portfolioDataRetrieverPort
      .getCommands()
      .sort((command1, command2) => command1.command.localeCompare(command2.command));
    sortedCommands.forEach((command) =>
      command.usages.sort((usage1, usage2) => usage1.parameter.localeCompare(usage2.parameter)),
    );
    return sortedCommands;
  };

  getHelpByCommand = (_root: any, { commandLabel }: any) => {
    const command = this.getHelp().find((cmd) => cmd.command === commandLabel);
    if (command) {
      command.usages.sort((usage1, usage2) => usage1.parameter.localeCompare(usage2.parameter));
    }
    return command;
  };
}
